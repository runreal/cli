import { Command } from '../../deps.ts'
import { config } from '../../lib/config.ts'
import { GlobalOptions } from '../../index.ts'
import { CliOptions } from '../../lib/types.ts'
import { createEngine } from '../../lib/engine.ts'
import { logger } from '../../lib/logger.ts'

export type VersionOptions = typeof version extends Command<any, any, infer Options, any, any> ? Options
	: never

export const version = new Command<GlobalOptions>()
	.description('print the engine version')
	.action(
		async (options, ..._args) => {
			logger.setContext(version.getName())
			const cfg = config.get(options as CliOptions)
			console.log(cfg)
			const engine = await createEngine(cfg.engine.path)
			const engineVersion = await engine.getEngineVersion('full')
			logger.info(engineVersion)
		},
	)
