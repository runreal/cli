import { z } from '/deps.ts'
export const ConfigSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().describe('Path to the engine folder'),
		cachePath: z
			.string()
			.optional()
			.describe('Path to the engine cache folder'),
		source: z.string().optional().describe('Source repository'),
	}),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().describe('Path to the project folder'),
	}),
	build: z.object({
		path: z.string().describe('Path to the build folder'),
		id: z.string().optional().describe('Build id'),
		branch: z.string().optional().describe('Branch name'),
		branchSafe: z
			.string()
			.optional()
			.describe('Branch name safe for filenames'),
		commit: z.string().optional().describe('Commit hash'),
		commitShort: z.string().optional().describe('Short commit hash'),
	}),
	buildkite: z.object({
		branch: z.string().describe('Buildkite branch name'),
		checkout: z.string().describe('Buildkite commit hash'),
		buildNumber: z.string().describe('Buildkite build number'),
		buildCheckoutPath: z.string().describe('Buildkite build checkout path'),
		buildPipelineSlug: z.string().describe('Buildkite pipeline slug'),
	}),
	git: z
		.object({
			dependenciesCachePath: z
				.string()
				.describe('Path to git dependencies cache folder'),
			mirrors: z.boolean().describe('Use git mirrors'),
			mirrorsPath: z.string().describe('Path to git mirrors folder'),
		})
		.optional(),
})
