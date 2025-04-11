import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { runEngineSetup } from '../../lib/utils.ts'

export type SetupOptions = typeof setup extends Command<void, void, infer Options, [], GlobalOptions> ? Options
	: never

export const setup = new Command<GlobalOptions>()
	.description('run a managed engine setup')
	.option('-s, --gitdepends', 'install git dependencies (ie Setup.bat)')
	.option(
		'-g, --gitdependscache <gitdependscache:file>',
		'git dependencies cache folder',
		{ depends: ['gitdepends'] },
	)
	.action(async (options, ...args) => {
		const { gitdepends, gitdependscache } = options as SetupOptions
		const { engine: { path: enginePath } } = Config.getInstance().mergeConfigCLIConfig({
			cliOptions: options,
		})
		if (gitdepends) {
			await runEngineSetup({ enginePath, gitDependsCache: gitdependscache })
		}
	})
