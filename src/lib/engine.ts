import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as ndjson from '../lib/ndjson.ts'
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

export enum CookStyle {
	pak = 'pak',
	zen = 'zen',
	nopak = 'nopak',
}

export enum CookTarget {
	Windows = 'Windows',
	WindowsClient = 'WindowsClient',
	WindowsNoEditor = 'WindowsNoEditor',
	WindowsServer = 'WindowsServer',
	Linux = 'Linux',
	LinuxClient = 'LinuxClient',
	LinuxNoEditor = 'LinuxNoEditor',
	LinuxServer = 'LinuxServer',
	Mac = 'Mac',
	MacClient = 'MacClient',
	MacNoEditor = 'MacNoEditor',
	MacServer = 'MacServer',
	Android = 'Android',
	Android_ASTC = 'Android_ASTC',
	Android_DXT = 'Android_DXT',
	Android_ETC2 = 'Android_ETC2',
	IOS = 'IOS',
	PS4 = 'PS4',
	PS5 = 'PS5',
	Switch = 'Switch',
	XboxOne = 'XboxOne',
	XSX = 'XSX',
	TVOS = 'TVOS',
	HoloLens = 'HoloLens',
	AllDesktop = 'AllDesktop',
	HTML5 = 'HTML5',
}

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

export enum GameTarget {
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
	target: EngineTarget | string
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
		switch (os.platform()) {
			case 'win32':
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
	abstract getEditorBin(cmdBin?: boolean, debug?: boolean): string
	abstract getEditorCmdBin(): string

	getEngineVersionData(): EngineVersionData {
		const engineVersionFile = path.join(
			this.enginePath,
			'Engine',
			'Build',
			'Build.version',
		)
		const engineVersionData = JSON.parse(
			fs.readFileSync(engineVersionFile, 'utf8'),
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

	async runEditor({
		useCmd = false,
		dryRun = false,
		debug = false,
		args,
	}: {
		useCmd?: boolean
		dryRun?: boolean
		debug?: boolean
		args: Array<string>
	}) {
		const editorBin = this.getEditorBin(useCmd, debug)

		console.log(`Running editor with: ${editorBin} ${args.join(' ')}`)

		if (dryRun) {
			return
		}

		try {
			const result = await exec(editorBin, args)
			return result
		} catch (error: unknown) {
			console.log(`Error running Editor: ${error instanceof Error ? error.message : String(error)}`)
			process.exit(1)
		}
	}

	async ubt(args: string[] = [], options = { quiet: false }) {
		const buildScript = this.getBuildScript()
		return await exec(buildScript, args, options)
	}

	async getAutomationToolLogs(enginePath: string) {
		const logJson = path.join(enginePath, 'Engine', 'Programs', 'AutomationTool', 'Saved', 'Logs', 'Log.json')
		const logs = await ndjson.safeParse<AutomationToolLogs[]>(logJson, [])
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
			const { Targets } = JSON.parse(fs.readFileSync(targetInfoJson, 'utf8'))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(cmdBin?: boolean, debug?: boolean): string {
		let exeName = 'UnrealEditor'
		if (cmdBin) {
			exeName = exeName + '-Cmd'
		}
		if (debug) {
			exeName = exeName + 'Win64-Debug'
		}
		const editorPath = path.join(
			this.enginePath,
			'Engine',
			'Binaries',
			'Win64',
			`${exeName}.exe`,
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
			const { Targets } = JSON.parse(fs.readFileSync(targetInfoJson, 'utf8'))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(cmdBin?: boolean, debug?: boolean): string {
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
			const { Targets } = JSON.parse(fs.readFileSync(targetInfoJson, 'utf8'))
			const targets = Targets.map((target: TargetInfo) => target.Name)
			return targets
		} catch (e) {
			console.log(e)
			return []
		}
	}
	override getEditorBin(cmdBin?: boolean, debug?: boolean): string {
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
	switch (os.platform()) {
		case 'win32':
			return new WindowsEngine(enginePath)
		case 'darwin':
			return new MacosEngine(enginePath)
		case 'linux':
			return new LinuxEngine(enginePath)
		default:
			throw new Error(`Unsupported platform: ${os.platform()}`)
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
export function getPlatformCookTarget(platform: EnginePlatform, gameTarget: GameTarget): string {
	const prefix = platform
	let suffix = gameTarget as string
	if (gameTarget == GameTarget.Game) {
		suffix = ''
	}
	return prefix + suffix
}
