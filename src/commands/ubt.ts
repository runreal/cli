import { Command } from '../deps.ts'
import { createEngine } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { Config } from '../lib/config.ts'
import type { GlobalOptions } from '../lib/types.ts'

export type UbtOptions = typeof ubt extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const ubt = new Command<GlobalOptions>()
	.description('ubt')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const engine = createEngine(enginePath)
		if (command !== 'run') {
			args.unshift(command)
			const projectFile = await findProjectFile(projectPath).catch(() => null)
			if (projectFile) {
				args.push(`-project=${projectFile}`)
			}
		}
		const result = await engine.ubt(args)
	})
