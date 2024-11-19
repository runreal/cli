import { Command, path, readNdjson } from '../../deps.ts'
import { Config } from '../../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../../lib/types.ts'
import { createEngine } from '../../lib/engine.ts'

export type RunOptions = typeof run extends Command<any, any, infer Options, any, any> ? Options
	: never

interface AutomationToolLogs {
	time: string
	level: string
	message: string
	format: string
	properties: Record<string, string>
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

export const run = new Command<GlobalOptions>()
	.description('run buildgraph script')
	.arguments('<buildGraphScript:file> <buildGraphArgs...>')
	.stopEarly()
	.action(async (options, buildGraphScript: string, ...buildGraphArgs: Array<string>) => {
		const config = Config.getInstance()
		const { engine: { path: enginePath } } = config.mergeConfigCLIConfig({ cliOptions: options as CliOptions })
		const engine = createEngine(enginePath)
		const { success, code } = await engine.runBuildGraph(buildGraphScript, buildGraphArgs)
		if (!success) {
			const logs = await getAutomationToolLogs(enginePath)

			for (const message of logs.filter(({ level }) => level === 'Error')) {
				console.log(`[BUILDGRAPH RUN] ${message}`)
			}
			Deno.exit(code)
		}
	})
