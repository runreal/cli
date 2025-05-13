import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export const enable = new Command<GlobalOptions>()
	.description('Enables a plugin for a project')
	.action((options) => {
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options })
	})
