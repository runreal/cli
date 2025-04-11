import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createEngine } from '../../lib/engine.ts'
import { logger } from '../../lib/logger.ts'

export type VersionOptions = typeof version extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const version = new Command<GlobalOptions>()
	.description('print the engine version')
	.action(
		(options, ..._args) => {
			logger.setContext(version.getName())
			const config = Config.getInstance()
			const cfg = config.mergeConfigCLIConfig({ cliOptions: options })
			const engine = createEngine(cfg.engine.path)
			const engineVersion = engine.getEngineVersion('full')
			logger.info(engineVersion)
		},
	)
