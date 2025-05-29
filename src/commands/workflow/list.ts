import { Command, EnumType, ValidationError } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { cmd } from '../../cmd.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { exec as execCmd, randomBuildkiteEmoji } from '../../lib/utils.ts'
import { render } from '../../lib/template.ts'

export type ExecOptions = typeof list extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const list = new Command<GlobalOptions>()
	.description('list workflows')
	.action((options) => {
		const cfg = Config.instance().process(options)
		// console.log(cfg.workflows)

		// if (!cfg.workflows) {
		// 	console.log('No workflows defined in config')
		// 	return
		// }

		// for (const workflow of cfg.workflows) {
		// 	console.log(`${workflow.name} (${workflow.id})`)
		// }
	})
