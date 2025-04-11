import { Command, path, readNdjson } from '../../deps.ts'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createEngine } from '../../lib/engine.ts'

export type RunOptions = typeof run extends Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

interface AutomationToolLogs {
	time: string
	level: string
	message: string
	format: string
	properties: Record<string, any>
	id?: number
	line?: number
	lineCount?: number
}

async function getAutomationToolLogs(enginePath: string) {
	const logJson = path.join(enginePath, 'Engine', 'Programs', 'AutomationTool', 'Saved', 'Logs', 'Log.json')
	let logs: AutomationToolLogs[] = []
	try {
		logs = await readNdjson(logJson) as unknown as AutomationToolLogs[]
	} catch (e) {
		// pass
	}
	return logs
}

function generateMarkdownReport(logs: AutomationToolLogs[]): string {
	const errorLogs = logs.filter(({ level }) => level === 'Error')
	if (errorLogs.length === 0) {
		return '# Build Report\n\nNo errors found.'
	}

	let markdown = '# Build Error Report\n\n'

	// Group errors by id
	const errorGroups = new Map<number | string, AutomationToolLogs[]>()

	for (const log of errorLogs) {
		const groupId = log.id !== undefined ? log.id : 'ungrouped'
		if (!errorGroups.has(groupId)) {
			errorGroups.set(groupId, [])
		}
		errorGroups.get(groupId)!.push(log)
	}

	markdown += `## Errors (${errorLogs.length})\n\n`

	// Process each group of errors
	for (const [groupId, groupLogs] of errorGroups) {
		if (groupId !== 'ungrouped') {
			markdown += `### Group ID: ${groupId} (${groupLogs.length} errors)\n\n`
		} else {
			markdown += `### Ungrouped Errors (${groupLogs.length} errors)\n\n`
		}

		for (const log of groupLogs) {
			markdown += `#### Error: ${log.message}\n`

			if (log.properties && log.properties.file) {
				const file = log.properties.file.$text
				const line = log.properties.line?.$text || log.line
				markdown += `- **File**: ${file}${line ? `:${line}` : ''}\n`
			}

			if (log.properties && log.properties.code) {
				markdown += `- **Code**: ${log.properties.code.$text}\n`
			}

			if (log.properties && log.properties.severity) {
				markdown += `- **Severity**: ${log.properties.severity.$text}\n`
			}

			markdown += '\n'
		}
	}

	return markdown
}

async function writeMarkdownReport(logs: AutomationToolLogs[], outputPath: string): Promise<void> {
	const markdown = generateMarkdownReport(logs)
	await Deno.writeTextFile(outputPath, markdown)
	console.log(`[BUILDGRAPH RUN] Error report generated: ${outputPath}`)
}

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
		const { engine: { path: enginePath } } = config.mergeConfigCLIConfig({ cliOptions: options })
		const engine = createEngine(enginePath)
		const { success, code } = await engine.runBuildGraph(buildGraphScript, buildGraphArgs)
		if (!success) {
			const logs = await getAutomationToolLogs(enginePath)

			for (const log of logs.filter(({ level }) => level === 'Error')) {
				console.log(`[BUILDGRAPH RUN] ${log.message}`)
			}

			if (options.buildgraphReportErrors) {
				await writeMarkdownReport(logs, options.buildgraphReportErrors)
			}

			Deno.exit(code)
		}
	})
