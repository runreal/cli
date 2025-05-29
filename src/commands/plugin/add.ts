import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { readUProjectFile, UnrealEnginePluginReference, UProject, writeUProjectFile } from '../../lib/project-info.ts'
import { exec } from '../../lib/utils.ts'
import * as path from '@std/path'

export type AddOptions = typeof add extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const add = new Command<GlobalOptions>()
	.description('Adds an external plugin to the project')
	.arguments('<url:string> <pluginName:string>')
	.option(
		'-f, --folder <folder:string>',
		"Plugin subfolder to install to, leaving default will install directly into the project's Plugin folder",
		{ default: '' },
	)
	.option('-e, --enable', 'Enable this plugin in the project, defaults to true', { default: true })
	.action(async (options, url, pluginName) => {
		const { folder, enable } = options as AddOptions

		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		const target_loc = path.relative(
			Deno.cwd(),
			path.join(project.projectFileVars.projectDir, 'Plugins', folder, pluginName),
		)

		console.log(`installing ${pluginName} to ${target_loc}`)

		await exec('git', ['clone', '--depth', '1', url, target_loc])

		if (enable) {
			project.enablePlugin({
				pluginName: pluginName,
				shouldEnable: true,
			})
		}
	})
