import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export type CommandletOptions = typeof commandlet extends
	Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const commandlet = new Command<GlobalOptions>()
	.description('Run commandlet Unreal Engine headless mode')
	.arguments('<configuration:string> <commandletName:string> [runArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Build the target prior to running it', { default: false })
	.stopEarly()
	.action(
		async (
			options,
			configuration = EngineConfiguration.Development,
			commandletName,
			...runArguments: Array<string>
		) => {
			const { dryRun, compile } = options as CommandletOptions
			const cfg = Config.instance().process(options)
			const project = await createProject(cfg.engine.path, cfg.project.path)

			if (compile) {
				await project.compile({
					target: EngineTarget.Editor,
					configuration: configuration as EngineConfiguration,
					dryRun: dryRun,
				})
			}

			const args = [
				`-run=${commandletName}`,
				'-stdout',
				'-nosplash',
				'-nopause',
				'-nosound',
				...runArguments,
			]

			await project.runEditor({ extraArgs: args, useCmd: true })
		},
	)
