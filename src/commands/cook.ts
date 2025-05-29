import { Command, EnumType } from '@cliffy/command'

import { createProject } from '../lib/project.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { Config } from '../lib/config.ts'
import { CookTarget } from '../lib/engine.ts'

export type CookOptions = typeof cook extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const cook = new Command<GlobalOptions>()
	.description('Cook content for the target')
	.type('Target', new EnumType(CookTarget))
	.arguments('<target:Target> [cookArguments...]')
	.option('--cultures <cultures:string>', 'Comma separated string of cultures to cook, defaults to all', {
		required: false,
	})
	.option('--onthefly', 'Launch as an on-the-fly server', { default: false })
	.option('--iterate', 'Cook iteratively', { default: true })
	.option('--noxge', 'Disable XGE shader compilation', { default: true })
	.option('--debug', 'Use debug executables', { default: false })
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, target = CookTarget.Windows, ...cookArguments: Array<string>) => {
		const { dryRun, noxge, debug, iterate, onthefly, cultures } = options as CookOptions
		const cfg = Config.instance().process(options)
		const project = await createProject(cfg.engine.path, cfg.project.path)

		let cultureArgs: string[] = []
		if (cultures) {
			cultureArgs = cultures.replace(' ', '').split(',')
		}

		await project.cookContent({
			target: target as CookTarget,
			extraArgs: cookArguments,
			cultures: cultureArgs,
			onTheFly: onthefly,
			iterate: iterate,
			noxge: noxge,
			debug: debug,
			dryRun: dryRun,
		})
	})
