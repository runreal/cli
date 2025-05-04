import { VERSION } from './version.ts'

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
import { script } from './commands/script.ts'
import { runpython } from './commands/runpython.ts'
import { uasset } from './commands/uasset/index.ts'
import { auth } from './commands/auth.ts'
import { listTargets } from './commands/list-targets.ts'

await cmd
	.name('runreal')
	.version(VERSION)
	.description('the Unreal Engine runner')
	.action(function () {
		this.showHelp()
	})
	.command('init', init)
	.command('debug', debug)
	.command('clean', clean)
	.command('build', build)
	.command('list-targets', listTargets)
	.command('engine', engine)
	.command('uat', uat)
	.command('ubt', ubt)
	.command('pkg', pkg)
	.command('buildgraph', buildgraph)
	.command('workflow', workflow)
	.command('script', script)
	.command('auth', auth)
	.command('runpython', runpython)
	.command('uasset', uasset)
	.parse(Deno.args)
