import { assert, assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { Config } from '../src/lib/config.ts'
import { ulid } from '../src/deps.ts'
import { CliOptions } from '../src/lib/types.ts'

Deno.test('Config.create should initialize with default values', async () => {
	const config = await Config.create()
	const id = ulid()
	config.determineBuildId = () => id
	const expected = {
		engine: {
			path: '',
			repoType: 'git',
		},
		project: {
			name: '',
			path: '',
			repoType: 'git',
		},
		build: {
			id,
			path: '',
			branch: '',
			branchSafe: '',
			commit: '',
			commitShort: '',
		},
		buildkite: {
			branch: '',
			checkout: '',
			buildNumber: '0',
			buildCheckoutPath: Deno.cwd(),
			buildPipelineSlug: '',
		},
		metadata: {
			test: '',
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
	config.determineBuildId = () => id
	const cliOptions: CliOptions = {
		enginePath: '/path/to/engine' as any,
		projectPath: '/path/to/project' as any,
	}
	const result = config.get(cliOptions)
	assert(result.engine.path.includes('/path/to/engine'))
	assert(result.project.path.includes('/path/to/project'))
})
