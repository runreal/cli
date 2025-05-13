import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export const list = new Command<GlobalOptions>()
	.description('Lists all plugins referenced in a project')
	.action((options) => {
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options })
	})
