import { Command, ValidationError } from '../../deps.ts'
import { cloneRepo, runEngineSetup } from '../../lib/utils.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export type InstallOptions = typeof install extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const install = new Command<GlobalOptions>()
	.description('install engine from a source repository')
	.option('-b, --branch <branch:string>', 'git checkout (branch | tag)')
	.option('-f, --force', 'force overwrite of destination', { default: false })
	.option('-d, --dry-run', 'dry run', { default: false })
	.group('Post Clone Configuration')
	.option('-s, --setup', 'installs git dependencies (ie Setup.bat)')
	.env(
		'RUNREAL_GIT_DEPENDENCIES_CACHE_PATH=<gitDependenciesCachePath:string>',
		'Overide to git dependencies cache folder',
		{ prefix: 'RUNREAL_' },
	)
	.option(
		'-g, --git-dependencies-cache-path <gitDependenciesCachePath:file>',
		'git dependencies cache folder',
		{ depends: ['setup'] },
	)
	.option('--build', 'build the engine after cloning', {
		depends: ['setup'],
	})
	.arguments('[source:string] [destination:file]')
	.action(async (
		options,
		source,
		destination,
		...args
	) => {
		const {
			branch,
			force,
			dryRun,
			setup,
		} = options as InstallOptions

		const cfg = Config.getInstance().mergeConfigCLIConfig({ cliOptions: options })
		source = source || cfg.engine.gitSource
		destination = destination || cfg.engine.path

		if (!source) {
			throw new ValidationError('missing source')
		}
		if (!destination) {
			throw new ValidationError('missing destination')
		}
		try {
			await Deno.mkdir(destination)
		} catch (e) {
			if (e instanceof Deno.errors.AlreadyExists) {
				if (force && !dryRun) {
					console.log(`Deleting ${destination}`)
					await Deno.remove(destination, { recursive: true })
				} else {
					// Exit with a message instead of error so we can chain this install command
					console.log(
						`Destination ${destination} already exists, use --force to overwrite.`,
					)
					return
				}
			}
		}
		const clonedPath = await cloneRepo({
			source,
			destination,
			branch,
			useMirror: false,
			dryRun,
		})
		if (setup) {
			await runEngineSetup({ enginePath: clonedPath, gitDependsCache: cfg.engine.gitDependenciesCachePath, dryRun })
		}
	})
