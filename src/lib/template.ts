import { RunrealConfig } from './types.ts'

// This helper function will take a command string with placeholders and a substitutions object
// It will replace all placeholders in the command with their corresponding values
// If the key is not found in substitutions, keep the original placeholder
export function render(input: string[], cfg: RunrealConfig) {
	// This regular expression matches all occurrences of ${placeholder}
	const substitutions: Record<string, string | undefined> = getSubstitutions(cfg)

	const placeholderRegex = /\$\{([^}]+)\}/g
	return input.map((arg) =>
		arg.replace(placeholderRegex, (_, key: string) => {
			return key in substitutions ? substitutions[key] || key : _
		})
	)
}

// Object containing the allowed substitutions
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
