import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { findPluginFile, readUPluginFile, readUProjectFile, UPlugin } from '../../lib/project-info.ts'

async function getEnabledPlugins(pluginName: string, projectPath: string, enginePath: string) {
	const pluginArray: Array<UPlugin> = []
	const match = await findPluginFile(pluginName, projectPath, enginePath)
	if (match && match != '') {
		const pluginData = await readUPluginFile(match)
		pluginArray.push(pluginData)
	} else {
		console.log('could not find plugin')
	}
	return pluginArray
}

export type ListOptions = typeof list extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const list = new Command<GlobalOptions>()
	.description('Lists all plugins referenced in a project')
	.option('-r, --recursive', 'List all nested plugins that are enabled')
	.option('-a, --always-enabled', 'Search for plugins that are always enabled')
	.action(async (options) => {
		const { recursive, alwaysEnabled } = options as ListOptions
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)
		const projectData = await readUProjectFile(project.projectFileVars.projectFullPath)

		if (projectData.Plugins) {
			projectData.Plugins.forEach(async (plugin) => {
				console.log(`${plugin.Name} - Enabled:${plugin.Enabled}`)
				if (recursive) {
					await getEnabledPlugins(plugin.Name, projectPath, enginePath)
				}
			})
		}
	})
