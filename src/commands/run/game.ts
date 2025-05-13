import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export type GameOptions = typeof game extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const game = new Command<GlobalOptions>()
	.description('Launches the game')
	.arguments('<configuration:string> [runArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Build the target prior to running it', { default: false })
	.stopEarly()
	.action(async (options, configuration = EngineConfiguration.Development, ...runArguments: Array<string>) => {
		const { dryRun, compile } = options as GameOptions
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const project = await createProject(enginePath, projectPath)

		if (compile) {
			await project.compile({
				target: EngineTarget.Game,
				configuration: configuration as EngineConfiguration,
				dryRun: options.dryRun,
			})
		}

		await project.runEditor({ extraArgs: ['-game', ...runArguments] })
	})
