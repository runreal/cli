import { Command } from '@cliffy/command'
import { createProject } from '../../lib/project.ts'
import { Config } from '../../lib/config.ts'

export const clean = new Command()
	.option('--dry-run', 'Dry run', { default: false })
	.description('clean')
	.action(async (options) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)
		project.runClean(options.dryRun)
	})
