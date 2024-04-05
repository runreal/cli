import { Command, ValidationError } from '/deps.ts'
import { GlobalOptions } from '/index.ts'
import { deleteEngineHooks, exec, isGitRepo, runEngineSetup } from '/lib/utils.ts'
import { config } from '/lib/config.ts'
import { CliOptions } from '/lib/types.ts'
import { Source } from '/lib/source.ts'

export type UpdateOptions = typeof update extends Command<any, any, infer Options, any, any> ? Options
	: never

export const update = new Command<GlobalOptions>()
	.description('update engine to a specific checkout')
	.env(
		'RUNREAL_GIT_CLEAN_FLAGS=<flags:string>',
		'overide flags to pass to git clean',
		{ prefix: 'RUNREAL_' },
	)
	.option(
		'-b, --branch <checkout:string>',
		'git checkout (branch | tag | commit)',
		{ default: 'main' },
	)
	.option('-r, --remote <remote:string>', 'git remote', { default: 'origin' })
	.option('-c, --clean', 'if we should run a git clean before updating', {
		default: false,
	})
	.group('Post Checkout Configuration')
	.option('-s, --setup', 'installs git dependencies (ie Setup.bat)')
	.option(
		'-g, --git-dependencies-cache-path <gitDependenciesCachePath:file>',
		'git dependencies cache folder',
		{ depends: ['setup'] },
	)
	.option('-d, --dry-run', 'Dry run', { default: false })
	.action(async (options, ...args) => {
		const {
			branch,
			remote,
			clean,
			setup,
			gitCleanFlags,
			// gitDependenciesCachePath,
			dryRun,
		} = options as UpdateOptions
		const cfg = config.get(options as CliOptions)

		const source = Source(cfg.engine.path, cfg.engine.repoType)
		if (clean) {
			source.clean()
		}
		// Prevent the default engine hooks from running
		await deleteEngineHooks(cfg.engine.path)

		source.sync()

		if (setup) {
			await runEngineSetup({ enginePath: cfg.engine.path, gitDependsCache: cfg.git?.dependenciesCachePath, dryRun })
		}
	})
