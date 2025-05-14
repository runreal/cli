import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { findPluginFile, readUPluginFile, readUProjectFile, UPlugin } from '../../lib/project-info.ts'

async function getEnabledPlugins(pluginName: string, projectPath: string, enginePath: string, refArray: Array<string>) {
	const pluginArray: Array<string> = []
	const match = await findPluginFile(pluginName, projectPath, enginePath)
	if (match && match != '') {
		const pluginData = await readUPluginFile(match)

		if (pluginData && pluginData.Plugins) {
			for (const plugin of pluginData.Plugins) {
				if (plugin.Enabled) {
					if (![...refArray, ...pluginArray].includes(plugin.Name)) {
						pluginArray.push(plugin.Name)
					}
				}
			}

			const subPlugins: Array<string> = []
			for (const pluginName of pluginArray) {
				if (![...refArray, ...subPlugins].includes(pluginName)) {
					const subPluginArray = await getEnabledPlugins(pluginName, projectPath, enginePath, [
						...pluginArray,
						...refArray,
						...subPlugins,
					])
					subPlugins.push(...subPluginArray)
				}
			}
			pluginArray.push(...subPlugins)
		}
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

		const allEnabledPlugins: Array<string> = []

		if (projectData && projectData.Plugins) {
			for (const plugin of projectData.Plugins) {
				if (plugin.Enabled) {
					allEnabledPlugins.push(plugin.Name)
				}
				if (recursive) {
					const enabledPlugins = await getEnabledPlugins(plugin.Name, projectPath, enginePath, allEnabledPlugins)
					allEnabledPlugins.push(...enabledPlugins)
				}
			}
		}
		const uniquePlugins = [...new Set(allEnabledPlugins)]
		console.log(uniquePlugins)
	})
