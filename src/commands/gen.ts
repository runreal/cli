import { Command } from '@cliffy/command'
import { createEngine } from '../lib/engine.ts'
import { exec, findProjectFile } from '../lib/utils.ts'

export type GenOptions = typeof gen extends Command<void, void, infer Options extends Record<string, unknown>, [], void>
	? Options
	: never

export const gen = new Command()
	.description('generate')
	.option('-p, --project-path <project-path:file>', 'Path to project folder', {
		default: 'E:\\Project',
	})
	.option('-e, --engine-path <engine-path:file>', 'Path to engine folder', {
		default: 'E:\\UnrealEngine',
	})
	.option('-d, --dry-run', 'Dry run')
	.arguments('<args...:string>')
	.action(
		async (
			{ projectPath, enginePath, dryRun },
			...args: string[]
		) => {
			const projectFile = await findProjectFile(projectPath)
			const engine = createEngine(enginePath)

			if (dryRun) {
				console.log(`[gen] enginePath: ${enginePath}`)
				console.log(`[gen] projectPath: ${projectPath}`)
				console.log(`[gen] projectFile: ${projectFile}`)
				console.log(`[gen] command: ${args.join(' ')}`)
			}

			// Generate project
			// GenerateProjectFiles.bat -project=E:\Project\TestProject.uproject -game -engine
			await exec(engine.getGenerateScript(), [
				`-project=${projectFile}`,
				...args,
			])
		},
	)
