import { z } from '../deps.ts'

export const InternalSchema = z.object({
	buildkite: z.object({
		branch: z.string().describe('Buildkite branch name').optional(),
		checkout: z.string().describe('Buildkite commit hash').optional(),
		buildNumber: z.string().describe('Buildkite build number').optional(),
		buildCheckoutPath: z.string().describe('Buildkite build checkout path').optional(),
		buildPipelineSlug: z.string().describe('Buildkite pipeline slug').optional(),
	}).optional(),
	metadata: z.object({
		safeRef: z.string().describe('Safe reference for file outputs or build ids').optional(),
		git: z.object({
			branch: z.string().describe('Branch name'),
			branchSafe: z.string().describe('Safe branch name'),
			commit: z.string().describe('Commit hash'),
			commitShort: z.string().describe('Short commit hash'),
		}).optional(),
		perforce: z.object({
			stream: z.string().describe('Stream name'),
			changelist: z.string().describe('Changelist number'),
		}).optional(),
	}),
})

export const ConfigSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().describe('Path to the engine folder'),
		repoType: z.string().describe('git or perforce'),
		gitSource: z.string().optional().describe('git source repository'),
		gitDependenciesCachePath: z
			.string()
			.optional()
			.describe('Path to git dependencies cache folder <RUNREAL_GIT_DEPENDENCIES_CACHE_PATH>'),
	}),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().describe('Path to the project folder <RUNREAL_PROJECT_PATH>'),
		buildPath: z.string().describe('Path to the build folder <RUNREAL_BUILD_PATH>'),
		repoType: z.string().describe('git or perforce'),
	}),
	build: z.object({
		id: z.string().optional().describe('Build id <RUNREAL_BUILD_ID>'),
	}),
	workflows: z.array(
		z.object({
			name: z.string().describe('Workflow name'),
			steps: z.array(
				z.object({
					command: z.string().describe('Command to execute'),
					args: z.array(z.string()).optional().describe('Command arguments'),
				}),
			),
		}),
	).optional(),
})
