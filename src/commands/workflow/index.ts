import { Command } from '../../deps.ts'

import { GlobalOptions } from '../../index.ts'
import { exec } from './exec.ts'

export const workflow = new Command<GlobalOptions>()
	.description('workflow')
	.command('exec', exec)
