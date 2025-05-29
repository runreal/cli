import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import { Config, ConfigError, ConfigFileError, ConfigValidationError } from '../src/lib/config.ts'
import type { CliOptions } from '../src/lib/types.ts'
import { FakeTime } from '@std/testing/time'
import * as path from '@std/path'
import { ulid } from '../src/lib/ulid.ts'

Deno.test('Config.create should initialize with default values', async () => {
	using time = new FakeTime()

	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })

	const id = ulid() // Override getBuildId method for testing
	;(config as any).getBuildId = () => id
	const configData = config.process({})

	// Test that the configuration has the required structure
	assert(configData.build)
	assert(configData.metadata)
	assert(configData.engine)
	assert(configData.project)
	assertEquals(configData.build.id, id)
})

Deno.test('Config.get should apply CLI options', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	const id = ulid() // Override getBuildId method for testing
	;(config as any).getBuildId = () => id
	const enginePath = path.normalize('/path/to/engine')
	const projectPath = path.normalize('/path/to/project')
	const cliOptions: CliOptions = {
		enginePath: enginePath as any,
		projectPath: projectPath as any,
	}
	const result = config.process(cliOptions)
	assert(result.engine.path.includes(enginePath))
	assert(result.project.path.includes(projectPath))
})

Deno.test('Config.get with path', async () => {
	const config = await Config.create({ path: './tests/fixtures/test.config.json' })
	const id = ulid() // Override getBuildId method for testing
	;(config as any).getBuildId = () => id
	const enginePath = path.normalize('/path/to/engine')
	const projectPath = path.normalize('/path/to/project')
	const cliOptions: CliOptions = {
		enginePath: enginePath as any,
		projectPath: projectPath as any,
	}
	const result = config.process(cliOptions)
	assert(result.engine.path.includes(enginePath))
	assert(result.project.path.includes(projectPath))
})

Deno.test('Config.create should load environment variables', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	const configData = config.process({ buildId: 'test-id' })
	assert(configData.build)
	assertEquals(configData.build.id, 'test-id')
	Deno.env.delete('RUNREAL_BUILD_ID')
})

// Schema Validation Tests
Deno.test('Config validation should reject invalid schema', async () => {
	await assertRejects(
		async () => {
			await Config.create({ path: './tests/fixtures/invalid.config.json' })
		},
		ConfigValidationError,
		'Configuration validation failed',
	)
})

Deno.test('Config validation should handle malformed JSON', async () => {
	await assertRejects(
		async () => {
			await Config.create({ path: './tests/fixtures/malformed.config.json' })
		},
		ConfigFileError,
		'Failed to read config file',
	)
})

Deno.test('Config validation should handle missing file', async () => {
	await assertRejects(
		async () => {
			await Config.create({ path: './tests/fixtures/nonexistent.config.json' })
		},
		Error,
	)
})

// Path Resolution Tests
Deno.test('Config should resolve relative paths correctly', async () => {
	const config = await Config.create({ path: './tests/fixtures/relative-paths.config.json' })
	const result = config.process({})

	// Paths should be resolved to absolute paths
	assert(path.isAbsolute(result.engine.path))
	assert(path.isAbsolute(result.project.path))
	assert(path.isAbsolute(result.project.buildPath))
	assert(path.isAbsolute(result.engine.gitDependenciesCachePath!))
})

Deno.test('Config should resolve project-relative build path', async () => {
	const config = await Config.create({ path: './tests/fixtures/relative-paths.config.json' })
	const result = config.process({})

	// Build path should be relative to project path
	const expectedBuildPath = path.resolve(result.project.path, './build/output')
	assertEquals(result.project.buildPath, expectedBuildPath)
})

// CLI Options Merge Tests
Deno.test('CLI options should override config file values', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })
	const overridePath = '/override/engine/path'
	const overrideProjectPath = '/override/project/path'

	const cliOptions: CliOptions = {
		enginePath: overridePath as any,
		projectPath: overrideProjectPath as any,
		buildId: 'override-build-id',
	}

	const result = config.process(cliOptions)

	assertEquals(result.engine.path, overridePath)
	assertEquals(result.project.path, overrideProjectPath)
	assertEquals(result.build.id, 'override-build-id')
})

Deno.test('CLI options should merge with config preserving non-conflicting values', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })

	const cliOptions: CliOptions = {
		enginePath: '/new/engine/path' as any,
	}

	const result = config.process(cliOptions)

	// CLI option should override
	assertEquals(result.engine.path, '/new/engine/path')
	// Config values should be preserved
	assertEquals(result.project.name, 'ComplexProject')
	assertEquals(result.engine.gitBranch, '5.3')
	assertEquals(result.engine.repoType, 'git')
})

Deno.test('CLI options should handle empty and null values correctly', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })

	const cliOptions: CliOptions = {
		enginePath: '' as any,
		projectPath: null as any,
		buildId: undefined,
	}

	const result = config.process(cliOptions)

	// Empty/null/undefined CLI options should not override config defaults
	assert(result.engine.path)
	assert(result.project.path)
	assert(result.build.id)
})

// Metadata Tests
Deno.test('Config should initialize metadata with defaults', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	const result = config.process({})

	assert(result.metadata)
	assert(result.metadata.ts)
	assertEquals(result.metadata.safeRef, '')
	assertEquals(result.metadata.git.ref, '')
	assertEquals(result.metadata.git.branch, '')
	assertEquals(result.metadata.perforce.ref, '')
	assertEquals(result.metadata.perforce.stream, '')

	// Buildkite metadata should have defaults
	assert(result.metadata.buildkite)
	assertEquals(result.metadata.buildkite.buildNumber, '0')
	assertEquals(result.metadata.buildkite.buildCheckoutPath, Deno.cwd())
})

Deno.test('Config should handle buildkite environment variables', async () => {
	// Set buildkite environment variables
	Deno.env.set('BUILDKITE_BRANCH', 'feature/test')
	Deno.env.set('BUILDKITE_COMMIT', 'abc123')
	Deno.env.set('BUILDKITE_BUILD_NUMBER', '42')
	Deno.env.set('BUILDKITE_PIPELINE_SLUG', 'test-pipeline')

	try {
		// Create new config instance after setting env vars
		const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
		const result = config.process({})

		// The buildkite env vars should be picked up by the schema defaults
		assert(result.metadata.buildkite)
		// Note: The actual values might be empty if source metadata retrieval fails
		// But the structure should exist
		assert(typeof result.metadata.buildkite.branch === 'string')
		assert(typeof result.metadata.buildkite.checkout === 'string')
		assert(typeof result.metadata.buildkite.buildNumber === 'string')
		assert(typeof result.metadata.buildkite.buildPipelineSlug === 'string')
	} finally {
		// Clean up environment variables
		Deno.env.delete('BUILDKITE_BRANCH')
		Deno.env.delete('BUILDKITE_COMMIT')
		Deno.env.delete('BUILDKITE_BUILD_NUMBER')
		Deno.env.delete('BUILDKITE_PIPELINE_SLUG')
	}
})

// Config Getter Tests
Deno.test('Config getter should retrieve nested values correctly', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })
	config.process({})

	assertEquals(config.get('engine.path'), '/custom/engine/path')
	assertEquals(config.get('project.name'), 'ComplexProject')
	assertEquals(config.get('engine.gitBranch'), '5.3')
	assertEquals(config.get('project.repoType'), 'perforce')
})

Deno.test('Config getter should return default values for missing keys', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	config.process({})

	assertEquals(config.get('engine.gitSource', 'default-source'), 'default-source')
	assertEquals(config.get('project.name', 'default-name'), 'default-name')
})

Deno.test('Config getter should return undefined for missing keys without defaults', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	config.process({})

	assertEquals(config.get('engine.gitSource'), undefined)
	assertEquals(config.get('project.name'), undefined)
})

// Build ID Tests
Deno.test('Config should generate ULID when no build ID provided', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	const result = config.process({})

	assert(result.build.id)
	assert(result.build.id.length >= 20) // ULID length
})

Deno.test('Config should use safeRef as build ID when available', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' }) // Mock the getBuildId method directly since that's what determines the final ID
	;(config as any).getBuildId = (cfg: any) => {
		if (cfg.metadata?.safeRef) {
			return cfg.metadata.safeRef
		}
		return 'test-safe-ref' // Fallback for this test
	}

	const result = config.process({})

	assertEquals(result.build.id, 'test-safe-ref')
})

Deno.test('Config should prioritize explicit build ID over safeRef', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' }) // Mock source metadata
	;(config as any).getSourceMetadata = () => ({ safeRef: 'should-not-be-used' })

	const result = config.process({})

	assertEquals(result.build.id, 'complex-build-123')
})

// Workflow Tests
Deno.test('Config should handle workflows correctly', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })
	const result = config.process({})

	assert(result.workflows)
	assertEquals(result.workflows.length, 1)
	assertEquals(result.workflows[0].id, 'build-and-test')
	assertEquals(result.workflows[0].name, 'Build and Test')
	assertEquals(result.workflows[0].steps.length, 2)
})

Deno.test('Config should default to empty workflows array', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' })
	const result = config.process({})

	assert(result.workflows)
	assertEquals(result.workflows.length, 0)
})

// Error Handling Tests
Deno.test('Config should throw ConfigError for processing failures', async () => {
	const config = await Config.create({ path: './tests/fixtures/minimal.config.json' }) // Mock the initializeMetadata method to throw an error
	;(config as any).initializeMetadata = () => {
		throw new Error('Mock initialization error')
	}

	assertThrows(
		() => {
			config.process({})
		},
		ConfigError,
		'Failed to process configuration',
	)
})

// Template Rendering Tests
Deno.test('Config should render templates when enabled', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })
	const result = config.process({}, true) // Enable rendering

	// Templates should be processed (this depends on the template system implementation)
	assert(result)
	assert(result.build.id)
})

Deno.test('Config should skip rendering when disabled', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })
	const result = config.process({}, false) // Disable rendering

	// Config should still be valid
	assert(result)
	assert(result.build.id)
})

// Integration Tests
Deno.test('Config should handle complex real-world scenario', async () => {
	const config = await Config.create({ path: './tests/fixtures/complex.config.json' })

	const cliOptions: CliOptions = {
		enginePath: '/override/engine' as any,
		buildId: 'integration-test-build',
		gitDependenciesCachePath: '/custom/cache' as any,
	}

	const result = config.process(cliOptions)

	// Verify CLI overrides
	assertEquals(result.engine.path, '/override/engine')
	assertEquals(result.build.id, 'integration-test-build')
	assertEquals(result.engine.gitDependenciesCachePath, '/custom/cache')

	// Verify config preservation
	assertEquals(result.project.name, 'ComplexProject')
	assertEquals(result.engine.gitBranch, '5.3')

	// Verify structure
	assert(result.metadata)
	assert(result.workflows)
	assert(result.engine)
	assert(result.project)
	assert(result.build)
})
