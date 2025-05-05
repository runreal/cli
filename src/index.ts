import { VERSION } from './version.ts'

import { debug } from './commands/debug/index.ts'
import { engine } from './commands/engine/index.ts'
import { init } from './commands/init.ts'
import { uat } from './commands/uat.ts'
import { ubt } from './commands/ubt.ts'
import { buildgraph } from './commands/buildgraph/index.ts'
import { workflow } from './commands/workflow/index.ts'
import { cmd } from './cmd.ts'
import { script } from './commands/script.ts'
import { uasset } from './commands/uasset/index.ts'
import { auth } from './commands/auth.ts'
import { project } from './commands/project/index.ts'
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
	.command('list-targets', listTargets)
	.command('engine', engine)
	.command('uat', uat)
	.command('ubt', ubt)
	.command('buildgraph', buildgraph)
	.command('workflow', workflow)
	.command('script', script)
	.command('auth', auth)
	.command('uasset', uasset)
	.command('project', project)
	.parse(Deno.args)
