import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { displayUProjectInfo, readUProjectFile } from '../../lib/project-info.ts'

export const project = new Command<GlobalOptions>()
	.description('Displays information about the project')
	.action(async (options) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		const projectData = await readUProjectFile(project.projectFileVars.projectFullPath)
		if (projectData) {
			displayUProjectInfo(projectData)
		} else {
			console.log('The project file could not be loaded')
		}
	})
