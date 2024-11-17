import { Command, ValidationError } from '../../deps.ts'
import { cloneRepo, runEngineSetup } from '../../lib/utils.ts'
import type { CliOptions } from '../../lib/types.ts'
import { config } from '../../lib/config.ts'
import { cmd } from '../../cmd.ts'

export const install = new Command()
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
		} = options
		const cfg = config.get(options as CliOptions)

		const newSource = source || cfg.engine.gitSource
		const newDestination = destination || cfg.engine.path

		if (!newSource) {
			throw new ValidationError('missing source')
		}
		if (!newDestination) {
			throw new ValidationError('missing destination')
		}
		try {
			await Deno.mkdir(newDestination)
		} catch (e) {
			if (e instanceof Deno.errors.AlreadyExists) {
				if (force && !dryRun) {
					console.log(`Deleting ${newDestination}`)
					await Deno.remove(newDestination, { recursive: true })
				} else {
					// Exit with a message instead of error so we can chain this install command
					console.log(
						`Destination ${newDestination} already exists, use --force to overwrite.`,
					)
					return
				}
			}
		}
		const clonedPath = await cloneRepo({
			source: newSource,
			destination: newDestination,
			branch,
			useMirror: false,
			dryRun,
		})
		if (setup) {
			await runEngineSetup({ enginePath: clonedPath, gitDependsCache: cfg.engine.gitDependenciesCachePath, dryRun })
		}
	})
