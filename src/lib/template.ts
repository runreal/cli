import type { RunrealConfig } from './types.ts'
import * as path from '@std/path'
import { formatIsoTimestamp } from './utils.ts'

/**
 * Get the substitutions object with values from the config.
 * @param {RunrealConfig} cfg
 * @returns {Record<string, string | undefined>} the substitutions object
 */
export const getSubstitutions = (cfg: RunrealConfig): Record<string, string | undefined> => ({
	'engine.path': cfg.engine?.path,
	'project.path': cfg.project?.path,
	'project.name': cfg.project?.name,
	'project.buildPath': cfg.project?.buildPath,
	'build.path': cfg.project?.buildPath,
	'build.id': cfg.build?.id,
	'metadata.safeRef': cfg.metadata?.safeRef,
	'metadata.git.branch': cfg.metadata?.git?.branchSafe,
	'metadata.git.commit': cfg.metadata?.git?.commitShort,
	'metadata.perforce.stream': cfg.metadata?.perforce?.stream,
	'metadata.perforce.changelist': cfg.metadata?.perforce?.changelist,
	'metadata.buildkite.buildNumber': cfg.metadata.buildkite?.buildNumber,
	'metadata.ts': cfg.metadata?.ts,
	'metadata.date': formatIsoTimestamp(cfg.metadata?.ts),
})

/**
 * Regular expression for matching ${placeholders}.
 */
const placeholderRegex = /\$\{([^}]+)\}/g

const pathRegex = /\$path\(([^)]+)\)/g

/**
 * Replace all ${placeholders} in a string with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {string} input Single string to render
 * @param {RunrealConfig} cfg Config to use for substitutions
 * @returns {string} The rendered string
 */
export function render(input: string, cfg: RunrealConfig): string
/**
 * Replace all ${placeholders} in an array of strings with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {string[]} input Array of strings to render
 * @param {RunrealConfig} cfg Config to use for substitutions
 * @returns {string[]} The rendered strings
 */
export function render(input: string[], cfg: RunrealConfig): string[]
export function render(input: string | string[], cfg: RunrealConfig): string | string[] {
	const substitutions: Record<string, string | undefined> = getSubstitutions(cfg)

	if (typeof input === 'string') {
		return subReplace(placeholderRegex, input, substitutions)
	}

	const rendered = input.map((arg) => subReplace(placeholderRegex, arg, substitutions))
	return rendered
}

const subReplace = (regex: RegExp, item: string, substitutions: Record<string, string | undefined>) => {
	return item.replace(regex, (_, key: string) => {
		return key in substitutions ? substitutions[key] || key : _
	})
}

export function normalizePaths(item: any): any {
	const re = (_: any, str: string) =>
		str.replace(pathRegex, (_: any, ...matches: any[]): string => {
			return path.normalize(matches[0]).split(/\/|\\/).join('/')
		})
	return renderItems(item, {}, re)
}

/**
 * Replace all ${placeholders} in the items with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {any} item
 * @param {Record<string, string | undefined>} substitutions
 * @returns {any} the rendered items
 */
function renderItems(
	item: any,
	substitutions: Record<string, string | undefined>,
	replace: (...a: any) => string,
): any {
	if (typeof item === 'string') {
		// Replace placeholders in strings
		return replace(placeholderRegex, item, substitutions)
	}
	if (Array.isArray(item)) {
		// Recursively process each item in an array
		return item.map((subItem) => renderItems(subItem, substitutions, replace))
	}
	if (typeof item === 'object' && item !== null) {
		// Recursively process each property in an object
		const result: Record<string, any> = {}
		for (const key of Object.keys(item)) {
			result[key] = renderItems(item[key], substitutions, replace)
		}
		return result
	}
	// Return the item as is if it's not a string, array, or object
	return item
}

/**
 * Render the config by replacing all ${placeholders} with values from the substitutions object.
 * @param {RunrealConfig} cfg
 * @returns {RunrealConfig} rendered RunrealConfig
 */
export function renderConfig(cfg: RunrealConfig) {
	const substitutions: Record<string, string | undefined> = getSubstitutions(cfg)
	const rendered = renderItems(cfg, substitutions, subReplace) as RunrealConfig
	const normalized = normalizePaths(rendered)
	return normalized
}
