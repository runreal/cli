import { path } from '/deps.ts'
import { copyBuildGraphScripts, exec, findProjectFile } from './utils.ts'

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
	abstract getCleanScript(): string
	abstract getRunUATScript(): string
	abstract getGenerateScript(): string
	abstract getGitDependencesBin(): string

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

	async parseEngineTargets(): Promise<string[]> {
		const args = ['-Mode=QueryTargets']
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(this.enginePath + '\\Engine\\Intermediate\\TargetInfo.json')
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			return []
		}
	}

	async parseProjectTargets(projectPath: string): Promise<string[]> {
		const projectFile = await findProjectFile(projectPath)
		const args = ['-Mode=QueryTargets', `-Project=${projectFile}`]
		await this.ubt(args, { quiet: true })
		try {
			const targetInfoJson = path.resolve(projectPath + '\\Intermediate\\TargetInfo.json')
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			return []
		}
	}

	async runClean({
		target,
		configuration = EngineConfiguration.Development,
		platform = this.getPlatformName(),
		extraArgs = [],
	}: {
		target: EngineTarget | string
		configuration?: EngineConfiguration
		platform?: EnginePlatform
		extraArgs?: string[]
	}) {
		const cleanScript = this.getCleanScript()
		const args = [target, configuration, platform, ...extraArgs]
		console.log('[runClean]', args)
		return await exec(cleanScript, args)
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
	getCleanScript(): string {
		const cleanScript = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'BatchFiles',
			'Clean.bat',
		)
		return cleanScript
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
}

// Factory function to create the appropriate Engine instance
export function createEngine(enginePath: string): Engine {
	switch (Deno.build.os) {
		case 'windows':
			return new WindowsEngine(enginePath)
		case 'darwin':
			return new WindowsEngine(enginePath)
		case 'linux':
			return new WindowsEngine(enginePath)
		default:
			throw new Error(`Unsupported platform: ${Deno.build.os}`)
	}
}
