import { Command } from '@cliffy/command'
import type { GlobalOptions } from '../../lib/types.ts'
import { logger } from '../../lib/logger.ts'

export type ParseOptions = typeof parse extends
	Command<void, void, infer Options extends Record<string, unknown>, [], GlobalOptions> ? Options
	: never

/**
 * Normalizes path strings in Unreal Engine format by handling escaped slashes
 * @param path The path string to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
	if (!path) return path

	// If the path is enclosed in quotes, remove them
	if (path.startsWith('"') && path.endsWith('"')) {
		path = path.substring(1, path.length - 1)
	}

	// Replace escaped backslashes with forward slashes
	return path.replace(/\\\\/g, '/')
}

/**
 * Handles string values by removing quotes and normalizing paths
 * @param value String value to process
 * @returns Processed string
 */
function processStringValue(value: string): string {
	if (!value) return value

	// If it's a quoted string, unquote it
	if (value.startsWith('"') && value.endsWith('"')) {
		value = value.substring(1, value.length - 1)
	}

	// If it looks like a path (contains /Script/ or has forward slashes)
	if (value.includes('/Script/') || value.includes('/') || value.includes('\\')) {
		return normalizePath(value)
	}

	return value
}

/**
 * Parses an Unreal Engine Blueprint .copy file into a JavaScript object
 * @param fileContent The content of the .copy file as a string
 * @returns The parsed blueprint object
 */
function parseBlueprint(fileContent: string) {
	const lines = fileContent.split('\n')
	const stack: any[] = []
	let currentObject: any = null
	const rootObjects: any[] = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		if (line.startsWith('Begin Object')) {
			// Extract Class and Name using regex
			const classMatch = line.match(/Class=([^\s"]+)/)
			const nameMatch = line.match(/Name="([^"]+)"/)
			const exportPathMatch = line.match(/ExportPath="([^"]+)"/)

			const newObject: any = {
				type: 'object',
				properties: {},
				children: [],
			}

			if (classMatch) newObject.class = normalizePath(classMatch[1])
			if (nameMatch) newObject.name = nameMatch[1]
			if (exportPathMatch) newObject.exportPath = normalizePath(exportPathMatch[1])

			if (currentObject) {
				stack.push(currentObject)
				currentObject.children.push(newObject)
			} else {
				rootObjects.push(newObject)
			}
			currentObject = newObject
		} else if (line.startsWith('End Object')) {
			if (stack.length > 0) {
				currentObject = stack.pop()
			} else {
				currentObject = null
			}
		} else if (currentObject && line.includes('=')) {
			// Handle property lines
			const equalPos = line.indexOf('=')
			const key = line.substring(0, equalPos).trim()
			const value = line.substring(equalPos + 1).trim()

			// Special handling for complex properties like arrays, parenthesized values, etc.
			if (value.startsWith('(') && !value.endsWith(')')) {
				// This is a multi-line property
				let complexValue = value
				while (!complexValue.endsWith(')') && i < lines.length - 1) {
					i++
					complexValue += `  ${lines[i].trim()}`
				}
				currentObject.properties[key] = parseComplexProperty(complexValue)
			} else if (value.startsWith('(')) {
				// Parse complex property with parentheses into an object
				const parsedValue = parseComplexProperty(value)
				currentObject.properties[key] = parsedValue
			} else if (key.startsWith('CustomProperties')) {
				// Handle CustomProperties as a special case
				if (!currentObject.customProperties) {
					currentObject.customProperties = []
				}
				currentObject.customProperties.push(processStringValue(value))
			} else if (key.includes('(')) {
				// Handle array properties like Nodes(0)
				const arrayMatch = key.match(/([^\(]+)\((\d+)\)/)
				if (arrayMatch) {
					const arrayName = arrayMatch[1]
					const arrayIndex = Number.parseInt(arrayMatch[2])

					if (!currentObject.properties[arrayName]) {
						currentObject.properties[arrayName] = []
					}

					// Ensure array has enough elements
					while (currentObject.properties[arrayName].length <= arrayIndex) {
						currentObject.properties[arrayName].push(null)
					}

					// Process string values in array elements
					const processedValue = value.startsWith('"') ||
							value.includes('/') ||
							value.includes('\\')
						? processStringValue(value)
						: value

					currentObject.properties[arrayName][arrayIndex] = processedValue
				} else {
					currentObject.properties[key] = processStringValue(value)
				}
			} else {
				currentObject.properties[key] = processStringValue(value)
			}
		}
	}

	return rootObjects.length === 1 ? rootObjects[0] : rootObjects
}

/**
 * Parse complex properties with parentheses, typically representing structs
 * @param value The complex property value string
 * @returns Parsed object representation
 */
function parseComplexProperty(value: string): any {
	if (!value.startsWith('(') || !value.endsWith(')')) {
		return processStringValue(value)
	}

	// Remove outer parentheses
	const content = value.substring(1, value.length - 1)

	// Split by commas, handling nested parentheses
	const parts: string[] = []
	let currentPart = ''
	let depth = 0
	let inQuotes = false

	for (let i = 0; i < content.length; i++) {
		const char = content[i]

		// Handle quotes to avoid splitting inside quoted strings
		if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
			inQuotes = !inQuotes
		}

		if (!inQuotes) {
			if (char === '(') depth++
			else if (char === ')') depth--
			else if (char === ',' && depth === 0) {
				parts.push(currentPart.trim())
				currentPart = ''
				continue
			}
		}

		currentPart += char
	}

	if (currentPart) {
		parts.push(currentPart.trim())
	}

	// Convert parts to key-value pairs
	const result: Record<string, any> = {}

	for (const part of parts) {
		const equalPos = part.indexOf('=')
		if (equalPos !== -1) {
			const key = part.substring(0, equalPos).trim()
			const val = part.substring(equalPos + 1).trim()

			// Recursively parse nested complex properties
			if (val.startsWith('(') && val.endsWith(')')) {
				result[key] = parseComplexProperty(val)
			} else {
				result[key] = processStringValue(val)
			}
		} else {
			// Handle valueless properties or booleans
			result[part.trim()] = true
		}
	}

	return result
}

export const parse = new Command<GlobalOptions>()
	.description('parse exported uasset')
	.option('-i, --input <file:string>', 'Path to the exported uasset file', { required: true })
	.option('-o, --output <file:string>', 'Output file path for the JSON result', { required: false })
	.option('--pretty', 'Pretty print the JSON output', { default: true })
	.action((options) => {
		try {
			const data = Deno.readTextFileSync(options.input)
			const parsedObject = parseBlueprint(data)

			const jsonOutput = options.pretty ? JSON.stringify(parsedObject, null, 2) : JSON.stringify(parsedObject)

			if (options.output) {
				Deno.writeTextFileSync(options.output, jsonOutput)
				logger.info(`Parsed blueprint written to ${options.output}`)
			} else {
				console.log(jsonOutput)
			}
		} catch (error: unknown) {
			logger.error(`Error parsing blueprint: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	})
