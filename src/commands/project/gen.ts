import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { createProject } from '../../lib/project.ts'

export type GenOptions = typeof gen extends Command<void, void, infer Options extends Record<string, unknown>, [], void>
	? Options
	: never

export const gen = new Command()
	.description('generate')
	.arguments('<genArguments...>')
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, ...genArguments: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)
		project.genProjectFiles(genArguments)
	})
