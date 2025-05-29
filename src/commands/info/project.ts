import { Command } from '@cliffy/command'

import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'
import { displayUProjectInfo, readUProjectFile } from '../../lib/project-info.ts'

export const project = new Command<GlobalOptions>()
	.description('Displays information about the project')
	.action(async (options) => {
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		const projectData = await readUProjectFile(project.projectFileVars.projectFullPath)
		if (projectData) {
			displayUProjectInfo(projectData)
		} else {
			console.log('The project file could not be loaded')
		}
	})
