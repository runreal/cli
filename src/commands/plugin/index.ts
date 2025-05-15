import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { info } from './info.ts'
import { add } from './add.ts'
import { list } from './list.ts'
import { enable } from './enable.ts'
import { disable } from './disable.ts'

export const plugin = new Command<GlobalOptions>()
	.description('Prints information about a plugin')
	.action(function () {
		this.showHelp()
	})
	.command('info', info)
	.command('list', list)
	.command('enable', enable)
	.command('disable', disable)
	.command('add', add)
