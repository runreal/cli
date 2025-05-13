import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export const disable = new Command<GlobalOptions>()
	.description('Disable a plugin for the project')
	.action((options) => {
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options })
	})
