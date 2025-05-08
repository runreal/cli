import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { generate } from './generate.ts'
import { open } from './open.ts'

export const sln = new Command<GlobalOptions>()
	.description('debug')
	.action(function () {
		this.showHelp()
	})
	.command('generate', generate)
	.command('open', open)
