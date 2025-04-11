import { Engine } from '../lib/engine.ts'
import { Command } from '@cliffy/command'

export const clean = new Command()
	.option('--dry-run', 'Dry run', { default: false })
	.description('clean')
	.action(async (options) => {
		await Engine.runClean(options)
	})
