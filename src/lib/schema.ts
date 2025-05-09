import { z } from 'zod'
const env = (key: string) => Deno.env.get(key) || ''

export const InternalSchema = z.object({
	buildkite: z.object({
		branch: z.string().describe('Buildkite branch name').default(env('BUILDKITE_BRANCH')),
		checkout: z.string().describe('Buildkite commit hash').default(env('BUILDKITE_COMMIT')),
		buildNumber: z.string().describe('Buildkite build number').default(env('BUILDKITE_BUILD_NUMBER') || '0'),
		buildCheckoutPath: z.string().describe('Buildkite build checkout path').default(
			env('BUILDKITE_BUILD_CHECKOUT_PATH') || Deno.cwd(),
		),
		buildPipelineSlug: z.string().describe('Buildkite pipeline slug').default(env('BUILDKITE_PIPELINE_SLUG') || ''),
	}),
	metadata: z.object({
		ts: z.string().describe('Timestamp').default(env('RUNREAL_BUILD_TS') || new Date().toISOString()),
		safeRef: z.string().describe('Safe reference for file outputs or build ids').default(''),
		git: z.object({
			branch: z.string().describe('Branch name').default(''),
			branchSafe: z.string().describe('Safe branch name').default(''),
			commit: z.string().describe('Commit hash').default(''),
			commitShort: z.string().describe('Short commit hash').default(''),
		}),
		perforce: z.object({
			stream: z.string().describe('Stream name').default(''),
			changelist: z.string().describe('Changelist number').default(''),
		}),
	}),
})

export const ConfigSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().describe('Path to the engine folder').optional().default(''),
		//repoType: z.string().describe('git or perforce'),
		gitSource: z.string().optional().describe('git source repository').optional(),
		gitBranch: z.string().optional().describe('git branch to checkout').default('main').optional(),
		gitDependenciesCachePath: z
			.string()
			.optional()
			.describe('Path to git dependencies cache folder <RUNREAL_GIT_DEPENDENCIES_CACHE_PATH>'),
	}),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().describe('Path to the project folder <RUNREAL_PROJECT_PATH>').optional(),
		buildPath: z.string().describe('Path to the build folder <RUNREAL_BUILD_PATH>').optional(),
		repoType: z.string().describe('git or perforce').default('git'),
	}),
	build: z.object({
		id: z.string().describe('Build id <RUNREAL_BUILD_ID>').default(env('RUNREAL_BUILD_ID') || ''),
	}).optional(),
	workflows: z.array(
		z.object({
			id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9\-]*$/).optional().describe('Workflow id'),
			name: z.string().describe('Workflow name'),
			steps: z.array(
				z.object({
					command: z.string().describe('Command to execute'),
					args: z.array(z.string()).optional().describe('Command arguments'),
					condition: z.string().optional().describe('Condition to execute the workflow'),
				}),
			),
		}),
	).optional().default([]),
})

export const RunrealConfigSchema = z.object({
	...ConfigSchema.shape,
	...InternalSchema.shape,
})

// Deprecated
// export const UserRunrealConfigSchema = ConfigSchema.deepPartial()

export const UserRunrealPreferencesSchema = z.object({
	accessToken: z.string().optional().describe('RUNREAL access token'),
})
