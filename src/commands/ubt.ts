import { Command } from '../deps.ts'
import { createEngine } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { config } from '../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../lib/types.ts'
import { cmd } from '../cmd.ts'

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
