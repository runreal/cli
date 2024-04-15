import { assert, assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { Config } from '../src/lib/config.ts'
import { path, ulid } from '../src/deps.ts'
import { CliOptions } from '../src/lib/types.ts'

Deno.test('Config.create should initialize with default values', async () => {
	const config = await Config.create()
	const id = ulid()
	config.getBuildId = () => id
	const expected = {
		engine: {
			path: '',
			repoType: 'git',
		},
		project: {
			name: '',
			path: '',
			buildPath: '',
			repoType: 'git',
		},
		build: {
			id,
		},
		buildkite: {
			branch: '',
			checkout: '',
			buildNumber: '0',
			buildCheckoutPath: Deno.cwd(),
			buildPipelineSlug: '',
		},
		metadata: {
			safeRef: '',
			git: {
				branch: '',
				branchSafe: '',
				commit: '',
				commitShort: '',
			},
			perforce: {
				stream: '',
				changelist: '',
			},
		},
		workflows: [],
	}
	assertEquals(config.get(), expected)
})

Deno.test('Config.create should load environment variables', async () => {
	Deno.env.set('RUNREAL_BUILD_ID', 'test-id')
	const config = await Config.create()
	assertEquals(config.get().build.id, 'test-id')
	Deno.env.delete('RUNREAL_BUILD_ID')
})

Deno.test('Config.get should apply CLI options', async () => {
	const config = await Config.create()
	const id = ulid()
	config.getBuildId = () => id
	const enginePath = path.normalize('/path/to/engine')
	const projectPath = path.normalize('/path/to/project')
	const cliOptions: CliOptions = {
		enginePath: enginePath as any,
		projectPath: projectPath as any,
	}
	const result = config.get(cliOptions)
	assert(result.engine.path.includes(enginePath))
	assert(result.project.path.includes(projectPath))
})
