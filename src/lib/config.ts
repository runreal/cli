import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { deepmerge } from '@rebeccastevens/deepmerge'
import { z } from 'zod'
import { ulid } from './ulid.ts'
import type { CliOptions, RunrealConfig } from '../lib/types.ts'
import { InternalConfigSchema, UserConfigSchema } from '../lib/schema.ts'
import { detectRepoType, Git, Perforce } from './source.ts'
import { renderConfig } from './template.ts'

export class ConfigError extends Error {
	constructor(message: string, public override cause?: Error) {
		super(message)
		this.name = 'ConfigError'
	}
}

export class ConfigValidationError extends ConfigError {
	constructor(message: string, public validationError: z.ZodError) {
		super(`Configuration validation failed: ${message}`)
		this.name = 'ConfigValidationError'
	}
}

export class ConfigFileError extends ConfigError {
	constructor(message: string, public filePath: string, cause?: Error) {
		super(`Config file error (${filePath}): ${message}`)
		this.name = 'ConfigFileError'
		this.cause = cause
	}
}

type ConfigPath =
	| 'engine.path'
	| 'engine.branch'
	| 'engine.cachePath'
	| 'engine.gitSource'
	| 'engine.gitBranch'
	| 'engine.gitDependenciesCachePath'
	| 'engine.repoType'
	| 'project.name'
	| 'project.path'
	| 'project.buildPath'
	| 'project.repoType'
	| 'build.id'
	| 'metadata.ts'
	| 'metadata.safeRef'
	| 'metadata.git.ref'
	| 'metadata.git.branch'
	| 'metadata.git.branchSafe'
	| 'metadata.git.commit'
	| 'metadata.git.commitShort'
	| 'metadata.perforce.ref'
	| 'metadata.perforce.stream'
	| 'metadata.perforce.changelist'
	| 'metadata.buildkite.branch'
	| 'metadata.buildkite.checkout'
	| 'metadata.buildkite.buildNumber'
	| 'metadata.buildkite.buildCheckoutPath'
	| 'metadata.buildkite.buildPipelineSlug'

type GetConfigValue<T extends ConfigPath> = T extends 'engine.path' ? string
	: T extends 'engine.branch' ? string
	: T extends 'engine.cachePath' ? string
	: T extends 'engine.gitSource' ? string
	: T extends 'engine.gitBranch' ? string
	: T extends 'engine.gitDependenciesCachePath' ? string
	: T extends 'engine.repoType' ? string
	: T extends 'project.name' ? string
	: T extends 'project.path' ? string
	: T extends 'project.buildPath' ? string
	: T extends 'project.repoType' ? string
	: T extends 'build.id' ? string
	: T extends 'metadata.ts' ? string
	: T extends 'metadata.safeRef' ? string
	: T extends `metadata.git.${string}` ? string
	: T extends `metadata.perforce.${string}` ? string
	: T extends `metadata.buildkite.${string}` ? string
	: unknown

type PathField = {
	path: ConfigPath
	relativeToProject?: boolean
}

const PATH_FIELDS: PathField[] = [
	{ path: 'engine.path' },
	{ path: 'engine.gitDependenciesCachePath' },
	{ path: 'project.path' },
	{ path: 'project.buildPath', relativeToProject: true },
]

type CliOptionMapping = {
	[K in keyof CliOptions]?: ConfigPath
}

const CLI_OPTION_TO_CONFIG_MAP: CliOptionMapping = {
	enginePath: 'engine.path',
	branch: 'engine.branch',
	projectPath: 'project.path',
	buildPath: 'project.buildPath',
	buildId: 'build.id',
	gitDependenciesCachePath: 'engine.gitDependenciesCachePath',
} as const

export class Config {
	/**
	 * The configuration data
	 */
	private config: Partial<RunrealConfig> = {}

	/**
	 * The configuration singleton instance
	 */
	private static _instance: Config | null = null

	/**
	 * Initialize the configuration singleton
	 * @param opts Configuration options
	 * @returns The Config instance
	 */
	static async initialize(opts?: { path?: string }): Promise<Config> {
		const config = new Config(opts?.path)
		await config.load()
		Config._instance = config
		return config
	}

	/**
	 * Get the current configuration singleton
	 * @returns The current Config instance
	 */
	static instance(): Config {
		if (!Config._instance) {
			throw new ConfigError('Config not initialized.')
		}
		return Config._instance
	}

	/**
	 * Create a new isolated config instance for testing
	 * @param opts Configuration options
	 * @returns A new Config instance
	 */
	static async create(opts?: { path?: string }): Promise<Config> {
		const config = new Config(opts?.path)
		await config.load()
		return config
	}

	private constructor(private configPath?: string) {}

	/**
	 * Configuration loading and processing pipeline
	 */
	private pipeline = {
		load: this.loadConfig.bind(this),
		validate: this.validateConfig.bind(this),
		merge: this.mergeWithCliOptions.bind(this),
		resolve: this.resolvePaths.bind(this),
		render: this.renderConfig.bind(this),
	}

	/**
	 * Load and initialize the configuration
	 */
	private async load(): Promise<void> {
		try {
			const userConfig = await this.pipeline.load(this.configPath)
			const validatedConfig = this.pipeline.validate(userConfig)
			this.updateConfig(validatedConfig)
		} catch (error) {
			if (error instanceof ConfigError) {
				throw error
			}
			throw new ConfigError('Failed to load configuration', error instanceof Error ? error : new Error(String(error)))
		}
	}

	/**
	 * Get the current configuration
	 * @returns The current configuration
	 */
	get raw(): Partial<RunrealConfig> {
		return { ...this.config }
	}

	/**
	 * Immutably update the configuration
	 * @param updater Function that takes the current config and returns a new one
	 */
	private updateConfig(newConfig: Partial<RunrealConfig>): void {
		this.config = deepmerge(this.config, newConfig)
	}

	/**
	 * Load configuration from a file
	 * @param configPath Path to the config file (optional)
	 * @returns The loaded config
	 */
	private async loadConfig(configPath?: string): Promise<Partial<RunrealConfig>> {
		// Search for config file if not provided
		if (!configPath) {
			configPath = await this.searchForConfigFile()
		}

		// No config file found
		if (!configPath) {
			throw new ConfigError('No config file found')
		}

		// Read and return the config file
		const configFile = await this.readConfigFile(configPath)
		if (!configFile) {
			throw new ConfigError('Config file is empty or invalid')
		}

		return configFile
	}

	/**
	 * Validate configuration using schema
	 * @param config Configuration to validate
	 * @returns Validated configuration
	 */
	private validateConfig(config: Partial<RunrealConfig>): Partial<RunrealConfig> {
		const { success, data, error } = UserConfigSchema.safeParse(config)
		if (!success) {
			throw new ConfigValidationError(z.prettifyError(error), error)
		}
		return data
	}

	/**
	 * Process configuration with CLI options using the pipeline
	 * @param cliOptions Command line options
	 * @param render Whether to render the configuration
	 * @returns Processed configuration
	 */
	process(cliOptions: CliOptions, render: boolean = true): RunrealConfig {
		try {
			// Merge CLI options and resolve paths
			let processedConfig = this.pipeline.merge(this.config, cliOptions)
			processedConfig = this.pipeline.resolve(processedConfig)

			// Initialize metadata and merge it into config
			const metadata = this.initializeMetadata(processedConfig)
			processedConfig = {
				...processedConfig,
				...metadata,
			}

			// Generate build ID
			const buildId = this.getBuildId(processedConfig)
			processedConfig = {
				...processedConfig,
				build: {
					id: buildId,
				},
			}

			this.updateConfig(processedConfig)

			if (render) {
				processedConfig = this.pipeline.render(processedConfig as RunrealConfig)
				this.updateConfig(processedConfig)
			}

			return processedConfig as RunrealConfig
		} catch (error) {
			if (error instanceof ConfigError) {
				throw error
			}
			throw new ConfigError(
				'Failed to process configuration',
				error instanceof Error ? error : new Error(String(error)),
			)
		}
	}

	/**
	 * Initialize the metadata for the configuration
	 * @param config The config to use
	 * @returns The initialized metadata
	 */
	private initializeMetadata(config: Partial<RunrealConfig>) {
		const { success, data } = InternalConfigSchema.safeParse({
			metadata: {
				git: {},
				perforce: {},
				buildkite: {},
			},
		})
		if (!success) {
			return {}
		}
		const sourceMetadata = this.getSourceMetadata(config)
		if (sourceMetadata) {
			data.metadata = {
				...data.metadata,
				...sourceMetadata,
			}
		}
		return data
	}

	/**
	 * Merge the CLI options with the configuration
	 * @param config The base configuration
	 * @param cliOptions Command line options
	 * @returns The merged configuration
	 */
	private mergeWithCliOptions(config: Partial<RunrealConfig>, cliOptions: CliOptions): Partial<RunrealConfig> {
		const picked: Partial<RunrealConfig> = {}

		for (const [cliOption, configPath] of Object.entries(CLI_OPTION_TO_CONFIG_MAP)) {
			const cliValue = cliOptions[cliOption as keyof CliOptions]
			if (cliValue !== undefined && cliValue !== null && cliValue !== '') {
				this.setNestedValue(picked, configPath, cliValue)
			}
		}
		return deepmerge(config, picked)
	}

	/**
	 * Set a nested value using dot notation
	 * @param obj Object to set value in
	 * @param path Dot-notation path
	 * @param value Value to set
	 */
	private setNestedValue(obj: any, path: string, value: any): void {
		const parts = path.split('.')
		let current = obj
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i]
			if (!current[part] || typeof current[part] !== 'object') {
				current[part] = {}
			}
			current = current[part]
		}
		current[parts[parts.length - 1]] = value
	}

	/**
	 * Search for the config file in the current directory
	 * @returns The path to the config file or undefined if not found
	 */
	private async searchForConfigFile(): Promise<string | undefined> {
		// Highest precedence: explicit env variable
		const envPath = process.env['RUNREAL_CONFIG']
		if (envPath) {
			try {
				const info = await fs.stat(envPath)
				if (info.isFile()) return envPath
			} catch { /* pass */ }
		}

		// Fallback: walk up the directory tree looking for a recognised file name
		const configFileNames = [
			'runreal.config.json',
		]
		let dir = process.cwd()
		while (true) {
			for (const fileName of configFileNames) {
				const candidate = path.join(dir, fileName)
				try {
					const info = await fs.stat(candidate)
					if (info.isFile()) {
						return candidate
					}
				} catch { /* pass */ }
			}
			const parent = path.dirname(dir)
			if (parent === dir) break // reached filesystem root
			dir = parent
		}
		return undefined
	}

	/**
	 * Read the config file with error handling
	 * @param configPath Path to the config file
	 * @returns The config file or null if not found
	 */
	private async readConfigFile(configPath: string): Promise<Partial<RunrealConfig> | null> {
		try {
			const resolvedPath = path.resolve(configPath)
			const data = await fs.readFile(resolvedPath, 'utf8')
			return JSON.parse(data)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return null
			}
			const errorMessage = error instanceof Error ? error.message : String(error)
			throw new ConfigFileError(
				`Failed to read config file: ${errorMessage}`,
				configPath,
				error instanceof Error ? error : new Error(String(error)),
			)
		}
	}

	/**
	 * Resolve the paths in the configuration using generic path resolution
	 * @param config The configuration to resolve paths in
	 * @returns The configuration with resolved paths
	 */
	private resolvePaths(config: Partial<RunrealConfig>): Partial<RunrealConfig> {
		const newConfig = { ...config }

		for (const pathField of PATH_FIELDS) {
			const value = this.getNestedValue(newConfig, pathField.path)
			if (value && typeof value === 'string') {
				let resolvedPath: string
				if (pathField.relativeToProject && newConfig.project?.path) {
					resolvedPath = path.resolve(newConfig.project.path, value)
				} else {
					resolvedPath = path.resolve(value)
				}
				this.setNestedValue(newConfig, pathField.path, resolvedPath)
			}
		}

		return newConfig
	}

	/**
	 * Get a nested value using dot notation
	 * @param obj Object to get value from
	 * @param path Dot-notation path
	 * @returns The value at the path
	 */
	private getNestedValue(obj: any, path: string): any {
		const parts = path.split('.')
		let current = obj
		for (const part of parts) {
			if (current && typeof current === 'object' && part in current) {
				current = current[part]
			} else {
				return undefined
			}
		}
		return current
	}

	/**
	 * Render configuration with template variables
	 * @param config Configuration to render
	 * @returns Rendered configuration
	 */
	private renderConfig(config: RunrealConfig): RunrealConfig {
		return renderConfig(config)
	}

	/**
	 * Get the source metadata for the configuration
	 * @param config The configuration to use
	 * @returns The source metadata or null if no source is found
	 */
	private getSourceMetadata(config: Partial<RunrealConfig>): Partial<RunrealConfig['metadata']> | null {
		const cwd = config.project?.path
		if (!cwd) return null

		const repoType = config.project?.repoType || detectRepoType(cwd)
		if (!repoType) return null

		try {
			switch (repoType) {
				case 'git': {
					const source = new Git(cwd)
					if (!source.isValidRepo()) return null
					const git = source.data()
					const safeRef = source.safeRef()
					return { safeRef, git }
				}
				case 'perforce': {
					const source = new Perforce(cwd)
					if (!source.isValidRepo()) return null
					const perforce = source.data()
					const safeRef = source.safeRef()
					return { safeRef, perforce }
				}
				default:
					return null
			}
		} catch (error) {
			return null
		}
	}

	/**
	 * Get the build ID for the configuration
	 * @param config The configuration to use
	 * @returns The build ID
	 */
	private getBuildId(config: Partial<RunrealConfig>): string {
		if (config.build?.id) {
			return config.build.id
		}
		if (config.metadata?.safeRef && config.metadata?.safeRef !== '') {
			return config.metadata.safeRef
		}
		return ulid()
	}

	/**
	 * Type-safe getter for configuration values
	 * @param key Configuration path
	 * @param defaultValue Default value if not found
	 * @returns Configuration value
	 */
	get<T extends ConfigPath>(key: T, defaultValue?: GetConfigValue<T>): GetConfigValue<T> | undefined {
		const value = this.getNestedValue(this.config, key)
		return value !== undefined ? value : defaultValue
	}
}
