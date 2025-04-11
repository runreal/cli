import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export type DebugConfigOptions = typeof debugConfig extends
	Command<void, void, infer Options extends Record<string, unknown>, [], GlobalOptions> ? Options
	: never

export const debugConfig = new Command<GlobalOptions>()
	.option('-r, --render', 'Render the config with substitutions')
	.description('debug config')
	.action((options) => {
		const { render } = options
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options })

		if (render) {
			const rendered = config.renderConfig(cfg)
			console.dir(rendered, { depth: null })
			return
		}

		console.dir(cfg, { depth: null })
	})
