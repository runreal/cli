import { Engine } from '../lib/engine.ts'
import { Command } from '../deps.ts'

export const clean = new Command()
	.description('Clean')
	.option('--dry-run', 'Dry run', { default: false })
	.action(async (options) => {
		await Engine.runClean(options)
	})
