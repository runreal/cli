import { Command } from '/deps.ts'
import { createEngine, EngineConfiguration, EnginePlatform, EngineTarget } from '../lib/engine.ts'
import { GlobalOptions } from '../index.ts'
import { findProjectFile } from '../lib/utils.ts'
import { config } from '/lib/config.ts'
import { CliOptions } from '/lib/types.ts'

export type UbtOptions = typeof ubt extends Command<any, any, infer Options, any, any> ? Options
	: never

export const ubt = new Command<GlobalOptions>()
	.description('ubt')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.get(options as CliOptions)
		const engine = await createEngine(enginePath)
		if (command !== 'run') {
			args.unshift(command)
			const projectFile = await findProjectFile(projectPath).catch(() => null)
			if (projectFile) {
				args.push(`-project=${projectFile}`)
			}
		}
		const result = await engine.ubt(args)
	})
