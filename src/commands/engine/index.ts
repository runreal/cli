import { Command } from '../../deps.ts'

import { GlobalOptions } from '../../index.ts'
import { install } from './install.ts'
import { update } from './update.ts'
import { cache } from './cache.ts'
import { restore } from './restore.ts'
import { setup } from './setup.ts'
import { version } from './version.ts'

export const engine = new Command<GlobalOptions>()
	.description('engine')
	.command('install', install)
	.command('update', update)
	.command('cache', cache)
	.command('restore', restore)
	.command('setup', setup)
	.command('version', version)
