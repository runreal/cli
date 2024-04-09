import { Command, ValidationError } from '../../deps.ts'
import { runEngineSetup } from '../../lib/utils.ts'
import { CliOptions } from '../../lib/types.ts'
import { config } from '../../lib/config.ts'
import { Source } from '../../lib/source.ts'

export type InstallOptions = typeof install extends Command<any, any, infer Options, any, any> ? Options
	: never

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
	.group('Git Mirror Configuration')
	.option('-m, --git-mirrors', 'use git mirrors', { default: false })
	.env('RUNREAL_GIT_MIRRORS_PATH=<gitMirrorsPath:string>', 'Overide to git mirrors path', { prefix: 'RUNREAL_' })
	.option('-p, --git-mirrors-path <gitMirrorsPath:file>', 'git mirrors path')
	.arguments('[source:string] [destination:file]')
	.action(async (
		options,
		engineSource,
		destination,
		...args
	) => {
		const {
			branch,
			force,
			dryRun,
			setup,
			// gitDependenciesCachePath,
			// gitMirrors,
			// gitMirrorsPath,
		} = options as InstallOptions
		const cfg = config.get(options as CliOptions)
		engineSource = engineSource || cfg.engine.source
		destination = destination || cfg.engine.path

		if (!engineSource) {
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
		const source = Source(cfg.engine.path, cfg.engine.repoType)
		const clonedPath = source.clone({
			source: engineSource,
			destination,
			branch,
			dryRun,
		})
		if (setup) {
			await runEngineSetup({ enginePath: clonedPath, gitDependsCache: cfg.git?.dependenciesCachePath, dryRun })
		}
	})
