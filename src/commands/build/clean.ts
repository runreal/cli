import { Command, EnumType } from '@cliffy/command'

import { Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'
import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export type CleanOptions = typeof clean extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const clean = new Command<GlobalOptions>()
	.description('Cleans the output of a target build')
	.type('Target', new EnumType(EngineTarget))
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.arguments('<target:Target> [ubtArgs...]')
	.option('--projected', 'Add the -project argument. Defaults to true', { default: true })
	.option('-p, --platform <platform:Platform>', 'Platform to build, defaults to host platform', {
		default: Engine.getCurrentPlatform(),
	})
	.option('-c, --configuration <configuration:Configuration>', 'Configuration to build, defaults to Development', {
		default: EngineConfiguration.Development,
	})
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, target = EngineTarget.Editor, ...ubtArgs: Array<string>) => {
		const { platform, configuration, dryRun, projected } = options as CleanOptions

		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		await project.compile({
			target: target as EngineTarget,
			configuration: configuration as EngineConfiguration,
			platform: platform as EnginePlatform,
			dryRun: dryRun,
			clean: true,
			projected: projected,
			extraArgs: ubtArgs,
		})
	})
