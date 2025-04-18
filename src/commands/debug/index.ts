import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { debugConfig } from './debug-config.ts'
import { debugBuildId } from './debug-buildId.ts'

export const debug = new Command<GlobalOptions>()
	.description('debug')
	.action(function () {
		this.showHelp()
	})
	.command('config', debugConfig)
	.command('buildId', debugBuildId)
