import { Command, EnumType } from '@cliffy/command'
import { Config } from '../lib/config.ts'
import { createProject } from '../lib/project.ts'
import type { GlobalOptions } from '../lib/types.ts'
import {
	CookStyle,
	CookTarget,
	EngineConfiguration,
	EnginePlatform,
	EngineTarget,
	GameTarget,
	getPlatformCookTarget,
} from '../lib/engine.ts'

export type PkgOptions = typeof pkg extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const pkg = new Command()
	.description('Package a project')
	.type('Style', new EnumType(CookStyle))
	.type('Target', new EnumType(GameTarget))
	.type('Configuration', new EnumType(EngineConfiguration))
	.type('Platform', new EnumType(EnginePlatform))
	.arguments('<target:Target> <platform:Platform> <configuration:Configuration> <style:Style> [uatArgs...]')
	.option('--dry-run', 'Dry run', { default: false })
	.option('-z, --zip', 'Should we zip the archive')
	.option(
		'--buildargs <buildargs:string>',
		'Build code prior to staging, comma separated list of arguments for the build',
	)
	.option(
		'--cookargs <cookargs:string>',
		'Cook content prior to staging, comma separated list of arguments for the cook',
	)
	.option('-a, --archive-directory <path:file>', 'Path to archive directory')
	.stopEarly()
	.action(async (options, target, platform, configuration, style, ...uatArgs: Array<string>) => {
		const { dryRun, zip, buildargs, cookargs, archiveDirectory } = options as PkgOptions

		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})
		const project = await createProject(enginePath, projectPath)

		const args = uatArgs

		switch (style) {
			case CookStyle.pak:
				args.push('-pak')
				break
			case CookStyle.zen:
				args.push('-zen')
				break
			case CookStyle.nopak:
				args.push('-nopak')
				break
		}

		console.log(`${buildargs}`)
		if (buildargs) {
			console.log(`Recieved build arguments - ${buildargs}`)
			project.compile({
				target: target as GameTarget,
				configuration: configuration as EngineConfiguration,
				platform: platform as EnginePlatform,
				dryRun: dryRun,
				extraArgs: (buildargs as string).split(','),
			})
			args.push('-skipbuild')
		} else {
			args.push('-build')
		}
		if (cookargs) {
			console.log(`Recieved cook arguments - ${cookargs}`)
			const cookTarget = getPlatformCookTarget(platform, target)
			project.cookContent({
				target: cookTarget as CookTarget,
				dryRun: dryRun,
				extraArgs: cookargs,
			})
			args.push('-skipcook')
		} else {
			args.push('-cook')
		}

		project.package({
			profile: target,
			configuration: configuration,
			extraArgs: args,
			dryRun: dryRun,
			platform: platform,
			zip: zip,
			archiveDirectory: archiveDirectory,
		})
	})
