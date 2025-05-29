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
		const cfg = Config.instance().process(options)

		const project = await createProject(cfg.engine.path, cfg.project.path)
		const { success, code } = await project.runBuildGraph(buildGraphScript, buildGraphArgs)
		if (!success) {
			const logs = await project.engine.getAutomationToolLogs(cfg.engine.path)

			for (const log of logs.filter(({ level }) => level === 'Error')) {
				logger.info(`[BUILDGRAPH RUN] ${log.message}`)
			}

			if (options.buildgraphReportErrors) {
				await writeMarkdownReport(logs, options.buildgraphReportErrors)
			}

			Deno.exit(code)
		}
	})
