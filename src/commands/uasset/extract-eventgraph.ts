import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'
import { generateBlueprintHtml } from '../../lib/utils.ts'
import { logger } from '../../lib/logger.ts'
import * as path from 'jsr:@std/path'
import * as fs from 'jsr:@std/fs'

export type ExtractEventGraphOptions = typeof extractEventGraph extends
	Command<void, void, infer Options extends Record<string, unknown>, [], GlobalOptions> ? Options
	: never

/**
 * Find the EventGraph section in the exported uasset file as is
 * @param fileContent The content of the .copy file as a string
 * @returns The EventGraph section as a string, or null if not found
 */
function findEventGraph(fileContent: string): string | null {
	// Find the "Begin Object Name="EventGraph"" section
	const lines = fileContent.split('\n')
	const eventGraphNodes: string[] = []

	let insideEventGraph = false
	let insideNodeSection = false
	let nodeCount = 0
	let currentObject = ''
	let insideBeginObjectBlock = false

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		if (!line) continue

		// Check if we're starting a Begin Object Name="EventGraph" section
		if (line.startsWith('Begin Object Name="EventGraph"')) {
			insideEventGraph = true
			nodeCount = 0
			insideNodeSection = false
			continue
		}

		// Skip the end of the EventGraph parent object
		if (insideEventGraph && line === 'End Object' && !insideBeginObjectBlock && !insideNodeSection) {
			insideEventGraph = false
			continue
		}

		// Check if we're inside an EventGraph and starting a node section with Begin Object Name="..."
		if (insideEventGraph && line.startsWith('Begin Object Name="K2Node_')) {
			nodeCount++
			currentObject = line
			eventGraphNodes.push(currentObject)
			insideBeginObjectBlock = true
			continue
		}

		// Process EventGraph child blocks that define nodes
		if (insideEventGraph && line.startsWith('Begin Object Class="/Script/BlueprintGraph.K2Node_')) {
			nodeCount++
			currentObject = line
			eventGraphNodes.push(currentObject)
			insideBeginObjectBlock = true
			continue
		}

		// If we're inside a node definition in the EventGraph, keep collecting its content
		if (
			insideEventGraph && insideBeginObjectBlock && !line.startsWith('Begin Object') && !line.startsWith('End Object')
		) {
			eventGraphNodes.push('   ' + line)
			continue
		}

		// Handle the end of a node's Begin/End Object block
		if (insideEventGraph && insideBeginObjectBlock && line === 'End Object') {
			eventGraphNodes.push(line)
			insideBeginObjectBlock = false
			currentObject = ''
			continue
		}
	}

	// Return the extracted EventGraph nodes, or null if none found
	return nodeCount > 0 ? eventGraphNodes.join('\n') : null
}

async function extractEventGraphFromFile(filePath: string, render: boolean) {
	const data = await Deno.readTextFile(filePath)
	const eventGraph = findEventGraph(data)
	if (eventGraph) {
		if (render) {
			const html = generateBlueprintHtml(eventGraph)
			const basename = path.basename(filePath, path.extname(filePath))
			const basepath = path.dirname(filePath)
			await Deno.writeTextFile(`${basepath}/${basename}.html`, html)
		} else {
			logger.info(eventGraph)
		}
	}
}

export const extractEventGraph = new Command<GlobalOptions>()
	.description('extract event graph from exported uasset')
	.option('-i, --input <file:string>', 'Path to the exported uasset file or directory containing exported uassets', {
		required: true,
	})
	.option('-r, --render', 'Save the output as rendered html', { default: false })
	.action(async (options) => {
		try {
			const isDirectory = await fs.exists(options.input, { isDirectory: true })
			if (isDirectory) {
				const files = await Deno.readDir(options.input)
				for await (const file of files) {
					if (file.isFile) {
						await extractEventGraphFromFile(path.join(options.input, file.name), options.render)
					}
				}
			} else {
				await extractEventGraphFromFile(options.input, options.render)
			}
		} catch (error: unknown) {
			logger.error(`Error parsing blueprint: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	})
