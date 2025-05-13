import { Command } from '@cliffy/command'

import type { GlobalOptions } from '../../lib/types.ts'

import { build } from './build.ts'
import { clean } from './clean.ts'
import { cook } from './cook.ts'
import { pkg } from './pkg.ts'

export const project = new Command<GlobalOptions>()
	.description('project')
	.action(function () {
		this.showHelp()
	})
	.command('build', build)
	.command('clean', clean)
	.command('cook', cook)
	.command('pkg', pkg)
