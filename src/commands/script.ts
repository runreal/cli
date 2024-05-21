import { Command } from '../deps.ts'
import { importString } from 'https://deno.land/x/import/mod.ts'
import { Script, ScriptContext } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'

export const script = new Command()
	.description('script')
	.arguments('<name:string>')
	.action(async (options, ...args: string[]) => {
		logger.info('running script')
		logger.info(args)

		if (!args[0]) {
			logger.error('No script name provided')
			Deno.exit(1)
		}

		try {
			const raw = Deno.readTextFileSync(args[0])
			const context: ScriptContext = {
				env: 'dev',
				lib: {
					uploadArtifact: async () => {
						console.log('uploading artifact')
					},
				},
			}

			const script = (await importString(raw)) as Script
			await script.main(context)
		} catch (e) {
			logger.error(e)
			Deno.exit(1)
		}
	})
