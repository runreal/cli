import { Command } from '@cliffy/command'
import { $ } from '@david/dax'
import * as path from '@std/path'
import type { GlobalOptions, Script, ScriptContext } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'

import * as esbuild from 'esbuild'

import { denoPlugins } from '@luca/esbuild-deno-loader'
import { Config } from '../lib/config.ts'

export const script = new Command<GlobalOptions>()
	.description('script')
	.arguments('<input:string>')
	.action(async (options, ...args: string[]) => {
		if (!args[0]) {
			logger.error('No script name provided')
			Deno.exit(1)
		}

		try {
			const current = Deno.cwd()
			const file = `${current}/${args[0]}`
			const cfg = Config.getInstance().mergeConfigCLIConfig({ cliOptions: options })
			const context: ScriptContext = {
				env: 'dev',
				config: cfg,
				lib: {
					$: $,
					path: path,
				},
			}

			const builtOutput = `${current}/.runreal/dist/script.esm.js`

			await esbuild.build({
				plugins: [...denoPlugins({ loader: 'portable' })],
				entryPoints: [file],
				outfile: builtOutput,
				bundle: true,
				format: 'esm',
			})
			esbuild.stop()

			const script = (await import(builtOutput)) as Script
			await script.main(context)
		} catch (e: any) {
			logger.error(e)
			Deno.exit(1)
		}
	})
