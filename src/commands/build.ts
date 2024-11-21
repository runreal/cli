import { Command, EnumType, ValidationError } from '../deps.ts'

import { createEngine, Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../lib/engine.ts'
import { findProjectFile, getProjectName } from '../lib/utils.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { Config } from '../lib/config.ts'

const TargetError = (target: string, targets: string[]) => {
	return new ValidationError(`Invalid Target: ${target}
Valid Targets: ${targets.join(', ')}
	`)
}
export type BuildOptions = typeof build extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const build = new Command<GlobalOptions>()
	.description('build')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.option('-p, --platform <platform:Platform>', 'Platform', { default: Engine.getCurrentPlatform() })
	.option('-c, --configuration <configuration:Configuration>', 'Configuration', {
		default: EngineConfiguration.Development,
	})
	.option('-d, --dry-run', 'Dry run')
	.arguments('<target:string>')
	.action(async (options, target = EngineTarget.Editor) => {
		const { platform, configuration, dryRun } = options as BuildOptions
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const engine = createEngine(enginePath)
		const validTargets = await engine.parseEngineTargets()
		const extraArgs: string[] = []

		const projectFile = await findProjectFile(projectPath).catch(() => null)
		if (projectFile) {
			extraArgs.push(`-project=${projectFile}`)
			validTargets.push(...(await engine.parseProjectTargets(projectPath)))
		}

		// Shorthand target specifier: Editor, Game, Client, Server
		if (Object.values(EngineTarget).includes(target as EngineTarget)) {
			if (projectFile) {
				const projectName = await getProjectName(projectPath)
				target = `${projectName}${target}`
			} else {
				target = `Unreal${target}`
			}
		}

		if (!validTargets.includes(target)) {
			throw TargetError(target, validTargets)
		}

		if (dryRun) {
			console.log(`[build] enginePath: ${enginePath}`)
			console.log(`[build] projectPath: ${projectPath}`)
			console.log(`[build] projectFile: ${projectFile}`)
			console.log(`[build] command: ${configuration} ${target} ${platform}`)
		}

		// const manifest = `${enginePath}/Manifests/${target}-${configuration}-${platform}-Manifest.xml`
		// extraArgs.push(`-Manifest=${manifest}`)
		extraArgs.push('-NoUBTMakefiles')
		extraArgs.push('-NoHotReload')
		extraArgs.push('-TraceWrites')
		extraArgs.push('-NoXGE')
		// extraArgs.push('-UsePrecompiled')

		// Build Target
		// Build.bat TestProjectEditor Win64 Development -project=E:\Project\TestProject.uproject
		await engine.runUBT({
			target,
			configuration: configuration as EngineConfiguration,
			platform: platform as EnginePlatform,
			extraArgs,
			dryRun,
		})
	})
