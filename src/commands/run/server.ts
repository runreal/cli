import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export type ServerOptions = typeof server extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const server = new Command<GlobalOptions>()
	.description('Launches the game server')
	.arguments('<configuration:string> [runArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Build the target prior to running it', { default: false })
	.stopEarly()
	.action(async (options, configuration = EngineConfiguration.Development, ...runArguments: Array<string>) => {
		const { dryRun, compile } = options as ServerOptions
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		if (compile) {
			await project.compile({
				target: EngineTarget.Server,
				configuration: configuration as EngineConfiguration,
				dryRun: dryRun,
			})
		}

		await project.runEditor({ extraArgs: ['-server', ...runArguments] })
	})
