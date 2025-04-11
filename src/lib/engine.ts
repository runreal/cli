import * as path from '@std/path'
import { globber } from 'globber'
import { copyBuildGraphScripts, exec, findProjectFile } from './utils.ts'
import { Config } from './config.ts'

interface EngineVersionData {
	MajorVersion: number
	MinorVersion: number
	PatchVersion: number
	Changelist: number
	CompatibleChangelist: number
	IsLicenseeVersion: number
	IsPromotedBuild: number
	BranchName: string
}
/*
{
  "MajorVersion": 5,
  "MinorVersion": 0,
  "PatchVersion": 3,
  "Changelist": 0,
  "CompatibleChangelist": 19505902,
  "IsLicenseeVersion": 0,
  "IsPromotedBuild": 0,
  "BranchName": "++UE5+Release-5.0"
}
*/
export enum EngineConfiguration {
	Debug = 'Debug',
	DebugGame = 'DebugGame',
	Development = 'Development',
	Shipping = 'Shipping',
	Test = 'Test',
}

export enum EngineTarget {
	Editor = 'Editor',
	Game = 'Game',
	Client = 'Client',
	Server = 'Server',
}

export enum ProjectTarget {
	Editor = 'Editor',
	Game = 'Game',
	Client = 'Client',
	Server = 'Server',
}

export enum EnginePlatform {
	Windows = 'Win64',
	Mac = 'Mac',
	Linux = 'Linux',
	TVOS = 'TVOS',
	Android = 'Android',
	HoloLens = 'HoloLens',
	IOS = 'IOS',
	LinuxArm64 = 'LinuxArm64',
	Unknown = 'Unknown',
}

interface TargetInfo {
	Name: string
	Path: string
	Type: string
}

interface UBTOptions {
	target: ProjectTarget | string
	configuration?: EngineConfiguration
	platform?: EnginePlatform
	extraArgs?: string[]
}

export abstract class Engine {
	public readonly enginePath: string

	constructor(enginePath: string) {
		this.enginePath = enginePath
	}

	static getCurrentPlatform(): EnginePlatform {
		switch (Deno.build.os) {
			case 'windows':
				return EnginePlatform.Windows
			case 'darwin':
				return EnginePlatform.Mac
			case 'linux':
				return EnginePlatform.Linux
			default:
				return EnginePlatform.Unknown
		}
	}

	abstract getPlatformName(): EnginePlatform
	abstract getBuildScript(): string
	abstract getRunUATScript(): string
	abstract getGenerateScript(): string
	abstract getGitDependencesBin(): string
	abstract parseEngineTargets(): Promise<string[]>

	getEngineVersionData(): EngineVersionData {
		const engineVersionFile = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'Build.version',
		)
		const engineVersionData = JSON.parse(
			Deno.readTextFileSync(engineVersionFile),
		)
		return engineVersionData
	}

	getEngineVersion(format = 'full'): string {
		const data = this.getEngineVersionData()
		type fmt = {
			[key: string]: string
		}
		const fmt: fmt = {
			major: data.MajorVersion.toString(),
			minor: data.MinorVersion.toString(),
			patch: data.PatchVersion.toString(),
			full: `${data.MajorVersion}.${data.MinorVersion}.${data.PatchVersion}`,
			short: `${data.MajorVersion}.${data.MinorVersion}`,
		}
		if (!Object.keys(fmt).includes(format)) {
			throw new Error('Invalid output format')
		}
		return fmt[format]
	}

	async runUAT(args: string[] = []) {
		const runUATScript = this.getRunUATScript()
		return await exec(runUATScript, args)
	}

	async runUBT({
		target,
		configuration = EngineConfiguration.Development,
		platform = this.getPlatformName(),
		extraArgs = [],
		dryRun = false,
	}: {
		target: EngineTarget | string
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
		dryRun?: boolean
	}) {
		const buildScript = this.getBuildScript()
		const args = [target, configuration, platform, ...extraArgs]
		console.log('[runUBT]', args)
		if (dryRun) return
		return await exec(buildScript, args)
	}

	async ubt(args: string[] = [], options = { quiet: false }) {
		const buildScript = this.getBuildScript()
		return await exec(buildScript, args, options)
	}

	async parseProjectTargets(projectPath: string): Promise<string[]> {
		const projectFile = await findProjectFile(projectPath)
		const args = ['-Mode=QueryTargets', `-Project=${projectFile}`]
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(`${projectPath}\\Intermediate\\TargetInfo.json`)
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			return []
		}
	}

	static async runClean({
		dryRun = false,
	}: {
		dryRun?: boolean
	}) {
		console.log('[runClean]', { dryRun })
		const config = Config.getInstance()
		const binaryGlob = path.join(config.getConfig().project.path, '**/Binaries')
		const intermediateGlob = path.join(config.getConfig().project.path, '**/Intermediate')
		const cwd = config.getConfig().project?.path
		const iterator = globber({
			cwd,
			include: [binaryGlob, intermediateGlob],
		})
		for await (const file of iterator) {
			if (dryRun) {
				console.log('Would delete:', file.relative)
				continue
			}
			console.log('Deleting:', file.relative)
			await Deno.remove(file.relative)
		}
	}

	async runBuildGraph(buildGraphScript: string, args: string[] = []) {
		let bgScriptPath = path.resolve(buildGraphScript)
		if (!bgScriptPath.endsWith('.xml')) {
			throw new Error('Invalid buildgraph script')
		}
		if (path.relative(this.enginePath, bgScriptPath).startsWith('..')) {
			console.log('Buildgraph script is outside of engine folder, copying...')
			bgScriptPath = await copyBuildGraphScripts(this.enginePath, bgScriptPath)
		}
		const uatArgs = [
			'BuildGraph',
			`-Script=${bgScriptPath}`,
			...args,
		]
		return await this.runUAT(uatArgs)
	}
}

class WindowsEngine extends Engine {
	getPlatformName(): EnginePlatform {
		return EnginePlatform.Windows
	}
	getBuildScript(): string {
		const buildScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Build.bat',
		)
		return buildScript
	}
	getRunUATScript(): string {
		const runUATScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'RunUAT.bat',
		)
		return runUATScript
	}
	getGenerateScript(): string {
		const generateScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'GenerateProjectFiles.bat',
		)
		return generateScript
	}
	getGitDependencesBin(): string {
		const gitDependenciesBin = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'DotNET',
			'GitDependencies',
			'win-x64',
			'GitDependencies.exe',
		)
		return gitDependenciesBin
	}
	async parseEngineTargets(): Promise<string[]> {
		const args = ['-Mode=QueryTargets']
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(`${this.enginePath}\\Engine\\Intermediate\\TargetInfo.json`)
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
}

class MacosEngine extends Engine {
	getPlatformName(): EnginePlatform {
		return EnginePlatform.Windows
	}
	getBuildScript(): string {
		const buildScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Mac',
			'Build.sh',
		)
		return buildScript
	}
	getRunUATScript(): string {
		const runUATScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'RunUAT.sh',
		)
		return runUATScript
	}
	getGenerateScript(): string {
		const generateScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Mac',
			'GenerateProjectFiles.sh',
		)
		return generateScript
	}
	getGitDependencesBin(): string {
		const gitDependenciesBin = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'DotNET',
			'GitDependencies',
			'osx-x64',
			'GitDependencies',
		)
		return gitDependenciesBin
	}
	async parseEngineTargets(): Promise<string[]> {
		const args = ['-Mode=QueryTargets']
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(`${this.enginePath}/Engine/Intermediate/TargetInfo.json`)
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
}

class LinuxEngine extends Engine {
	getPlatformName(): EnginePlatform {
		return EnginePlatform.Windows
	}
	getBuildScript(): string {
		const buildScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Linux',
			'Build.sh',
		)
		return buildScript
	}
	getRunUATScript(): string {
		const runUATScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'RunUAT.sh',
		)
		return runUATScript
	}
	getGenerateScript(): string {
		const generateScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Linux',
			'GenerateProjectFiles.sh',
		)
		return generateScript
	}
	getGitDependencesBin(): string {
		const gitDependenciesBin = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'DotNET',
			'GitDependencies',
			'linux-x64',
			'GitDependencies',
		)
		return gitDependenciesBin
	}
	async parseEngineTargets(): Promise<string[]> {
		const args = ['-Mode=QueryTargets']
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(`${this.enginePath}/Engine/Intermediate/TargetInfo.json`)
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
}

// Factory function to create the appropriate Engine instance
export function createEngine(enginePath: string): Engine {
	switch (Deno.build.os) {
		case 'windows':
			return new WindowsEngine(enginePath)
		case 'darwin':
			return new MacosEngine(enginePath)
		case 'linux':
			return new LinuxEngine(enginePath)
		default:
			throw new Error(`Unsupported platform: ${Deno.build.os}`)
	}
}
