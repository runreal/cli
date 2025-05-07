import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export const run = new Command<GlobalOptions>()
	.description('Run the game')
	.arguments('<runArguments...>')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Use the precompiled binaries', { default: false })
	.stopEarly()
	.action(async (options, ...runArguments: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const project = await createProject(enginePath, projectPath)

		if (options.compile) {
			await project.compile({
				target: EngineTarget.Editor,
				configuration: EngineConfiguration.Development,
				dryRun: options.dryRun,
				platform: EnginePlatform.Windows,
			})
		}
		await project.runEditor({ extraArgs: ['-game', ...runArguments] })
	})
