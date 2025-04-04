import { Command } from '../deps.ts'
import { createEngine } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { Config } from '../lib/config.ts'
import { logger } from '../lib/logger.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { path } from '../deps.ts'
import { exec } from '../lib/utils.ts'
import { Engine, getEditorPath } from '../lib/engine.ts'

export type RunPythonOptions = typeof runpython extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const runpython = new Command<GlobalOptions>()
	.description('Run Python script in Unreal Engine headless mode')
	.option('-s, --script <scriptPath:string>', 'Path to Python script', { required: true })
	.option('--stdout', 'Redirect output to stdout', { default: true })
	.option('--nosplash', 'Skip splash screen', { default: true })
	.option('--nopause', 'Don\'t pause after execution', { default: true })
	.option('--nosound', 'Disable sound', { default: true })
	.option('--args <args:string>', 'Additional arguments to pass to the script')
	.action(async (options) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		
		const projectFile = await findProjectFile(projectPath).catch(() => {
			logger.error(`Could not find project file in ${projectPath}`)
			Deno.exit(1)
		})
		
		if (!projectFile) {
			logger.error(`Could not find project file in ${projectPath}`)
			Deno.exit(1)
		}
		
		// Resolve absolute path to script
		const scriptPath = path.resolve(options.script)
		
		// Get the editor executable path based on platform
		const currentPlatform = Engine.getCurrentPlatform()
		const editorExePath = getEditorPath(enginePath, currentPlatform)
		
		// Build command arguments
		const args = [
			projectFile,
			'-run=pythonscript',
			`-script="${scriptPath}"`,
			'-unattended',
		]
		
		// Add optional flags
		if (options.stdout) args.push('-stdout')
		if (options.nosplash) args.push('-nosplash')
		if (options.nopause) args.push('-nopause')
		if (options.nosound) args.push('-nosound')
		
		// Add any additional arguments
		if (options.args) {
			args.push(options.args)
		}
		
		logger.info(`Running Python script: ${scriptPath}`)
		logger.debug(`Full command: ${editorExePath} ${args.join(' ')}`)
		
		try {
			const result = await exec(editorExePath, args)
			return result
		} catch (error: unknown) {
			logger.error(`Error running Python script: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	})

