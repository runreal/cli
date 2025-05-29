import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { createProject } from '../../lib/project.ts'
import * as path from '@std/path'
import { exec, findFilesByExtension } from '../../lib/utils.ts'

export const open = new Command()
	.description('open')
	.option('--dry-run', 'Dry run', { default: false })
	.action(async (options) => {
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		const projectSlnFiles = await findFilesByExtension(
			path.join(`${project.projectFileVars.projectDir}`, '..'),
			'sln',
			false,
		)
		const engineSlnFiles = await findFilesByExtension(cfg.engine.path, 'sln', false)

		const slnFiles = [...projectSlnFiles, ...engineSlnFiles]

		if (slnFiles.length > 0) {
			console.log(`opening ${slnFiles[0]}`)
			await exec('cmd.exe', ['cmd.exe', '/c', slnFiles[0]])
		}
	})
