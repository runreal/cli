import { AutomationToolLogs } from '../lib/engine.ts'

export function generateMarkdownReport(logs: AutomationToolLogs[]): string {
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

			if (log.properties?.file) {
				const file = log.properties.file.$text
				const line = log.properties.line?.$text || log.line
				markdown += `- **File**: ${file}${line ? `:${line}` : ''}\n`
			}

			if (log.properties?.code) {
				markdown += `- **Code**: ${log.properties.code.$text}\n`
			}

			if (log.properties?.severity) {
				markdown += `- **Severity**: ${log.properties.severity.$text}\n`
			}

			markdown += '\n'
		}
	}

	return markdown
}

export async function writeMarkdownReport(logs: AutomationToolLogs[], outputPath: string): Promise<void> {
	const { writeFile } = await import('node:fs/promises')
	const markdown = generateMarkdownReport(logs)
	await writeFile(outputPath, markdown, 'utf8')
	console.log(`[BUILDGRAPH RUN] Error report generated: ${outputPath}`)
}
