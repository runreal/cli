import { Command } from '@cliffy/command'
import { createEngine } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { Config } from '../lib/config.ts'
import type { GlobalOptions } from '../lib/types.ts'

export type UatOptions = typeof uat extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const uat = new Command<GlobalOptions>()
	.description('uat')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		const cfg = Config.instance().process(options)
		const engine = createEngine(cfg.engine.path)
		if (command !== 'run') {
			args.unshift(command)
			const projectFile = await findProjectFile(cfg.project.path).catch(() => null)
			if (projectFile) {
				args.push(`-project=${projectFile}`)
			}
		}
		const result = await engine.runUAT(args)
	})
