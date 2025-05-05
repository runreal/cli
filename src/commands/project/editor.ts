import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export const editor = new Command<GlobalOptions>()
	.description('Run the editor')
	.arguments('<editorArguments...>')
	.option('--dry-run', 'Dry run', { default: false })
	.option('--compile', 'Compile binaries first', { default: false })
	.stopEarly()
	.action(async (options, ...editorArguments: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		if (options.dryRun) {
			console.log(`Would open editor with ${editorArguments}`)
			Deno.exit()
		}

		console.log(`Running editor with ${editorArguments}`)

		if (options.compile) {
			await project.compileAndRunEditor({ extraRunArgs: editorArguments })
		} else {
			await project.runEditor({ extraArgs: editorArguments })
		}
	})
