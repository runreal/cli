import { RunrealConfig } from '/lib/types.ts'

export const render = (template: string, data: any) => {
	return new Function(
		'vars',
		[
			'const keys = (' + Object.keys(data).join(', ') + ') =>',
			'`' + template + '`',
			'return keys(...Object.values(vars))',
		].join('\n'),
	)(data)
}

// Object containing the allowed substitutions
export const getSubstitutions = (cfg: any): Partial<RunrealConfig> => {
	const buildkite: Partial<RunrealConfig['buildkite']> = {
		buildNumber: cfg.buildkite?.buildNumber || 'buildkite.buildNumber',
	}
	return {
		engine: {
			path: cfg.engine?.path || 'engine.path',
		},
		project: {
			path: cfg.project?.path || 'project.path',
			name: cfg.project?.name || 'project.name',
		},
		build: {
			id: cfg.build?.id || 'build.id',
			path: cfg.build?.path || 'build.path',
			branch: cfg.build?.branchSafe || 'build.branch',
			commit: cfg.build?.commitShort || 'build.commit',
		},
		// @ts-ignore partial
		buildkite,
	}
}
