import { Command } from '../../deps.ts'
import { config } from '../../lib/config.ts'
import type { GlobalOptions, CliOptions } from '../../lib/types.ts'
import { createEngine } from '../../lib/engine.ts'
import { logger } from '../../lib/logger.ts'
import { cmd } from '../../cmd.ts'

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
