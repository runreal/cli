import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { generate } from './generate.ts'
import { auth } from './auth.ts'

export const ddc = new Command<GlobalOptions>()
	.description('workflow')
	.action(function () {
		this.showHelp()
	})
	.command('generate', generate)
	.command('auth', auth)
