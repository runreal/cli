import { Command } from '../../deps.ts'
import { GlobalOptions } from '../../lib/types.ts'

import { run } from './run.ts'

export const buildgraph = new Command<GlobalOptions>()
	.description('buildgraph')
	.command('run', run)
