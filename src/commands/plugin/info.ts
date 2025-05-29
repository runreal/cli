import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export const info = new Command<GlobalOptions>()
	.description('Prints information about a plugin')
	.action((options) => {
		const cfg = Config.instance().process(options)
	})
