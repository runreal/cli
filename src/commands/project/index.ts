import { Command } from '@cliffy/command'

import type { GlobalOptions } from '../../lib/types.ts'

import { build } from './build.ts'
import { clean } from './clean.ts'
import { cook } from './cook.ts'
import { deploy } from './deploy.ts'
import { stage } from './stage.ts'
import { run } from './run.ts'
import { runpython } from './runpython.ts'

export const project = new Command<GlobalOptions>()
	.description('project')
	.action(function () {
		this.showHelp()
	})
	.command('build', build)
	.command('clean', clean)
	.command('cook', cook)
	.command('deploy', deploy)
	.command('run', run)
	.command('stage', stage)
	.command('runpython', runpython)
