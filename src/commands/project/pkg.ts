import { Command, EnumType } from '@cliffy/command'
import { Engine, EngineConfiguration, EnginePlatform } from '../../lib/engine.ts'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { createProject } from '../../lib/project.ts'
import { formatIsoTimestamp } from '../../lib/utils.ts'

export type PkgOptions = typeof pkg extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const pkg = new Command<GlobalOptions>()
	.description('package')
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.arguments('<pkgArguments...>')
	.option('-p, --platform <platform:Platform>', 'Platform', { default: Engine.getCurrentPlatform() })
	.option('-c, --configuration <configuration:Configuration>', 'Configuration', {
		default: EngineConfiguration.Development,
	})
	.option('-a, --archive-directory <path:file>', 'Path to archive directory')
	.option('-z, --zip', 'Should we zip the archive')
	.option('--buildgraph', 'Build Graph', { default: false })
	.option('-d, --dry-run', 'Dry run', { default: false })
	.option('--compile', 'Compile the editor', { default: false })
	.option('--profile <profile:string>', 'Build profile', { default: 'client', required: true })
	.stopEarly()
	.action(async (options, ...pkgArguments: Array<string>) => {
		const { platform, configuration, dryRun, profile, archiveDirectory, zip } = options as PkgOptions
		const cfg = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = cfg.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const buildId = `${
			formatIsoTimestamp(cfg.getConfig().metadata?.ts)
		}-${cfg.getBuildId()}-${cfg.getConfig().buildkite?.buildNumber}`

		const project = await createProject(enginePath, projectPath, options.buildgraph)
		project.package({
			archiveDirectory: archiveDirectory,
			profile: profile,
			buildId: buildId,
			extraArgs: pkgArguments,
			dryRun: options.dryRun,
		})
	})
