import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'

export type PythonOptions = typeof python extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const python = new Command<GlobalOptions>()
	.description('Run Python script in Unreal Engine headless mode')
	.arguments('<configuration:string> <scriptPath:string> [runArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Build the target prior to running it', { default: false })
	.stopEarly()
	.action(
		async (options, configuration = EngineConfiguration.Development, scriptPath, ...runArguments: Array<string>) => {
			const { dryRun, compile } = options as PythonOptions
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
				'-run=pythonscript',
				`-script=${scriptPath}`,
				'-stdout',
				'-nosplash',
				'-nopause',
				'-nosound',
				...runArguments,
			]

			console.log(`Running Python script: ${scriptPath}`)

			await project.runEditor({ extraArgs: args, useCmd: true })
		},
	)
