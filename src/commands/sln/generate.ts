import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { createProject } from '../../lib/project.ts'

export type GenOptions = typeof generate extends
	Command<void, void, infer Options extends Record<string, unknown>, [], void> ? Options
	: never

export const generate = new Command()
	.description('generate')
	.arguments('[genArguments...]')
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, ...genArguments: Array<string>) => {
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)
		project.genProjectFiles(genArguments)
	})
