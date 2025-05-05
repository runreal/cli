import { Command } from '@cliffy/command'

import type { GlobalOptions } from '../../lib/types.ts'

import { clean } from './clean.ts'
import { compile } from './compile.ts'
import { cook } from './cook.ts'
import { editor } from './editor.ts'
import { gen } from './gen.ts'
import { pkg } from './pkg.ts'
import { run } from './run.ts'
import { runpython } from './runpython.ts'

export const project = new Command<GlobalOptions>()
	.description('project')
	.action(function () {
		this.showHelp()
	})
	.command('clean', clean)
	.command('compile', compile)
	.command('cook', cook)
	.command('editor', editor)
	.command('gen', gen)
	.command('pkg', pkg)
	.command('run', run)
	.command('runpython', runpython)
