import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { writeMarkdownReport } from '../../lib/report.ts'
import { logger } from '../../lib/logger.ts'

export type RunOptions = typeof run extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

export const run = new Command<GlobalOptions>()
	.description('run buildgraph script')
	.arguments('<buildGraphScript:file> <buildGraphArgs...>')
	.env(
		'RUNREAL_BUILDGRAPH_REPORT_ERRORS=<path:string>',
		'Generate a markdown report with errors at the specified path',
		{ prefix: 'RUNREAL_' },
	)
	.stopEarly()
	.action(async (options, buildGraphScript: string, ...buildGraphArgs: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const project = await createProject(enginePath, projectPath)
		const { success, code } = await project.runCustomBuildGraph(buildGraphScript, buildGraphArgs)
		if (!success) {
			const logs = await project.engine.getAutomationToolLogs(enginePath)

			for (const log of logs.filter(({ level }) => level === 'Error')) {
				logger.info(`[BUILDGRAPH RUN] ${log.message}`)
			}

			if (options.buildgraphReportErrors) {
				await writeMarkdownReport(logs, options.buildgraphReportErrors)
			}

			//Deno.exit(code)
			Deno.exit(1)
		}
	})
