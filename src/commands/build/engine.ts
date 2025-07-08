import { Command, EnumType } from '@cliffy/command'

import { createEngine, Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export type CompileOptions = typeof engine extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const engine = new Command<GlobalOptions>()
	.description('Builds the editor')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.arguments('[ubtArgs...]')
	.option('-p, --platform <platform:Platform>', 'Platform to build, defaults to host platform', {
		default: Engine.getCurrentPlatform(),
	})
	.option('-c, --configuration <configuration:Configuration>', 'Configuration to build, defaults to Development', {
		default: EngineConfiguration.Development,
	})
	.option('--clean', 'Clean the current build first', { default: false })
	.option('--nouht', 'Skips building UnrealHeaderTool', { default: false })
	.option('--noxge', 'Disables Incredibuild', { default: true })
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, ...ubtArgs: Array<string>) => {
		const { platform, configuration, dryRun, clean, nouht, noxge } = options as CompileOptions

		const engine = createEngine(options.enginePath)

		await engine.runUBT({
			target: 'UnrealEditor',
			configuration: configuration as EngineConfiguration,
			platform: platform as EnginePlatform,
			extraArgs: [...ubtArgs, '-AllPlugins', '-AllModules'],
		})
	})
