import { Command } from '../../deps.ts'
import type { GlobalOptions } from '../../lib/types.ts'

import { debugConfig } from './debug-config.ts'

export const debug = new Command<GlobalOptions>()
	.description('debug')
	.command('config', debugConfig)
