import { z } from 'https://deno.land/x/zod/mod.ts'

export const ConfigSchema = z.object({
	engine: z.object({
		path: z.string(),
		cachePath: z.string().optional(),
		source: z.string().optional(),
	}),
	project: z.object({
		name: z.string().optional(),
		path: z.string(),
	}),
	build: z.object({
		path: z.string(),
		id: z.string().optional(),
		branch: z.string().optional(),
		branchSafe: z.string().optional(),
		commit: z.string().optional(),
		commitShort: z.string().optional(),
	}),
	buildkite: z.object({
		branch: z.string(),
		checkout: z.string(),
		buildNumber: z.string(),
		buildCheckoutPath: z.string(),
		buildPipelineSlug: z.string(),
	}),
	git: z.object({
		dependenciesCachePath: z.string(),
		mirrors: z.boolean(),
		mirrorsPath: z.string(),
	}).optional(),
})
