import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { readUProjectFile, UnrealEnginePluginReference, UProject, writeUProjectFile } from '../../lib/project-info.ts'

export type EnableOptions = typeof enable extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const enable = new Command<GlobalOptions>()
	.description('Disables a plugin for the project')
	.arguments('<target:string>')
	.action(async (options, target) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)
		project.enablePlugin({
			pluginName: target,
			shouldEnable: true,
		})
	})
