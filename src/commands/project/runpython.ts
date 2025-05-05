import { Command } from '@cliffy/command'
import * as path from '@std/path'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'

export type RunPythonOptions = typeof runpython extends
	Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const runpython = new Command<GlobalOptions>()
	.description('Run Python script in Unreal Engine headless mode')
	.option('-s, --script <scriptPath:string>', 'Path to Python script', { required: true })
	.option('--stdout', 'Redirect output to stdout', { default: true })
	.option('--nosplash', 'Skip splash screen', { default: true })
	.option('--nopause', "Don't pause after execution", { default: true })
	.option('--nosound', 'Disable sound', { default: true })
	.option('--args <args:string>', 'Additional arguments to pass to the script')
	.action(async (options) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		// Resolve absolute path to script
		const scriptPath = path.resolve(options.script)

		// Build command arguments
		const args = [
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

		project.runPython(scriptPath, args)
	})
