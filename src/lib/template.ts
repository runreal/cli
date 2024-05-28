import { RunrealConfig } from './types.ts'
import { path } from '../deps.ts'
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
	'buildkite.buildNumber': cfg.buildkite?.buildNumber,
	'metadata.ts': cfg.metadata?.ts,
	'metadata.date': formatIsoTimestamp(cfg.metadata?.ts),
})

/**
 * Regular expression for matching ${placeholders}.
 */
const placeholderRegex = /\$\{([^}]+)\}/g

const pathRegex = /\$path\(([^)]+)\)/g

/**
 * Replace all ${placeholders} in the items with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {string[]} input
 * @param {RunrealConfig} cfg
 * @returns {string[]} the rendered items
 */
export function render(input: string[], cfg: RunrealConfig): string[] {
	const substitutions: Record<string, string | undefined> = getSubstitutions(cfg)
	return input.map((arg) => subReplace(placeholderRegex, arg, substitutions))
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
	} else if (Array.isArray(item)) {
		// Recursively process each item in an array
		return item.map((subItem) => renderItems(subItem, substitutions, replace))
	} else if (typeof item === 'object' && item !== null) {
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
	return renderItems(cfg, substitutions, subReplace) as RunrealConfig
}
