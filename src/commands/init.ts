import { Command, ValidationError } from '@cliffy/command'
import { Checkbox, Confirm, Input, Number, prompt } from '@cliffy/prompt'
import { createEngine } from '../lib/engine.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { findProjectFile, getProjectName } from '../lib/utils.ts'

export type InitOptions = typeof init extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const init = new Command<GlobalOptions>()
	.description('init')
	.action(async ({ projectPath, enginePath }) => {
		const result = await prompt([{
			name: 'name',
			message: "What's your name?",
			type: Input,
		}, {
			name: 'age',
			message: 'How old are you?',
			type: Number,
		}, {
			name: 'like',
			message: 'Do you like animals?',
			type: Confirm,
		}, {
			name: 'animals',
			message: 'Select some animals',
			type: Checkbox,
			options: ['dog', 'cat', 'snake'],
		}])
		console.log(result)

		// prompt for the paths
		// prompt for engine path

		// generate runreal.config.json
		// write runreal.config.json

		// generate .env
		// update .env in path .env

		// if (!projectPath) {
		// 	throw new ValidationError('No project path provided')
		// }
		// if (!enginePath) {
		// 	throw new ValidationError('No engine path provided')
		// }
		// const projectFile = await findProjectFile(projectPath)
		// const projectName = await getProjectName(projectPath)
		// const engine = createEngine(enginePath)
		// const engineVersion = engine.getEngineVersion()
		// console.log(`[init] enginePath: ${enginePath}`)
		// console.log(`[init] engineVersion: ${engineVersion}`)
		// console.log(`[init] projectPath: ${projectPath}`)
		// console.log(`[init] projectName: ${projectName}`)
		// console.log(`[init] projectFile: ${projectFile}`)

		// const config = {
		// 	projectName,
		// 	projectPath,
		// 	projectFile,
		// 	enginePath,
		// 	engineVersion,
		// }
		// TODO: only place writeConfigFile
		// await writeConfigFile(config)
	})
