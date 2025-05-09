import { Command } from '@cliffy/command'
import { $ } from '@david/dax'
import * as path from '@std/path'
import { toFileUrl } from '@std/path/to-file-url'
import { denoPlugins } from '@luca/esbuild-deno-loader'
import * as esbuild from 'esbuild'

import type { GlobalOptions, Script, ScriptContext } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'
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
			const filePath = path.join(Deno.cwd(), args[0])
			const fileUrl = toFileUrl(filePath)
			const scriptName = path.basename(filePath, '.ts')
			const outfilePath = path.join(Deno.cwd(), '.runreal', 'scripts', `${scriptName}.esm.js`)
			const outfileUrl = toFileUrl(outfilePath)
			const cfg = Config.getInstance().mergeConfigCLIConfig({ cliOptions: options })
			const context: ScriptContext = {
				config: cfg,
				lib: {
					$: $,
				},
				scriptName,
			}

			await esbuild.build({
			  plugins: [...denoPlugins({ loader: 'portable' })],
				entryPoints: [fileUrl.href],
				outfile: outfilePath,
				bundle: true,
				format: 'esm',
			})
			esbuild.stop()

			const script = (await import(outfileUrl.href)) as Script
			await script.main(context)
		} catch (e: any) {
			logger.error(e)
			Deno.exit(1)
		}
	})
