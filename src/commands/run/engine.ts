import { Command, EnumType } from '@cliffy/command'

import { createEngine, Engine, EngineConfiguration, EnginePlatform, EngineTarget } from '../../lib/engine.ts'
import type { GlobalOptions } from '../../lib/types.ts'

export type CompileOptions = typeof engine extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

export const engine = new Command<GlobalOptions>()
	.description('Builds the editor')
	.arguments('[runArgs...]')
	.option('--dry-run', 'Dry run', { default: false })
	.stopEarly()
	.action(async (options, ...runArgs: Array<string>) => {
		const { dryRun } = options as CompileOptions

		const engine = createEngine(options.enginePath)

		await engine.runEditor({
			useCmd: false,
			debug: false,
			dryRun: false,
			args: [...runArgs],
		})
	})
