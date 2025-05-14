import { Command, EnumType } from '@cliffy/command'

import { Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'
import { createProject } from '../../lib/project.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

export type CompileOptions = typeof program extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const program = new Command<GlobalOptions>()
	.description('Builds a program')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.arguments('<program:string> [ubtArgs...]')
	.option('--projected', 'Add the -project argument. Defaults to false', { default: false })
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
	.action(async (options, program: string, ...ubtArgs: Array<string>) => {
		const { platform, configuration, dryRun, clean, nouht, noxge, projected } = options as CompileOptions

		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		if (clean) {
			await project.compileTarget({
				target: program,
				configuration: configuration as EngineConfiguration,
				platform: platform as EnginePlatform,
				dryRun: dryRun,
				clean: true,
				projected: projected,
			})
		}

		await project.compileTarget({
			target: program,
			configuration: configuration as EngineConfiguration,
			platform: platform as EnginePlatform,
			dryRun: dryRun,
			extraArgs: ubtArgs,
			clean: false,
			nouht: nouht,
			noxge: noxge,
			projected: projected,
		})
	})
