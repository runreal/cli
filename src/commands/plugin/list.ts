import { Command, EnumType } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { findFilesByExtension } from '../../lib/utils.ts'
import * as path from '@std/path'
import { findPluginFile, readUPluginFile, readUProjectFile } from '../../lib/project-info.ts'

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
		console.log(`Unable to find the plugin ${pluginName}`)
	}
	return pluginArray
}

enum ListTarget {
	All = 'all',
	Referenced = 'referenced',
	Project = 'project',
	Engine = 'engine',
	Default = 'default',
}

export type ListOptions = typeof list extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const list = new Command<GlobalOptions>()
	.description(`
		Lists plugins
		target - defaults to referenced:
		* all - Lists all plugins from the engine and project
		* referenced - Lists all plugins referenced by the project
		* engine - Lists all engine plugins
		* project - Lists only plugins in the project plugins
		* default - Lists all plugins that are enabled by default
		`)
	.type('ListTarget', new EnumType(ListTarget))
	.arguments('<target:ListTarget>')
	.option('-r, --recursive', 'List all nested plugins that are enabled when used with "referenced" or "default"', {
		default: false,
	})
	.action(async (options, target = ListTarget.Project) => {
		const { recursive } = options as ListOptions
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)
		const projectData = await readUProjectFile(project.projectFileVars.projectFullPath)

		switch (target) {
			case ListTarget.All: {
				const projectPlugins = await findFilesByExtension(path.join(cfg.project.path, 'Plugins'), 'uplugin', true)
				const enginePlugins = await findFilesByExtension(
					path.join(cfg.engine.path, 'Engine', 'Plugins'),
					'uplugin',
					true,
				)
				console.log('Project Plugins:\n')
				projectPlugins.forEach((plugin) => {
					console.log(path.basename(plugin, '.uplugin'))
				})
				console.log('Engine Plugins:\n')
				enginePlugins.forEach((plugin) => {
					console.log(path.basename(plugin, '.uplugin'))
				})
				break
			}
			case ListTarget.Referenced: {
				const allEnabledPlugins: Array<string> = []

				if (projectData && projectData.Plugins) {
					for (const plugin of projectData.Plugins) {
						if (plugin.Enabled) {
							allEnabledPlugins.push(plugin.Name)
						}
						if (recursive) {
							const enabledPlugins = await getEnabledPlugins(
								plugin.Name,
								cfg.project.path,
								cfg.engine.path,
								allEnabledPlugins,
							)
							allEnabledPlugins.push(...enabledPlugins)
						}
					}
				}
				const uniquePlugins = [...new Set(allEnabledPlugins)]
				console.log('All Referenced Plugins:')
				console.log(uniquePlugins)
				break
			}
			case ListTarget.Project: {
				const projectPlugins = await findFilesByExtension(path.join(cfg.project.path, 'Plugins'), 'uplugin', true)
				console.log('Project Plugins:\n')
				projectPlugins.forEach((plugin) => {
					console.log(path.basename(plugin, '.uplugin'))
				})
				break
			}
			case ListTarget.Engine: {
				const enginePlugins = await findFilesByExtension(
					path.join(cfg.engine.path, 'Engine', 'Plugins'),
					'uplugin',
					true,
				)
				console.log('Engine Plugins:\n')
				enginePlugins.forEach((plugin) => {
					console.log(path.basename(plugin, '.uplugin'))
				})
				break
			}
			case ListTarget.Default: {
				const projectPlugins = await findFilesByExtension(path.join(cfg.project.path, 'Plugins'), 'uplugin', true)
				console.log('Project Plugins enabled by default:\n')
				for (const plugin of projectPlugins) {
					const uplugin = await readUPluginFile(plugin)
					if (uplugin && uplugin.EnabledByDefault) {
						console.log(path.basename(plugin, '.uplugin'))
					}
				}
				console.log('Engine Plugins enabled by default:\n')
				const enginePlugins = await findFilesByExtension(
					path.join(cfg.engine.path, 'Engine', 'Plugins'),
					'uplugin',
					true,
				)
				for (const plugin of enginePlugins) {
					const uplugin = await readUPluginFile(plugin)
					if (uplugin && uplugin.EnabledByDefault) {
						console.log(path.basename(plugin, '.uplugin'))
					}
				}
				break
			}
		}
	})
