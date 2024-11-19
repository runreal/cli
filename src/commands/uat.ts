import { Command } from '../deps.ts'
import { createEngine, EngineConfiguration, EnginePlatform, EngineTarget } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { Config } from '../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../lib/types.ts'

export type UatOptions = typeof uat extends Command<any, any, infer Options, any, any> ? Options
	: never

export const uat = new Command<GlobalOptions>()
	.description('uat')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options as CliOptions,
		})
		const engine = await createEngine(enginePath)
		if (command !== 'run') {
			args.unshift(command)
			const projectFile = await findProjectFile(projectPath).catch(() => null)
			if (projectFile) {
				args.push(`-project=${projectFile}`)
			}
		}
		const result = await engine.runUAT(args)
	})
