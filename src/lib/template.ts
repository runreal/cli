import { RunrealConfig } from './types.ts'

/**
 * Get the substitutions object with values from the config.
 * @param {RunrealConfig} cfg
 * @returns {Record<string, string | undefined>} the substitutions object
 */
export const getSubstitutions = (cfg: RunrealConfig): Record<string, string | undefined> => ({
	'engine.path': cfg.engine?.path,
	'project.path': cfg.project?.path,
	'project.name': cfg.project?.name,
	'build.id': cfg.build?.id,
	'build.path': cfg.build?.path,
	'build.branch': cfg.build?.branchSafe,
	'build.commit': cfg.build?.commitShort,
	'buildkite.buildNumber': cfg.buildkite?.buildNumber,
})

/**
 * Regular expression for matching ${placeholders}.
 */
const placeholderRegex = /\$\{([^}]+)\}/g

/**
 * Replace all ${placeholders} in the items with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {string[]} input
 * @param {RunrealConfig} cfg
 * @returns {string[]} the rendered items
 */
export function render(input: string[], cfg: RunrealConfig): string[] {
	const substitutions: Record<string, string | undefined> = getSubstitutions(cfg)
	return input.map((arg) =>
		arg.replace(placeholderRegex, (_, key: string) => {
			return key in substitutions ? substitutions[key] || key : _
		})
	)
}

/**
 * Replace all ${placeholders} in the items with values from the substitutions object.
 * If a placeholder is not found in the substitutions object, it will be kept as is.
 * @param {any} item
 * @param {Record<string, string | undefined>} substitutions
 * @returns {any} the rendered items
 */
function renderItems(item: any, substitutions: Record<string, string | undefined>): any {
	if (typeof item === 'string') {
		// Replace placeholders in strings
		return item.replace(/\$\{([^}]+)\}/g, (_, key: string) => substitutions[key] || _)
	} else if (Array.isArray(item)) {
		// Recursively process each item in an array
		return item.map((subItem) => renderItems(subItem, substitutions))
	} else if (typeof item === 'object' && item !== null) {
		// Recursively process each property in an object
		const result: Record<string, any> = {}
		for (const key of Object.keys(item)) {
			result[key] = renderItems(item[key], substitutions)
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
	return renderItems(cfg, substitutions) as RunrealConfig
}
