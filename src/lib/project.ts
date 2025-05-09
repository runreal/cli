import * as path from '@std/path'
import { globber } from 'globber'

import { ValidationError } from '@cliffy/command'
import { logger } from '../lib/logger.ts'

import { buildCommandLine, BuildGraphArgs } from '../lib/buildgraph.ts'

import {
	createEngine,
	Engine,
	EngineConfiguration,
	EnginePlatform,
	EngineTarget,
	getPlatformCookTarget,
	TargetInfo,
} from '../lib/engine.ts'
import { copyBuildGraphScripts, exec, findProjectFile } from '../lib/utils.ts'

const TargetError = (target: string, targets: string[]) => {
	return new ValidationError(`Invalid Target: ${target}
Valid Targets: ${targets.join(', ')}
	`)
}

const defaultBCRArgs = [
	'-build',
	'-cook',
	'-stage',
	'-package',
	'-prereqs',
	'-manifests',
	'-pak',
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

export abstract class Project {
	public readonly engine: Engine
	public readonly projectFileVars: ProjectFileVars

	abstract compile({
		target,
		configuration,
		extraArgs,
		dryRun,
		platform,
	}: {
		target?: EngineTarget
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}): Promise<{ success: boolean; code: number; signal: Deno.Signal | null; output: string }>

	abstract package({
		buildId,
		configuration,
		extraArgs,
		dryRun,
		platform,
		zip,
		profile,
		archiveDirectory,
	}: {
		buildId: string
		archiveDirectory: string
		profile: string
		zip?: boolean
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}): Promise<{ success: boolean; code: number; signal: Deno.Signal | null; output: string }>

	abstract runEditor({
		extraArgs,
	}: {
		extraArgs?: string[]
	}): Promise<{ success: boolean; code: number; signal: Deno.Signal | null; output: string }>

	abstract cookContent({
		extraArgs,
	}: {
		extraArgs?: string[]
	}): Promise<{ success: boolean; code: number; signal: Deno.Signal | null; output: string }>

	abstract runClean(dryRun?: boolean): Promise<void>

	constructor(enginePath: Engine, projectFileVars: ProjectFileVars) {
		this.engine = enginePath
		this.projectFileVars = projectFileVars
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
		return await exec(this.engine.getGenerateScript(), [
			this.projectFileVars.projectArgument,
			...args,
		])
	}

	async runPython(scriptPath: string, extraArgs: Array<string>) {
		const args = [
			'-run=pythonscript',
			`-script=${scriptPath}`,
			...extraArgs,
		]
		logger.info(`Running Python script: ${scriptPath}`)
		return await this.runEditor({ extraArgs: args })
	}

	async runCustomBuildGraph(buildGraphScript: string, args: string[] = []) {
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
		return this.engine.runUAT(uatArgs)
	}
}

export class ManualProject extends Project {
	async compile({
		target = EngineTarget.Editor,
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
	}: {
		target?: EngineTarget
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		const args = [
			this.projectFileVars.projectArgument,
			'-NoUBTMakefiles',
			'-NoXGE',
			'-NoHotReload',
			'-NoCodeSign',
			'-NoP4',
			'-TraceWrites',
		].concat(extraArgs)

		const projectTarget = `${this.projectFileVars.projectName}${target}`

		await this.checkTarget(projectTarget)
		return await this.engine.runUBT({
			target: projectTarget,
			configuration: configuration,
			platform: platform,
			extraArgs: args,
			dryRun: dryRun,
		})
	}

	async package({
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
		zip = false,
		buildId,
		profile,
		archiveDirectory,
	}: {
		buildId: string
		archiveDirectory: string
		profile: string
		zip?: boolean
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		const profileArgs = profiles[profile as keyof typeof profiles] || []
		const bcrArgs = Array.from(new Set([...profileArgs, ...extraArgs]))

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
			return { success: true, code: 0, signal: null, output: '' }
		}

		const result = await this.engine.runUAT(['BuildCookRun', ...bcrArgs])

		if (!result.success) {
			return result
		}

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
			return await this.engine.runUAT(['ZipUtils', ...zipArgs])
		} else {
			return result
		}
	}

	async runEditor({
		extraArgs = [],
	}: {
		extraArgs?: string[]
	}) {
		const args = [
			this.projectFileVars.projectFullPath,
		].concat(extraArgs)

		console.log(`Running editor with: ${this.engine.getEditorBin} ${args.join(' ')}`)

		try {
			return await exec(this.engine.getEditorBin(), args)
		} catch (error: unknown) {
			console.log(`Error running Editor: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	}

	async cookContent({
		extraArgs = [],
	}: {
		extraArgs?: string[]
	}) {
		const platformTarget = getPlatformCookTarget(this.engine.getPlatformName())
		const args = [
			this.projectFileVars.projectFullPath,
			'-run=Cook',
			`-targetplatform=${platformTarget}`,
			'-fileopenlog',
		].concat(extraArgs)

		console.log(`Running editor with: ${this.engine.getEditorCmdBin} ${args.join(' ')}`)

		try {
			return await exec(this.engine.getEditorCmdBin(), args)
		} catch (error: unknown) {
			console.log(`Error running Editor: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	}

	async runClean(dryRun?: boolean) {
		const cwd = this.projectFileVars.projectDir

		const iterator = globber({
			cwd,
			include: ['**/Binaries/**', '**/Intermediate/**'],
		})
		for await (const file of iterator) {
			if (dryRun) {
				console.log('Would delete:', file.absolute)
				continue
			}
			if (file.isFile) {
				console.log('Deleting:', file.absolute)
				await Deno.remove(file.absolute)
			}
		}
	}
}

export class BuildGraphProject extends Project {
	async runBuildGraph(buildGraphScript: string, buildGraphNode: string, buildGraphArgs: BuildGraphArgs) {
		let bgScriptPath = path.resolve(buildGraphScript)
		if (!bgScriptPath.endsWith('.xml')) {
			throw new Error('Invalid buildgraph script')
		}
		if (path.relative(this.engine.enginePath, bgScriptPath).startsWith('..')) {
			console.log('Buildgraph script is outside of engine folder, copying...')
			bgScriptPath = await copyBuildGraphScripts(this.engine.enginePath, bgScriptPath)
		}

		const args = buildCommandLine(buildGraphArgs)

		console.log(args)

		const uatArgs = [
			`-Target=${buildGraphNode}`,
			this.projectFileVars.projectArgument,
			...args,
		]
		return await this.runCustomBuildGraph(bgScriptPath, uatArgs)
	}

	async compile({
		target = EngineTarget.Editor,
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
	}: {
		target?: EngineTarget
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		console.log('using build graph')

		const args = [
			'-NoUBTMakefiles',
			'-NoXGE',
			'-NoHotReload',
			'-NoCodeSign',
			'-NoP4',
			'-TraceWrites',
		].concat(extraArgs)

		const projectTarget = `${this.projectFileVars.projectName}${target}`

		await this.checkTarget(projectTarget)

		const targetName = `${this.projectFileVars.projectName}${target}`

		const bgArgs: BuildGraphArgs = {
			clientPlatforms: `${platform}`,
			clientConfigurations: `${configuration}`,
			dryRun: dryRun,
		}

		if (extraArgs.length > 0) {
			bgArgs.extraCompileArguments = extraArgs
		}

		return await this.runBuildGraph(
			path.join(this.projectFileVars.projectDir, '..', 'buildgraph', 'CoreBuildGraph.xml'),
			`Compile ${targetName} ${platform} ${configuration}`,
			bgArgs,
		)
	}

	async package({
		configuration = EngineConfiguration.Development,
		extraArgs = [],
		dryRun = false,
		platform = this.engine.getPlatformName(),
		zip = false,
		buildId,
		profile,
		archiveDirectory,
	}: {
		buildId: string
		archiveDirectory: string
		profile: string
		zip?: boolean
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		const args = [
			'-NoP4',
			'-NoCodeSign',
			'-stdout',
			'-utf8output',
			'-unattended',
			'-nosplash',
		].concat(extraArgs)

		const bgArgs: BuildGraphArgs = {
			outputDir: archiveDirectory,
			buildId: buildId,
			extraPackageArguments: args,
			dryRun: dryRun,
		}

		let target = ''
		if (profile == 'client' || profile == 'game') {
			target = 'Package Clients'
			bgArgs.clientPlatforms = platform
			bgArgs.clientConfigurations = configuration

			if (profile == 'client') {
				bgArgs.clientTargetType = 'Client'
			} else {
				bgArgs.clientTargetType = 'Game'
			}
		} else if (profile == 'server') {
			target = 'Package Servers'
			bgArgs.serverPlatforms = platform
			bgArgs.serverConfigurations = configuration
		}

		if (extraArgs) {
			bgArgs.extraPackageArguments = ''
		}
		return await this.runBuildGraph(
			path.join(this.projectFileVars.projectDir, '..', 'buildgraph', 'CoreBuildGraph.xml'),
			`${target}`,
			bgArgs,
		)
	}

	async runEditor({
		extraArgs = [],
	}: {
		extraArgs?: string[]
	}) {
		const args = [
			this.projectFileVars.projectFullPath,
		].concat(extraArgs)

		console.log(`Running editor with: ${this.engine.getEditorBin} ${args.join(' ')}`)

		try {
			return await exec(this.engine.getEditorBin(), args)
		} catch (error: unknown) {
			console.log(`Error running Editor: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	}

	async cookContent({
		extraArgs = [],
	}: {
		extraArgs?: string[]
	}) {
		const platformTarget = getPlatformCookTarget(this.engine.getPlatformName())
		const args = [
			this.projectFileVars.projectFullPath,
			'-run=Cook',
			`-targetplatform=${platformTarget}`,
			'-fileopenlog',
		].concat(extraArgs)

		console.log(`Running editor with: ${this.engine.getEditorCmdBin} ${args.join(' ')}`)

		try {
			return await exec(this.engine.getEditorCmdBin(), args)
		} catch (error: unknown) {
			console.log(`Error running Editor: ${error instanceof Error ? error.message : String(error)}`)
			Deno.exit(1)
		}
	}

	async runClean(dryRun?: boolean) {
		const cwd = this.projectFileVars.projectDir

		const iterator = globber({
			cwd,
			include: ['**/Binaries/**', '**/Intermediate/**'],
		})
		for await (const file of iterator) {
			if (dryRun) {
				console.log('Would delete:', file.absolute)
				continue
			}
			if (file.isFile) {
				console.log('Deleting:', file.absolute)
				await Deno.remove(file.absolute)
			}
		}
	}
}

export async function createProject(
	enginePath: string,
	projectPath: string,
	useBuildGraph: boolean = false,
): Promise<Project> {
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
	console.log(
		`projectFullPath=${projectFileVars.projectFullPath} projectName=${projectFileVars.projectName} projectArgument=${projectFileVars.projectArgument} projectDir=${projectFileVars.projectDir}`,
	)

	let project = null

	if (useBuildGraph) {
		project = new BuildGraphProject(createEngine(enginePath), projectFileVars)
	} else {
		project = new ManualProject(createEngine(enginePath), projectFileVars)
	}

	return Promise.resolve(project)
}
