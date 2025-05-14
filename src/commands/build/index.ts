import { Command } from '@cliffy/command'

import type { GlobalOptions } from '../../lib/types.ts'

import { client } from './client.ts'
import { clean } from './clean.ts'
import { editor } from './editor.ts'
import { game } from './game.ts'
import { program } from './program.ts'
import { server } from './server.ts'

export const build = new Command<GlobalOptions>()
	.description('build')
	.action(function () {
		this.showHelp()
	})
	.command('client', client)
	.command('clean', clean)
	.command('editor', editor)
	.command('game', game)
	.command('program', program)
	.command('server', server)
