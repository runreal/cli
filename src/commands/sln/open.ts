import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { createProject } from '../../lib/project.ts'

export const open = new Command()
	.description('open')
	.option('--dry-run', 'Dry run', { default: false })
	.action(async (options) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		// STUB //
	})
