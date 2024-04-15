import { Command } from '../../deps.ts'
import { config } from '../../lib/config.ts'
import { CliOptions, GlobalOptions } from '../../lib/types.ts'

export type DebugConfigOptions = typeof debugConfig extends Command<any, any, infer Options, any, any> ? Options
	: never

export const debugConfig = new Command<GlobalOptions>()
	.option('-r, --render', 'Render the config with substitutions')
	.description('debug config')
	.action((options) => {
		const { render } = options as DebugOptions & GlobalOptions
		const cfg = config.get(options as CliOptions)

		if (render) {
			const rendered = config.renderConfig(cfg)
			console.dir(rendered, { depth: null })
			return
		}

		console.dir(cfg, { depth: null })
	})
