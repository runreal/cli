import { deepmerge, dotenv, parse, path, ulid, ValidationError, z } from '../deps.ts'
import { CliOptions, RunrealConfig } from '../lib/types.ts'
import { execSync } from '../lib/utils.ts'
import { ConfigSchema, InternalSchema } from '../lib/schema.ts'
import { Git, Perforce, Source } from './source.ts'
import { normalizePaths, renderConfig } from './template.ts'

const env = (key: string) => Deno.env.get(key) || ''

const defaultConfig = (): Partial<RunrealConfig> => ({
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
		id: env('RUNREAL_BUILD_ID') || '',
	},
	buildkite: {
		branch: env('BUILDKITE_BRANCH') || '',
		checkout: env('BUILDKITE_COMMIT') || '',
		buildNumber: env('BUILDKITE_BUILD_NUMBER') || '0',
		buildCheckoutPath: env('BUILDKITE_BUILD_CHECKOUT_PATH') || Deno.cwd(),
		buildPipelineSlug: env('BUILDKITE_PIPELINE_SLUG') || '',
	},
	metadata: {
		ts: new Date().toISOString(),
		safeRef: '',
		git: {
			branch: '',
			branchSafe: '',
			commit: '',
			commitShort: '',
		},
		perforce: {
			changelist: '',
			stream: '',
		},
	},
	workflows: [],
})

export class Config {
	private config: Partial<RunrealConfig> = defaultConfig()
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

	static async create(): Promise<Config> {
		const instance = new Config()
		const configPath = await instance.searchForConfigFile()
		if (configPath) {
			await instance.mergeConfig(configPath)
		}
		dotenv.loadSync({ export: true })
		return instance
	}

	get(options?: CliOptions): RunrealConfig {
		if (options) {
			this.mergeWithCliOptions(options)
		}
		this.validateConfig()
		return this.config as RunrealConfig
	}

	renderConfig(cfg: RunrealConfig): RunrealConfig {
		const rendered = renderConfig(cfg)
		return normalizePaths(rendered)
	}

	async mergeConfig(configPath: string) {
		const cfg = await this.readConfigFile(configPath)
		if (!cfg) return
		this.config = deepmerge(this.config, cfg)
		return this.config
	}

	private async searchForConfigFile(): Promise<string | null> {
		const cwd = Deno.cwd()
		const configPath = path.join(cwd, 'runreal.config.json')
		try {
			const fileInfo = await Deno.stat(configPath)
			if (fileInfo.isFile) {
				return configPath
			}
		} catch (e) { /* pass */ }
		return null
	}

	private async readConfigFile(configPath: string): Promise<Partial<RunrealConfig> | null> {
		try {
			const data = await Deno.readTextFile(path.resolve(configPath)) as string
			const parsed = parse(data) as unknown
			return parsed as RunrealConfig
		} catch (e) { /* pass */ }
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
		if (config.engine && config.engine.path) {
			config.engine.path = path.resolve(config.engine.path)
		}

		if (config.engine && config.engine.gitDependenciesCachePath) {
			config.engine.gitDependenciesCachePath = path.resolve(config.engine.gitDependenciesCachePath)
		}

		if (config.project && config.project.path) {
			config.project.path = path.resolve(config.project.path)
		}

		if (config.project && config.project.buildPath) {
			config.project.buildPath = path.resolve(config.project.buildPath)
		}

		return config
	}

	private getBuildMetadata(): Partial<RunrealConfig['metadata']> | null {
		const cwd = this.config.project?.path
		if (!cwd) return null
		if (this.config.project?.repoType === 'git') {
			const { safeRef, git } = this.getGitBuildMetadata(cwd)
			return {
				safeRef,
				git,
			}
		} else if (this.config.project?.repoType === 'perforce') {
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
			return defaultConfig().metadata!
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
			return defaultConfig().metadata!
		}
	}

	getBuildId() {
		if (this.config.build?.id) return this.config.build.id
		if (!this.config.project?.path) return ulid()
		if (!this.config.project?.repoType) return ulid()
		try {
			const source = Source(this.config.project.path, this.config.project.repoType)
			const safeRef = source.safeRef()
			return safeRef
		} catch (e) {
			return ulid()
		}
	}

	private validateConfig() {
		this.config = this.resolvePaths(this.config)
		try {
			const Merged = ConfigSchema.and(InternalSchema)
			this.config = Merged.parse(this.config)

			const metadata = this.getBuildMetadata()
			this.config.metadata = {
				...this.config.metadata,
				...metadata,
				ts: new Date().toISOString(),
			}

			const buildId = this.getBuildId()
			this.config.build = {
				...this.config.build,
				id: buildId,
			}
		} catch (e) {
			if (e instanceof z.ZodError) {
				const errors = e.errors.map((err) => {
					return '  config.' + err.path.join('.') + ' is ' + err.message
				})
				throw new ValidationError('Invalid config: \n' + errors.join('\n'))
			}
			throw new ValidationError('Invalid config')
		}
	}
}

export const config = await Config.create()
