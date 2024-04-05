import { deepmerge, dotenv, parse, path, ulid, ValidationError, z } from '/deps.ts'
import { CliOptions, RunrealConfig } from '/lib/types.ts'
import { execSync } from '/lib/utils.ts'
import { ConfigSchema } from '/lib/schema.ts'
import { Source } from '/lib/source.ts'

class Config {
	private config: Partial<RunrealConfig> = {
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
			path: '',
			id: '',
			branch: '',
			branchSafe: '',
			commit: '',
			commitShort: '',
		},
		buildkite: {
			branch: Deno.env.get('BUILDKITE_BRANCH') || '',
			checkout: Deno.env.get('BUILDKITE_COMMIT') || '',
			buildNumber: Deno.env.get('BUILDKITE_BUILD_NUMBER') || '0',
			buildCheckoutPath: Deno.env.get('BUILDKITE_BUILD_CHECKOUT_PATH') || Deno.cwd(),
			buildPipelineSlug: Deno.env.get('BUILDKITE_PIPELINE_SLUG') || '',
		},
	}
	private cliOptionToConfigMap = {
		'enginePath': 'engine.path',
		'branch': 'engine.branch',
		'cachePath': 'engine.cachePath',
		'projectPath': 'project.path',
		'buildPath': 'build.path',
		'gitDependenciesCachePath': 'git.dependenciesCachePath',
		'gitMirrors': 'git.mirrors',
		'gitMirrorsPath': 'git.mirrorsPath',
	}

	private constructor() {}

	static async create(): Promise<Config> {
		const instance = new Config()
		const configPath = await instance.searchForConfigFile()
		if (configPath) {
			instance.mergeConfig(configPath)
		}
		return instance
	}

	get(options?: CliOptions): RunrealConfig {
		if (options) {
			this.mergeWithCliOptions(options)
		}
		this.validateConfig()
		return this.config as RunrealConfig
	}

	async mergeConfig(configPath: string) {
		const cfg = await this.readConfigFile(configPath)
		if (!cfg) return
		this.config = deepmerge(this.config, cfg)
		return this.config
	}

	determineBuildId() {
		const build = this.config.build
		if (!build) return ulid()
		const source = Source(this.config.project?.path, this.config.project?.repoType)
		const safeRef = source.safeRef()
		if (!safeRef) return ulid()
		return safeRef
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

		if (config.engine && config.engine.cachePath) {
			config.engine.cachePath = path.resolve(config.engine.cachePath)
		}

		if (config.project && config.project.path) {
			config.project.path = path.resolve(config.project.path)
		}

		if (config.build && config.build.path) {
			config.build.path = path.resolve(config.build.path)
		}

		if (config.git && config.git.dependenciesCachePath) {
			config.git.dependenciesCachePath = path.resolve(config.git.dependenciesCachePath)
		}

		if (config.git && config.git.mirrorsPath) {
			config.git.mirrorsPath = path.resolve(config.git.mirrorsPath)
		}

		return config
	}

	private populateBuild(): Partial<RunrealConfig['build']> {
		const cwd = this.config.project?.path
		if (!cwd) return {}
		try {
			let branch: string
			// On Buildkite, use the BUILDKITE_BRANCH env var as we may be in a detached HEAD state
			if (Deno.env.get('BUILDKITE_BRANCH')) {
				branch = this.config.buildkite?.branch || ''
			} else {
				branch = execSync('git', ['branch', '--show-current'], { cwd, quiet: false }).output.trim()
			}
			const branchSafe = branch.replace(/[^a-z0-9]/gi, '-')
			const commit = execSync('git', ['rev-parse', 'HEAD'], { cwd, quiet: false }).output.trim()
			const commitShort = execSync('git', ['rev-parse', '--short', 'HEAD'], { quiet: false }).output.trim()

			return {
				...this.config.build,
				path: this.config.build?.path || '',
				branch,
				branchSafe,
				commit,
				commitShort,
			}
		} catch (e) {
			return {}
		}
	}

	private validateConfig() {
		this.config = this.resolvePaths(this.config)
		try {
			this.config = ConfigSchema.parse(this.config)

			this.config.build = this.populateBuild()
			this.config.build!.id = this.determineBuildId()
		} catch (e) {
			if (e instanceof z.ZodError) {
				const errors = e.errors.map((err) => {
					return '  config.' + err.path.join('.') + ' is ' + err.message
				})
				throw new ValidationError('Invalid config: \n' + errors.join('\n'))
			}
			console.log(e)
			throw new ValidationError('Invalid config')
		}
	}
}

export const config = await Config.create()
