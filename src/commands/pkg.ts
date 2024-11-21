import { Command, EnumType, ValidationError } from '../deps.ts'
import { createEngine, Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../lib/engine.ts'
import { findProjectFile } from '../lib/utils.ts'
import { Config } from '../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../lib/types.ts'

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

const serverBCRArgs = [
	'-server',
	'-noclient',
	...defaultBCRArgs,
]

const profiles = {
	'client': clientBCRArgs,
	'server': serverBCRArgs,
}

export type PkgOptions = typeof pkg extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const pkg = new Command<GlobalOptions>()
	.description('package')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.option('-p, --platform <platform:Platform>', 'Platform', { default: Engine.getCurrentPlatform() })
	.option('-c, --configuration <configuration:Configuration>', 'Configuration', {
		default: EngineConfiguration.Development,
	})
	.option('-a, --archive-directory <path:file>', 'Path to archive directory')
	.option('-z, --zip', 'Should we zip the archive')
	.option('-d, --dry-run', 'Dry run')
	.option('--profile <profile:string>', 'Build profile', { default: 'client', required: true })
	.action(async (options) => {
		const { platform, configuration, dryRun, profile, archiveDirectory, zip } = options as PkgOptions
		const cfg = await Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = cfg.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const literal = pkg.getLiteralArgs().map((arg) => arg.toLowerCase())
		const profileArgs = profiles[profile as keyof typeof profiles] || []
		const bcrArgs = Array.from(new Set([...profileArgs, ...literal]))

		const engine = await createEngine(enginePath)
		const projectFile = await findProjectFile(projectPath).catch(() => null)
		if (projectFile) {
			bcrArgs.push(`-project=${projectFile}`)
		} else {
			throw new ValidationError('.uproject file not found')
		}
		bcrArgs.push(`-platform=${platform}`)
		if (profile === 'server') {
			bcrArgs.push(`-serverconfig=${configuration}`)
		}
		if (profile === 'client') {
			bcrArgs.push(`-clientconfig=${configuration}`)
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

		await engine.runUAT(['BuildCookRun', ...bcrArgs])

		if (zip) {
			// Reverse the EnginePlatform enum to get the build output platform name, ie Win64 => Windows
			const platformName =
				Object.keys(EnginePlatform)[Object.values(EnginePlatform).indexOf(platform as EnginePlatform)]
			const profileName = profile === 'client' ? 'Client' : 'Server'
			const expectedArchivePath = `${archiveDirectory}\\${platformName}${profileName}`
			const zipArgs = [
				`-add=${expectedArchivePath}`,
				`-archive=${expectedArchivePath}.zip`,
				'-compression=5',
			]
			await engine.runUAT(['ZipUtils', ...zipArgs])
		}
	})
