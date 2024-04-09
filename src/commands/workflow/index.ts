import { Command } from '../../deps.ts'
import { GlobalOptions } from '../../lib/types.ts'

import { exec } from './exec.ts'

export const workflow = new Command<GlobalOptions>()
	.description('workflow')
	.command('exec', exec)
