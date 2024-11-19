import { Command, ValidationError } from '../../deps.ts'
import { deleteEngineHooks, exec, isGitRepo, runEngineSetup } from '../../lib/utils.ts'
import { Config } from '../../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../../lib/types.ts'

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
			dryRun,
		} = options as UpdateOptions

		const cfg = Config.getInstance().mergeConfigCLIConfig({ cliOptions: options as CliOptions })
		const isRepo = await isGitRepo(cfg.engine.path)
		if (!isRepo) {
			throw new ValidationError(
				`Engine path ${cfg.engine.path} is not a git repository`,
			)
		}
		if (clean) {
			const clean = await exec('git', [
				'clean',
				gitCleanFlags ? gitCleanFlags : '-fxd',
			], { cwd: cfg.engine.path, dryRun })
		}
		// Prevent the default engine hooks from running
		await deleteEngineHooks(cfg.engine.path)

		const fetch = await exec('git', [
			'fetch',
			remote,
			branch,
		], { cwd: cfg.engine.path, dryRun })

		const checkout = await exec('git', [
			'checkout',
			'--quiet',
			'--force',
			branch,
		], { cwd: cfg.engine.path, dryRun })

		const reset = await exec('git', [
			'reset',
			'--hard',
			'FETCH_HEAD',
		], { cwd: cfg.engine.path, dryRun })

		if (setup) {
			await runEngineSetup({
				enginePath: cfg.engine.path,
				gitDependsCache: cfg.engine.gitDependenciesCachePath,
				dryRun,
			})
		}
	})
