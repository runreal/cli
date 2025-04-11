import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { exec } from './exec.ts'

export const workflow = new Command<GlobalOptions>()
	.description('workflow')
	.action(function () {
		this.showHelp()
	})
	.command('exec', exec)
