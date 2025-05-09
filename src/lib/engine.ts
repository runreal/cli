import * as path from '@std/path'
import { readNdjson } from 'ndjson'
import { exec } from '../lib/utils.ts'

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

export interface AutomationToolLogs {
	time: string
	level: string
	message: string
	format: string
	properties: Record<string, any>
	id?: number
	line?: number
	lineCount?: number
}

export interface TargetInfo {
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
	abstract getEditorBin(): string
	abstract getEditorCmdBin(): string

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
		if (dryRun) return { success: true, code: 0, signal: null, output: '' }
		return await exec(buildScript, args)
	}

	async ubt(args: string[] = [], options = { quiet: false }) {
		const buildScript = this.getBuildScript()
		return await exec(buildScript, args, options)
	}

	async getAutomationToolLogs(enginePath: string) {
		const logJson = path.join(enginePath, 'Engine', 'Programs', 'AutomationTool', 'Saved', 'Logs', 'Log.json')
		let logs: AutomationToolLogs[] = []
		try {
			logs = await readNdjson(logJson) as unknown as AutomationToolLogs[]
		} catch (e) {
			// pass
		}
		return logs
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
			const targetInfoJson = path.resolve(path.join(this.enginePath, 'Engine', 'Intermediate', 'TargetInfo.json'))
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Win64',
			'UnrealEditor.exe',
		)
		return editorPath
	}
	override getEditorCmdBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Win64',
			'UnrealEditor-Cmd.exe',
		)
		return editorPath
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
			const targetInfoJson = path.resolve(path.join(this.enginePath, 'Engine', 'Intermediate', 'TargetInfo.json'))
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Mac',
			'UnrealEditor',
		)
		return editorPath
	}
	override getEditorCmdBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Mac',
			'UnrealEditor-Cmd',
		)
		return editorPath
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
			const targetInfoJson = path.resolve(path.join(this.enginePath, 'Engine', 'Intermediate', 'TargetInfo.json'))
			const { Targets } = JSON.parse(Deno.readTextFileSync(targetInfoJson))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Linux',
			'UnrealEditor',
		)
		return editorPath
	}
	override getEditorCmdBin(): string {
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Linux',
			'UnrealEditor-Cmd',
		)
		return editorPath
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

/**
 * Get the platform-specific path to the Unreal Editor executable
 */
export function getEditorPath(enginePath: string, platform: EnginePlatform): string {
	switch (platform) {
		case EnginePlatform.Windows:
			return path.join(
				enginePath,
				'Engine',
				'Binaries',
				'Win64',
				'UnrealEditor.exe',
			)
		case EnginePlatform.Mac:
			return path.join(
				enginePath,
				'Engine',
				'Binaries',
				'Mac',
				'UnrealEditor',
			)
		case EnginePlatform.Linux:
			return path.join(
				enginePath,
				'Engine',
				'Binaries',
				'Linux',
				'UnrealEditor',
			)
		default:
			throw new Error(`Unsupported platform: ${platform}`)
	}
}

/**
 * Get the platform-specific cook target
 */
export function getPlatformCookTarget(platform: EnginePlatform): string {
	switch (platform) {
		case EnginePlatform.Windows:
			return 'Windows'
		case EnginePlatform.Mac:
			return 'MAC'
		case EnginePlatform.Linux:
			return 'Linux'
		default:
			throw new Error(`Unsupported platform: ${platform}`)
	}
}
