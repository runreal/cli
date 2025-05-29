import { Command } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export type DebugBuildIdOptions = typeof buildId extends
	Command<void, void, infer Options extends Record<string, unknown>, [], GlobalOptions> ? Options
	: never

export const buildId = new Command<GlobalOptions>()
	.description('debug buildId')
	.action((options) => {
		const cfg = Config.instance().process(options)
		console.log(cfg.build.id)
	})
