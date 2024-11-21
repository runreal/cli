import { Command, ValidationError } from '../deps.ts'
import { createEngine } from '../lib/engine.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { findProjectFile, getProjectName, writeConfigFile } from '../lib/utils.ts'

export type InitOptions = typeof init extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const init = new Command<GlobalOptions>()
	.description('init')
	.action(async ({ projectPath, enginePath }) => {
		if (!projectPath) {
			throw new ValidationError('No project path provided')
		}
		if (!enginePath) {
			throw new ValidationError('No engine path provided')
		}
		const projectFile = await findProjectFile(projectPath)
		const projectName = await getProjectName(projectPath)
		const engine = await createEngine(enginePath)
		const engineVersion = await engine.getEngineVersion()
		console.log(`[init] enginePath: ${enginePath}`)
		console.log(`[init] engineVersion: ${engineVersion}`)
		console.log(`[init] projectPath: ${projectPath}`)
		console.log(`[init] projectName: ${projectName}`)
		console.log(`[init] projectFile: ${projectFile}`)

		const config = {
			projectName,
			projectPath,
			projectFile,
			enginePath,
			engineVersion,
		}
		await writeConfigFile(config)
	})
