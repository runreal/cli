import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { CookTarget } from '../../lib/engine.ts'

export type CookOptions = typeof cook extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const cook = new Command<GlobalOptions>()
	.description('Cook the project')
	.arguments('<target> <cookArguments...>')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Compile before Cook', { default: false })
	.option('--cultures', 'Cultures to cook, defaults to en', { default: 'en' })
	.option('--onthefly', 'Launch as an on-the-fly server', { default: false })
	.option('--iterate', 'Cook iteratively', { default: true })
	.option('--noxge', 'Disable XGE shader compilation', { default: true })
	.option('--debug', 'Use debug executables', { default: false })
	.stopEarly()
	.action(async (options, target = CookTarget.Windows, ...cookArguments: Array<string>) => {
		const { dryRun, noxge, debug, iterate, onthefly, cultures, compile } = options as CookOptions
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
