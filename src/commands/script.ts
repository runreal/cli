import { $, Command, path } from '../deps.ts'
import type { Script, ScriptContext } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'
import { config } from '../lib/config.ts'
// utils
// import * as esbuild from "npm:esbuild@0.24.0";
import * as esbuild from 'https://deno.land/x/esbuild@v0.24.0/mod.js'

// import { importString } from 'https://deno.land/x/import/mod.ts';

// import * as esbuild from "https://deno.land/x/esbuild@0.24.0/wasm.js";
// Import the Wasm build on platforms where running subprocesses is not
// permitted, such as Deno Deploy, or when running without `--allow-run`.
// import * as esbuild from "https://deno.land/x/esbuild@0.20.2/wasm.js";

import { denoPlugins } from 'jsr:@luca/esbuild-deno-loader@0.11.0'

esbuild.stop()
export const script = new Command()
	.description('script')
	.arguments('<input:string>')
	// .parse(Deno.args)
	// .useRawArgs() // <-- enable raw args
	// .arguments("[script] [...args]")
	.action(async (options, ...args: string[]) => {
		if (!args[0]) {
			logger.error('No script name provided')
			Deno.exit(1)
		}

		try {
			const current = Deno.cwd()
			const file = `${current}/${args[0]}`
			const cfg = config.get()
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
		} catch (e) {
			logger.error(e)
			Deno.exit(1)
		}
	})
