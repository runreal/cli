import { VERSION } from './version.ts'

import { config } from './lib/config.ts'
import { debug } from './commands/debug/index.ts'
import { build } from './commands/build.ts'
import { engine } from './commands/engine/index.ts'
import { init } from './commands/init.ts'
import { uat } from './commands/uat.ts'
import { ubt } from './commands/ubt.ts'
import { pkg } from './commands/pkg.ts'
import { buildgraph } from './commands/buildgraph/index.ts'
import { workflow } from './commands/workflow/index.ts'
import { clean } from './commands/clean.ts'
import { cmd } from './cmd.ts'

await cmd
	.name('runreal')
	.version(VERSION)
	.globalAction(({ configPath, ...options }) => {
		// initialize config
		if (configPath) {
			config(configPath)
		}
	})
	.description('the Unreal Engine runner')
	.command('init', init)
	.command('debug', debug)
	.command('clean', clean)
	.command('build', build)
	.command('engine', engine)
	.command('uat', uat)
	.command('ubt', ubt)
	.command('pkg', pkg)
	.command('buildgraph', buildgraph)
	.command('workflow', workflow)
	.parse(Deno.args)
