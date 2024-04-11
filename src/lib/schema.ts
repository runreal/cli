import { z } from '../deps.ts'

export const InternalSchema = z.object({
	buildkite: z.object({
		branch: z.string().describe('Buildkite branch name'),
		checkout: z.string().describe('Buildkite commit hash'),
		buildNumber: z.string().describe('Buildkite build number'),
		buildCheckoutPath: z.string().describe('Buildkite build checkout path'),
		buildPipelineSlug: z.string().describe('Buildkite pipeline slug'),
	}),
})

export const ConfigSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().describe('Path to the engine folder'),
		cachePath: z
			.string()
			.optional()
			.describe('Path to the engine cache folder <RUNREAL_ENGINE_PATH>'),
		source: z.string().optional().describe('Source repository'),
		repoType: z.string().describe('git or perforce'),
	}),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().describe('Path to the project folder <RUNREAL_PROJECT_PATH>'),
		repoType: z.string().describe('git or perforce'),
	}),
	build: z.object({
		path: z.string().describe('Path to the build folder <RUNREAL_BUILD_PATH>'),
		id: z.string().optional().describe('Build id <RUNREAL_BUILD_ID>'),
		branch: z.string().optional().describe('Branch name'),
		branchSafe: z
			.string()
			.optional()
			.describe('Branch name safe for filenames'),
		commit: z.string().optional().describe('Commit hash'),
		commitShort: z.string().optional().describe('Short commit hash'),
	}),
	git: z
		.object({
			dependenciesCachePath: z
				.string()
				.optional()
				.describe('Path to git dependencies cache folder <RUNREAL_GIT_DEPENDENCIES_CACHE_PATH>'),
			mirrors: z.boolean().optional().describe('Use git mirrors'),
			mirrorsPath: z.string().optional().describe('Path to git mirrors folder <RUNREAL_GIT_MIRRORS_PATH>'),
		})
		.optional(),
	workflows: z.array(
		z.object({
			name: z.string().describe('Workflow name'),
			steps: z.array(
				z.object({
					command: z.string().describe('Command to execute'),
					args: z.array(z.string()).optional().describe('Command arguments'),
				}),
			),
		})
			.optional(),
	),
})
