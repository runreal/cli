import { Command } from '@cliffy/command'
import * as path from '@std/path'

import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { displayUPluginInfo, findPluginFile, readUPluginFile } from '../../lib/project-info.ts'

export const plugin = new Command<GlobalOptions>()
	.description('Displays information about a plugin')
	.arguments('<pluginName>')
	.action(async (options, pluginName: string) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const match = await findPluginFile(pluginName, projectPath, enginePath)
		if (match) {
			const pluginData = await readUPluginFile(match)
			if (pluginData) {
				displayUPluginInfo(pluginData)
			} else {
				console.log(`The plugin ${pluginName} could not be loaded`)
			}
		} else {
			console.log(`Unable to find the plugin ${pluginName}`)
		}
	})
