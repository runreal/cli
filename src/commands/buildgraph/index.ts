import { Command } from '../../deps.ts'
import type { GlobalOptions } from '../../lib/types.ts'

import { run } from './run.ts'

export const buildgraph = new Command<GlobalOptions>()
	.description('buildgraph')
	.action((function () {
		this.showHelp()
	}))
	.command('run', run)
