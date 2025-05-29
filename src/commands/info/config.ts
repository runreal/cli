import { Command } from '@cliffy/command'
import { Config, ConfigError } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export type DebugConfigOptions = typeof config extends
	Command<void, void, infer Options extends Record<string, unknown>, [], GlobalOptions> ? Options
	: never

export const config = new Command<GlobalOptions>()
	.option('-r, --render', 'Render the config with substitutions')
	.description('debug config')
	.action((options) => {
		const { render } = options
		const cfg = Config.instance().process(options, Boolean(render))
		console.dir(cfg, { depth: null })
	})
