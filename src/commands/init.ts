import { Command, ValidationError } from '@cliffy/command'
import { Checkbox, Confirm, Input, Select } from '@cliffy/prompt'
import * as path from '@std/path'
import { createEngine } from '../lib/engine.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { findProjectFile, getProjectName, isGitRepo } from '../lib/utils.ts'
import { UserConfigSchema } from '../lib/schema.ts'

export type InitOptions = typeof init extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const init = new Command<GlobalOptions>()
	.description('Initialize a new runreal.config.json file')
	.action(async (options) => {
		const { projectPath: cliProjectPath, enginePath: cliEnginePath } = options
		console.log('Initializing runreal configuration...')

		// Current directory as default for project path
		const defaultProjectPath = cliProjectPath || Deno.cwd()
		// Try to detect if we are in an Unreal project directory
		let defaultProjectName = ''
		try {
			const projectFile = await findProjectFile(defaultProjectPath)
			defaultProjectName = path.basename(projectFile, '.uproject')
		} catch {
			// Not in a project directory, that's fine
		}

		// Prompt for project information
		const projectResult = await Input.prompt({
			message: 'Project path:',
			default: defaultProjectPath,
		})

		let projectName = defaultProjectName
		try {
			if (!projectName) {
				const projectFile = await findProjectFile(projectResult)
				projectName = path.basename(projectFile, '.uproject')
			}
		} catch {
			projectName = await Input.prompt({
				message: 'Project name:',
				default: path.basename(projectResult),
			})
		}

		// Detect repo type
		let defaultRepoType = 'git'
		try {
			const isGit = await isGitRepo(projectResult)
			if (!isGit) {
				defaultRepoType = ''
			}
		} catch {
			defaultRepoType = ''
		}

		const repoType = await Select.prompt({
			message: 'Repository type:',
			options: [
				{ name: 'Git', value: 'git' },
				{ name: 'Perforce', value: 'perforce' },
				{ name: 'None', value: '' },
			],
			default: defaultRepoType,
		})

		// Project build path
		const defaultBuildPath = path.join(projectResult, 'build')
		const buildPath = await Input.prompt({
			message: 'Build path:',
			default: defaultBuildPath,
		})

		// Prompt for engine information
		const enginePath = await Input.prompt({
			message: 'Engine path:',
			default: cliEnginePath || '',
		})

		let engineVersion = ''
		if (enginePath) {
			try {
				const engine = createEngine(enginePath)
				engineVersion = engine.getEngineVersion()
				console.log(`Detected engine version: ${engineVersion}`)
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error)
				console.warn(`Could not detect engine version: ${errorMessage}`)
			}
		}

		// Create config object
		const config = {
			engine: {
				path: enginePath,
				...(repoType ? { repoType } : {}),
			},
			project: {
				name: projectName,
				path: projectResult,
				buildPath,
				...(repoType ? { repoType } : {}),
			},
		}

		// Validate config
		const { success, data, error } = UserConfigSchema.safeParse(config)
		if (!success) {
			console.log('Invalid configuration:')
			console.log(error.message)
			throw new ValidationError('Failed to create valid configuration')
		}

		// Write config file
		const configPath = path.join(Deno.cwd(), 'runreal.config.json')
		const configFile = JSON.stringify(data, null, 2)

		try {
			await Deno.writeTextFile(configPath, configFile)
			console.log(`Configuration file created: ${configPath}`)
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.log(`Failed to write configuration file: ${errorMessage}`)
			throw error
		}

		console.log('Initialization complete! You can now use runreal commands.')
	})
