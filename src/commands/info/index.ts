import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { buildId } from './buildId.ts'
import { config } from './config.ts'
import { listTargets } from './list-targets.ts'

export const info = new Command<GlobalOptions>()
	.description('info')
	.action(function () {
		this.showHelp()
	})
	.command('buildId', buildId)
	.command('config', config)
	.command('list-targets', listTargets)
