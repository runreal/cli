import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export type ResaveOptions = typeof resave extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const resave = new Command<GlobalOptions>()
	.description('Run resave commandlet Unreal Engine headless mode')
	.arguments('[runArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--fixup-redirects', 'Fixup redirects', { default: false })
	.option('--compile', 'Build the target prior to running it', { default: false })
	.stopEarly()
	.action(
		async (
			options,
			...runArguments: Array<string>
		) => {
			const { dryRun, compile, fixupRedirects } = options as ResaveOptions
			const cfg = Config.instance().process(options)
			const project = await createProject(cfg.engine.path, cfg.project.path)

			if (compile) {
				await project.compile({
					target: EngineTarget.Editor,
					configuration: EngineConfiguration.Development,
					dryRun: dryRun,
					extraArgs: runArguments,
				})
			}
			const args = [
				`-run=ResavePackages`,
				'-PROJECTONLY',
				'-BatchPackageLimit=10',
				'-SKIPFAILS',
				'-AutoCheckOut',
				'-BatchSourceControl',
				'-AutoCheckIn',
				'-IgnoreChangelist',
				'-SkipFailedCheckouts',
				'-P4',
				'-stdout',
				'-nosplash',
				'-nopause',
				'-nosound',
				...runArguments,
			]

			if (fixupRedirects) {
				args.push('-FixupRedirects')
			}

			await project.runEditor({ extraArgs: args, useCmd: true })
		},
	)
