import { assert, assertEquals } from '@std/assert'
import { Config } from '../src/lib/config.ts'
import { path, ulid } from '../src/deps.ts'
import type { CliOptions } from '../src/lib/types.ts'
import { FakeTime } from '@std/testing/time'

Deno.test('Config.create should initialize with default values', async () => {
	using time = new FakeTime()

	const config = await Config.getInstance()
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
			id: config.getConfig().build.id,
		},
		buildkite: {
			branch: '',
			checkout: '',
			buildNumber: '0',
			buildCheckoutPath: Deno.cwd(),
			buildPipelineSlug: '',
		},
		metadata: {
			ts: config.getConfig().metadata.ts,
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
	assertEquals(config.getConfig(), expected)
})

Deno.test('Config.get should apply CLI options', async () => {
	const config = await Config.getInstance()
	const id = ulid()
	config.getBuildId = () => id
	const enginePath = path.normalize('/path/to/engine')
	const projectPath = path.normalize('/path/to/project')
	const cliOptions: CliOptions = {
		enginePath: enginePath as any,
		projectPath: projectPath as any,
	}
	const result = config.mergeConfigCLIConfig({ cliOptions })
	assert(result.engine.path.includes(enginePath))
	assert(result.project.path.includes(projectPath))
})

Deno.test('Config.get with path', async () => {
	const config = Config.getInstance()
	await config.loadConfig({ path: './fixtures/test.config.json' })
	const id = ulid()
	config.getBuildId = () => id
	const enginePath = path.normalize('/path/to/engine')
	const projectPath = path.normalize('/path/to/project')
	const cliOptions: CliOptions = {
		enginePath: enginePath as any,
		projectPath: projectPath as any,
	}
	const result = config.mergeConfigCLIConfig({ cliOptions })
	assert(result.engine.path.includes(enginePath))
	assert(result.project.path.includes(projectPath))
})

//  I have issue with this test because the default config is loaded/instantiated before the test runs
Deno.test.ignore('Config.create should load environment variables', async () => {
	Deno.env.set('RUNREAL_BUILD_ID', 'test-id')
	const config = await Config.create()
	assertEquals(config.getConfig().build.id, 'test-id')
	Deno.env.delete('RUNREAL_BUILD_ID')
})
