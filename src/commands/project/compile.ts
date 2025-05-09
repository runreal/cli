import { Command, EnumType, ValidationError } from '@cliffy/command'

import { Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'
import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export type CompileOptions = typeof compile extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const compile = new Command<GlobalOptions>()
	.description('Compile a project')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.option('-p, --platform <platform:Platform>', 'Platform', { default: Engine.getCurrentPlatform() })
	.option('-c, --configuration <configuration:Configuration>', 'Configuration', {
		default: EngineConfiguration.Development,
	})
	.option('--buildgraph', 'Build Graph', { default: false })
	.option('--dry-run', 'Dry run', { default: false })
	.arguments('<target:string>')
	.action(async (options, target = EngineTarget.Editor) => {
		const { platform, configuration, dryRun } = options as CompileOptions
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath, options.buildgraph)
		await project.compile({
			target: target as EngineTarget,
			configuration: configuration as EngineConfiguration,
			platform: platform as EnginePlatform,
			dryRun: dryRun,
		})
	})
