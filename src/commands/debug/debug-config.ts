import { Command } from '../../deps.ts'
import { Config } from '../../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../../lib/types.ts'

export type DebugConfigOptions = typeof debugConfig extends Command<any, any, infer Options, any, any> ? Options
	: never

export const debugConfig = new Command<GlobalOptions>()
	.option('-r, --render', 'Render the config with substitutions')
	.description('debug config')
	.action((options) => {
		const { render } = options as DebugConfigOptions & GlobalOptions
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options as CliOptions })

		if (render) {
			const rendered = config.renderConfig(cfg)
			console.dir(rendered, { depth: null })
			return
		}

		console.dir(cfg, { depth: null })
	})
