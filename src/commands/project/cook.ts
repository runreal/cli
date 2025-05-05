import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export const cook = new Command<GlobalOptions>()
	.description('Cook the project')
	.arguments('<cookArguments...>')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Compile before Cook', { default: false })
	.stopEarly()
	.action(async (options, ...cookArguments: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const project = await createProject(enginePath, projectPath)
		if (options.compile) {
			await project.compile({})
		}

		await project.cookContent({ extraArgs: cookArguments })
	})
