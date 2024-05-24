import { $, Command, path } from '../deps.ts'
import { importString } from 'https://deno.land/x/import/mod.ts'
import { CliOptions, Script, ScriptContext } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'
import { config } from '../lib/config.ts'
// utils

export const script = new Command()
	.description('script')
	.arguments('<name:string>')
	.action(async (options: unknown, ...args: string[]) => {
		logger.info('running script')
		logger.info(args)

		if (!args[0]) {
			logger.error('No script name provided')
			Deno.exit(1)
		}

		try {
			const raw = Deno.readTextFileSync(args[0])

			const cfg = config.get(options as CliOptions)

			const context: ScriptContext = {
				env: 'dev',
				config: cfg,
				lib: {
					$: $,
					path: path,
				},
			}

			const script = (await importString(raw)) as Script
			await script.main(context)
		} catch (e) {
			logger.error(e)
			Deno.exit(1)
		}
	})
