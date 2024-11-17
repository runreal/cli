import { cmd } from '../../cmd.ts'
import { Command, path, readNdjson } from '../../deps.ts'
import { config } from '../../lib/config.ts'
import { createEngine } from '../../lib/engine.ts'
import type { CliOptions, GlobalOptions } from '../../lib/types.ts'

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
		const { engine: { path: enginePath } } = config.get(options as CliOptions)
		const engine = createEngine(enginePath)
		const { success, code } = await engine.runBuildGraph(buildGraphScript, buildGraphArgs)
		if (!success) {
			const logs = await getAutomationToolLogs(enginePath)
			logs.filter(({ level }) => level === 'Error').forEach(({ message }) => console.log(`[BUILDGRAPH RUN] ${message}`))
			Deno.exit(code)
		}
	})
