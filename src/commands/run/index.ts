import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'

import { client } from './client.ts'
import { commandlet } from './commandlet.ts'
import { editor } from './editor.ts'
import { game } from './game.ts'
import { python } from './python.ts'
import { server } from './server.ts'

export const run = new Command<GlobalOptions>()
	.description('Run the game, editor, or commandlet')
	.action(function () {
		this.showHelp()
	})
	.command('client', client)
	.command('commandlet', commandlet)
	.command('editor', editor)
	.command('game', game)
	.command('python', python)
	.command('server', server)
