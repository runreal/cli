import { Command } from '@cliffy/command'
import * as path from '@std/path'

import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { displayUPluginInfo, findPluginFile, readUPluginFile } from '../../lib/project-info.ts'

export const plugin = new Command<GlobalOptions>()
	.description('Displays information about a plugin')
	.arguments('<pluginName>')
	.action(async (options, pluginName: string) => {
		const cfg = Config.instance().process(options)

		const match = await findPluginFile(pluginName, cfg.project.path, cfg.engine.path)
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
