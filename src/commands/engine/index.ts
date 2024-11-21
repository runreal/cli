import { Command } from '../../deps.ts'

import type { GlobalOptions } from '../../lib/types.ts'
import { install } from './install.ts'
import { update } from './update.ts'
import { setup } from './setup.ts'
import { version } from './version.ts'

export const engine = new Command<GlobalOptions>()
	.description('engine')
	.command('install', install)
	.command('update', update)
	.command('setup', setup)
	.command('version', version)
