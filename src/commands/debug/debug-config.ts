import { cmd } from '../../cmd.ts'
import { Command } from '../../deps.ts'
import { config } from '../../lib/config.ts'
import type { CliOptions, GlobalOptions } from '../../lib/types.ts'

export const debugConfig = new Command<GlobalOptions>()
	.description('debug config')
	.option('-r, --render', 'Render the config with substitutions')
	.action((options) => {
		const { render } = options
		const cfg = config.get(options as CliOptions)

		if (render) {
			const rendered = config.renderConfig(cfg)
			console.dir(rendered, { depth: null })
			return
		}

		console.dir(cfg, { depth: null })
	})
