import * as path from '@std/path'
import { expandGlob } from '@std/fs'
import { ValidationError } from '@cliffy/command'
import { logger } from '../lib/logger.ts'

import {
	CookTarget,
	createEngine,
	Engine,
	EngineConfiguration,
	EnginePlatform,
	EngineTarget,
	GameTarget,
	TargetInfo,
} from '../lib/engine.ts'
import { copyBuildGraphScripts, exec, findProjectFile } from '../lib/utils.ts'

const TargetError = (target: string, targets: string[]) => {
	return new ValidationError(`Invalid Target: ${target}
Valid Targets: ${targets.join(', ')}
	`)
}

const defaultBCRArgs = [
	'-stage',
	'-package',
	'-prereqs',
	'-manifests',
	'-compressed',
	'-nop4',
	'-utf8output',
	'-nullrhi',
	'-unattended',
	// Might want to keep these off by default
	'-nocompileeditor',
	'-skipcompileeditor',
	'-nocompile',
	'-nocompileuat',
	'-nodebuginfo',
]

const clientBCRArgs = [
	'-client',
	...defaultBCRArgs,
]

const gameBCRArgs = [
	'-game',
	...defaultBCRArgs,
]

const serverBCRArgs = [
	'-server',
	'-noclient',
	...defaultBCRArgs,
]

const profiles = {
	'client': clientBCRArgs,
	'game': gameBCRArgs,
	'server': serverBCRArgs,
}

const profileNameMap = {
	client: 'Client',
	game: 'Game',
	server: 'Server',
}

interface ProjectFileVars {
	projectFullPath: string
	projectName: string
	projectArgument: string
	projectDir: string
}

export class Project {
	public readonly engine: Engine
	public readonly projectFileVars: ProjectFileVars

	constructor(enginePath: Engine, projectFileVars: ProjectFileVars) {
		this.engine = enginePath
		this.projectFileVars = projectFileVars
	}

	async compile({
		target = EngineTarget.Editor,
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
		clean = false,
		nouht = false,
		noxge = true,
	}: {
		target?: EngineTarget | GameTarget
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
		clean?: boolean
		nouht?: boolean
		noxge?: boolean
	}) {
		const args = [
			this.projectFileVars.projectArgument,
			'-NoUBTMakefiles',
			'-NoHotReload',
			'-NoCodeSign',
			'-NoP4',
			'-TraceWrites',
			'-Progress',
			...extraArgs,
		]

		if (noxge) {
			args.push('-NoXGE')
		}
		if (clean) {
			args.push('-Clean')
		}
		if (nouht) {
			args.push('-NoBuildUHT')
		}

		const projectTarget = await this.getProjectTarget(target)

		await this.engine.runUBT({
			target: projectTarget,
			configuration: configuration,
			platform: platform,
			extraArgs: args,
			dryRun: dryRun,
		})
	}

	async getProjectTarget(target: EngineTarget | GameTarget): Promise<string> {
		let projectTarget = `${this.projectFileVars.projectName}`
		if (target != EngineTarget.Game) {
			projectTarget = projectTarget + `${target}`
		}
		await this.checkTarget(projectTarget)
		return projectTarget
	}

	async package({
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
		zip = false,
		profile,
		archiveDirectory,
	}: {
		archiveDirectory: string
		profile: string
		zip?: boolean
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		const profileArgs = profiles[profile as keyof typeof profiles] || []
		const bcrArgs = Array.from(new Set([...profileArgs, ...extraArgs, ...defaultBCRArgs]))

		bcrArgs.push(this.projectFileVars.projectArgument)
		bcrArgs.push(`-platform=${platform}`)
		if (profile === 'server') {
			bcrArgs.push(`-serverconfig=${configuration}`)
		}
		if (profile === 'client') {
			bcrArgs.push(`-clientconfig=${configuration}`)
		}
		if (profile === 'game') {
			bcrArgs.push(`-gameconfig=${configuration}`)
		}
		if (archiveDirectory) {
			bcrArgs.push('-archive')
			bcrArgs.push(`-archiveDirectory=${archiveDirectory}`)
			bcrArgs.push('-archivemetadata')
		}
		if (dryRun) {
			console.log(`[package] package ${profile} ${configuration} ${platform}`)
			console.log('[package] BCR args:')
			console.log(bcrArgs)
			return
		}

		await this.engine.runUAT(['BuildCookRun', ...bcrArgs])

		if (zip) {
			// Reverse the EnginePlatform enum to get the build output platform name, ie Win64 => Windows
			const platformName =
				Object.keys(EnginePlatform)[Object.values(EnginePlatform).indexOf(platform as EnginePlatform)]
			const profileName = profileNameMap[profile as keyof typeof profileNameMap] || ''
			const archivePath = path.join(
				archiveDirectory,
				`${this.projectFileVars.projectName}-${profileName}-${platformName}`,
			)
			const zipArgs = [
				`-add=${archivePath}`,
				`-archive=${archivePath}.zip`,
				'-compression=5',
			]
			await this.engine.runUAT(['ZipUtils', ...zipArgs])
		}
	}

	async runEditor({
		useCmd = false,
		dryRun = false,
		debug = false,
		extraArgs,
	}: {
		useCmd?: boolean
		dryRun?: boolean
		debug?: boolean
		extraArgs: Array<string>
	}) {
		await this.engine.runEditor({
			useCmd: useCmd,
			dryRun: dryRun,
			debug: debug,
			args: [this.projectFileVars.projectFullPath, ...extraArgs],
		})
	}

	async cookContent({
		target,
		cultures,
		onTheFly = false,
		iterate = true,
		noxge = true,
		debug = false,
		dryRun = false,
		extraArgs = [],
	}: {
		target: CookTarget
		extraArgs?: string[]
		cultures?: Array<string>
		onTheFly?: boolean
		iterate?: boolean
		noxge?: boolean
		dryRun?: boolean
		debug?: boolean
	}) {
		const args = [
			this.projectFileVars.projectFullPath,
			'-run=Cook',
			`-targetplatform=${target}`,
			'-fileopenlog',
			'-unversioned',
			'-stdout',
			...extraArgs,
		]

		if (cultures && cultures.length > 0) {
			const cultureArg: string = cultures.join('+')
			args.push(`-cookcultures=${cultureArg}`)
		}

		if (onTheFly) {
			args.push('-cookonthefly')
		}

		if (iterate) {
			args.push('-iterate')
		}

		if (noxge) {
			args.push('noxge')
		}

		await this.engine.runEditor({ useCmd: true, dryRun: dryRun, debug: debug, args: args })
	}

	async parseProjectTargets(): Promise<string[]> {
		const args = ['-Mode=QueryTargets', this.projectFileVars.projectArgument]
		await this.engine.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(path.join(this.projectFileVars.projectDir, 'Intermediate', 'TargetInfo.json'))
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			return []
		}
	}

	async checkTarget(target: string) {
		const validTargets = await this.parseProjectTargets()
		if (!validTargets.includes(target)) {
			throw TargetError(target, validTargets)
		}
	}

	async genProjectFiles(args: string[]) {
		// Generate project
		// GenerateProjectFiles.bat -project=E:\Project\TestProject.uproject -game -engine
		await exec(this.engine.getGenerateScript(), [
			this.projectFileVars.projectArgument,
			...args,
		])
	}

	async runClean(dryRun?: boolean) {
		const cwd = this.projectFileVars.projectDir
		const patterns = ['**/Binaries/**', '**/Intermediate/**']
		for (const pattern of patterns) {
			for await (const file of expandGlob(pattern, { root: cwd })) {
				if (file.isFile) {
					if (dryRun) {
						logger.info(`[dry-run] deleting ${file.path}`)
					} else {
						logger.info(`deleting ${file.path}`)
						await Deno.remove(file.path)
					}
				}
			}
		}
	}

	async runBuildGraph(buildGraphScript: string, args: string[] = []) {
		let bgScriptPath = path.resolve(buildGraphScript)
		if (!bgScriptPath.endsWith('.xml')) {
			throw new Error('Invalid buildgraph script')
		}
		if (path.relative(this.engine.enginePath, bgScriptPath).startsWith('..')) {
			console.log('Buildgraph script is outside of engine folder, copying...')
			bgScriptPath = await copyBuildGraphScripts(this.engine.enginePath, bgScriptPath)
		}
		const uatArgs = [
			'BuildGraph',
			`-Script=${bgScriptPath}`,
			...args,
		]
		return await this.engine.runUAT(uatArgs)
	}
}

export async function createProject(enginePath: string, projectPath: string): Promise<Project> {
	const projectFile = await findProjectFile(projectPath).catch(() => null)

	if (projectFile == null) {
		console.log(`Could not find project file in path ${projectPath}`)
		Deno.exit(1)
	}

	const projectFileVars = {
		projectFullPath: projectFile,
		projectName: path.basename(projectFile, '.uproject'),
		projectArgument: `-project=${projectFile}`,
		projectDir: path.dirname(projectFile),
	}
	const project = new Project(createEngine(enginePath), projectFileVars)

	return Promise.resolve(project)
}
