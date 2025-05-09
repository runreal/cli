import * as path from '@std/path'
import { ValidationError } from '@cliffy/command'
import { deepmerge } from '@rebeccastevens/deepmerge'
import { ulid } from './ulid.ts'
import type { CliOptions, RunrealConfig } from '../lib/types.ts'
import { ConfigSchema, InternalSchema } from '../lib/schema.ts'
import { Git, Perforce } from './source.ts'
import { normalizePaths, renderConfig } from './template.ts'

export class Config {
	private config: Partial<RunrealConfig> = {}

	private static configSingleton = new Config()

	private cliOptionToConfigMap = {
		'enginePath': 'engine.path',
		'branch': 'engine.branch',
		'cachePath': 'engine.cachePath',
		'projectPath': 'project.path',
		'buildPath': 'project.buildPath',
		'buildId': 'build.id',
		'gitDependenciesCachePath': 'engine.dependenciesCachePath',
	}

	private constructor() {}

	static async create(opts?: { path?: string }): Promise<Config> {
		await Config.configSingleton.loadConfig({ path: opts?.path })
		return Config.configSingleton
	}

	static getInstance(): Config {
		return Config.configSingleton
	}

	async loadConfig(opts?: { path?: string }): Promise<void> {
		let configPath = opts?.path
		if (!configPath) {
			configPath = await this.searchForConfigFile()
		}
		if (configPath) {
			const configFile = await this.readConfigFile(configPath)
			if (configFile) {
				try {
					const parsed = ConfigSchema.parse(configFile)
					this.config = parsed
				} catch (e) {
					// TODO: handle zod error on user config file
					console.log(e)
					throw new ValidationError('Invalid config')
				}
			}
		}
	}

	mergeConfigCLIConfig({ cliOptions }: { cliOptions: CliOptions }): RunrealConfig {
		this.mergeWithCliOptions(cliOptions)
		this.validateConfig()
		return this.config as RunrealConfig
	}

	renderConfig(cfg: RunrealConfig): RunrealConfig {
		const rendered = renderConfig(cfg)
		return normalizePaths(rendered)
	}

	private async searchForConfigFile(): Promise<string | undefined> {
		const cwd = Deno.cwd()
		const configPath = path.join(cwd, 'runreal.config.json')
		try {
			const fileInfo = await Deno.stat(configPath)
			if (fileInfo.isFile) {
				return configPath
			}
		} catch (e) { /* pass */ }
		return undefined
	}

	private async readConfigFile(configPath: string): Promise<Partial<RunrealConfig> | null> {
		try {
			const data = await Deno.readTextFile(path.resolve(configPath))
			// const parsed = RunrealConfigSchema.parse(JSON.parse(data))
			return JSON.parse(data)
		} catch (e) {
			/* pass */
		}
		return null
	}

	private mergeWithCliOptions(cliOptions: CliOptions) {
		const picked: Partial<RunrealConfig> = {}

		for (const [cliOption, configPath] of Object.entries(this.cliOptionToConfigMap)) {
			if (cliOptions[cliOption as keyof CliOptions]) {
				const [section, property] = configPath.split('.')
				if (!picked[section as keyof RunrealConfig]) {
					picked[section as keyof RunrealConfig] = {} as any
				}
				;(picked[section as keyof RunrealConfig] as any)[property] = cliOptions[cliOption as keyof CliOptions]
			}
		}
		this.config = deepmerge(this.config, picked)
	}

	private resolvePaths(config: Partial<RunrealConfig>) {
		if (config.engine?.path) {
			config.engine.path = path.resolve(config.engine.path)
		}

		if (config.engine?.gitDependenciesCachePath) {
			config.engine.gitDependenciesCachePath = path.resolve(config.engine.gitDependenciesCachePath)
		}

		if (config.project?.path) {
			config.project.path = path.resolve(config.project.path)
		}

		if (config.project?.buildPath) {
			config.project.buildPath = path.resolve(config.project.buildPath)
		}
	}

	private getSourceMetadata(): Partial<RunrealConfig['metadata']> | null {
		const cwd = this.config.project?.path
		if (!cwd) return null
		if (this.config.project?.repoType === 'git') {
			const { safeRef, git } = this.getGitBuildMetadata(cwd)
			return {
				safeRef,
				git,
			}
		}
		if (this.config.project?.repoType === 'perforce') {
			const { safeRef, perforce } = this.getPerforceBuildMetadata(cwd)
			return {
				safeRef,
				perforce,
			}
		}
		return null
	}

	private getGitBuildMetadata(projectPath: string): Partial<RunrealConfig['metadata']> {
		const cwd = projectPath
		try {
			const source = new Git(cwd)
			const branch = source.branch()
			const branchSafe = source.branchSafe()
			const commit = source.commit()
			const commitShort = source.commitShort()
			const safeRef = source.safeRef()
			return {
				safeRef,
				git: {
					branch,
					branchSafe,
					commit,
					commitShort,
				},
			}
		} catch (e) {
			return { safeRef: '', git: { branch: '', branchSafe: '', commit: '', commitShort: '' } }
		}
	}

	private getPerforceBuildMetadata(projectPath: string): Partial<RunrealConfig['metadata']> {
		const cwd = projectPath
		try {
			const source = new Perforce(cwd)
			const changelist = source.changelist()
			const stream = source.stream()
			const safeRef = source.safeRef()
			return {
				safeRef,
				perforce: {
					changelist,
					stream,
				},
			}
		} catch (e) {
			return { safeRef: '', perforce: { changelist: '', stream: '' } }
		}
	}

	private initializeBuildId() {
		if (this.config.build?.id) {
			return this.config.build.id
		}
		if (this.config.metadata?.safeRef && this.config.metadata?.safeRef !== '') {
			return this.config.metadata.safeRef
		}
		return ulid()
	}

	private initializeMetadata() {
		try {
			const metadata = InternalSchema.parse({
				buildkite: {},
				metadata: {
					git: {},
					perforce: {},
				},
			})

			const sourceMetadata = this.getSourceMetadata()
			if (sourceMetadata) {
				metadata.metadata = {
					...metadata.metadata,
					...sourceMetadata,
				}
			}
			return metadata
		} catch (e) {
			console.log(e)
		}
	}

	private validateConfig() {
		this.resolvePaths(this.config)
		const metadata = this.initializeMetadata()
		const id = this.initializeBuildId()

		this.config = {
			...this.config,
			...metadata,
			build: {
				id,
			},
		}
	}
}
