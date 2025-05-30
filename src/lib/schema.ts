import { z } from 'zod'
import * as path from 'node:path'

const env = (key: string) => process.env[key] || ''

export const InternalConfigSchema = z.object({
	metadata: z.object({
		ts: z.string().default(env('RUNREAL_BUILD_TS') || new Date().toISOString()).describe('Timestamp'),
		safeRef: z.string().default('').describe('Safe reference for file outputs or build ids'),
		git: z.object({
			ref: z.string().default('').describe('Git ref'),
			branch: z.string().default('').describe('Branch name'),
			branchSafe: z.string().default('').describe('Safe branch name'),
			commit: z.string().default('').describe('Commit hash'),
			commitShort: z.string().default('').describe('Short commit hash'),
		}),
		perforce: z.object({
			ref: z.string().default('').describe('Perforce ref'),
			stream: z.string().default('').describe('Stream name'),
			changelist: z.string().default('').describe('Changelist number'),
		}),
		buildkite: z.object({
			branch: z.string().default(env('BUILDKITE_BRANCH')).describe('Buildkite branch name'),
			checkout: z.string().default(env('BUILDKITE_COMMIT')).describe('Buildkite commit hash'),
			buildNumber: z.string().default(env('BUILDKITE_BUILD_NUMBER') || '0').describe('Buildkite build number'),
			buildCheckoutPath: z.string().default(
				env('BUILDKITE_BUILD_CHECKOUT_PATH') || process.cwd(),
			).describe('Buildkite build checkout path'),
			buildPipelineSlug: z.string().default(env('BUILDKITE_PIPELINE_SLUG') || '').describe('Buildkite pipeline slug'),
		}).optional(),
	}),
})

export const UserConfigSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().optional().default(process.cwd()).describe('Path to the engine folder'),
		repoType: z.string().optional().describe('git or perforce'),
		gitSource: z.string().optional().describe('git source repository'),
		gitBranch: z.string().optional().default('main').describe('git branch to checkout'),
		gitDependenciesCachePath: z
			.string()
			.optional()
			.describe('Path to git dependencies cache folder <RUNREAL_GIT_DEPENDENCIES_CACHE_PATH>'),
	}),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().optional().default(process.cwd()).describe('Path to the project folder <RUNREAL_PROJECT_PATH>'),
		buildPath: z.string().optional().default(
			path.join(process.cwd(), 'build'),
		).describe('Path to the build folder <RUNREAL_BUILD_PATH>'),
		repoType: z.string().optional().default('git').describe('git or perforce'),
	}),
	build: z.object({
		id: z.string().default(env('RUNREAL_BUILD_ID') || '').describe('Build id <RUNREAL_BUILD_ID>'),
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

export type UserConfig = z.infer<typeof UserConfigSchema>

export const UserConfigSchemaForJsonSchema = z.object({
	'$schema': z.string().optional().describe('Runreal JSON-Schema spec version'),
	engine: z.object({
		path: z.string().optional().describe('Path to the engine folder'),
		repoType: z.string().optional().describe('git or perforce'),
		gitSource: z.string().optional().describe('git source repository'),
		gitBranch: z.string().optional().describe('git branch to checkout'),
		gitDependenciesCachePath: z
			.string()
			.optional()
			.describe('Path to git dependencies cache folder <RUNREAL_GIT_DEPENDENCIES_CACHE_PATH>'),
	}).optional(),
	project: z.object({
		name: z.string().optional().describe('Project name'),
		path: z.string().optional().describe('Path to the project folder <RUNREAL_PROJECT_PATH>'),
		buildPath: z.string().optional().describe('Path to the build folder <RUNREAL_BUILD_PATH>'),
		repoType: z.string().optional().describe('git or perforce'),
	}),
	build: z.object({
		id: z.string().describe('Build id <RUNREAL_BUILD_ID>'),
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
	).optional(),
})

export const RunrealConfigSchema = z.object({
	...UserConfigSchema.shape,
	...InternalConfigSchema.shape,
	build: z.object({
		id: z.string().describe('Build ID, guaranteed to be set after config processing.'),
	}),
})

export const UserRunrealPreferencesSchema = z.object({
	accessToken: z.string().optional().describe('RUNREAL access token'),
})
