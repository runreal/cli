import { Command, EnumType } from '@cliffy/command'
import { ulid } from './lib/ulid.ts'
import { Config } from './lib/config.ts'
import { logger, LogLevel } from './lib/logger.ts'
import { VERSION } from './version.ts'

import { buildgraph } from './commands/buildgraph/index.ts'
import { run } from './commands/run/index.ts'
import { plugin } from './commands/plugin/index.ts'
import { engine } from './commands/engine/index.ts'
import { info } from './commands/info/index.ts'
import { build } from './commands/build/index.ts'
import { sln } from './commands/sln/index.ts'
import { init } from './commands/init.ts'
import { cook } from './commands/cook.ts'
import { pkg } from './commands/pkg.ts'
import { uat } from './commands/uat.ts'
import { ubt } from './commands/ubt.ts'
import { workflow } from './commands/workflow/index.ts'
import { script } from './commands/script.ts'
import { uasset } from './commands/uasset/index.ts'
import { auth } from './commands/auth.ts'
const LogLevelType = new EnumType(LogLevel)

export const cmd = new Command()
	.globalOption('--session-id <sessionId:string>', 'Session Id', {
		default: ulid() as string,
		// action: ({ sessionId }) => logger.setSessionId(sessionId),
	})
	.globalType('log-level', LogLevelType)
	.globalOption('--log-level <level:log-level>', 'Log level', {
		default: LogLevelType.values().at(LogLevelType.values().indexOf(LogLevel.DEBUG)),
		action: ({ logLevel }) => logger.setLogLevel(logLevel),
	})
	.globalOption('-c, --config-path <configPath:string>', 'Path to config file')
	.globalEnv('RUNREAL_ENGINE_PATH=<enginePath:string>', 'Overide path to engine folder', { prefix: 'RUNREAL_' })
	.globalOption('--engine-path <enginePath:string>', 'Path to engine folder')
	.globalEnv('RUNREAL_PROJECT_PATH=<projectPath:string>', 'Overide path to project folder', { prefix: 'RUNREAL_' })
	.globalOption('--project-path <projectPath:string>', 'Path to project folder')
	.globalEnv('RUNREAL_BUILD_ID=<buildId:string>', 'Overide build ID', { prefix: 'RUNREAL_' })
	.globalOption('--build-id <buildId:string>', 'Overide build ID')
	.globalEnv('RUNREAL_BUILD_PATH=<buildPath:string>', 'Overide path to build output folder', { prefix: 'RUNREAL_' })
	.globalOption('--build-path <buildPath:string>', 'Path to save build outputs')
	.globalEnv('RUNREAL_BUILD_TS=<buildTs:string>', 'Overide build timestamp', { prefix: 'RUNREAL_' })
	.globalOption('--build-ts <buildTs:string>', 'Overide build timestamp')
	.globalAction(async (options) => {
		// We load the config here so that the singleton should be instantiated before any command is run
		await Config.create({ path: options.configPath })
	})

export const cli = cmd
	.name('runreal')
	.version(VERSION)
	.description('the Unreal Engine runner')
	.action(function () {
		this.showHelp()
	})
	.command('buildgraph', buildgraph)
	.command('run', run)
	.command('engine', engine)
	.command('plugin', plugin)
	.command('build', build)
	.command('cook', cook)
	.command('pkg', pkg)
	.command('sln', sln)
	.command('uasset', uasset)
	.command('workflow', workflow)
	.command('info', info)
	.command('init', init)
	.command('uat', uat)
	.command('ubt', ubt)
	.command('script', script)
	.command('auth', auth)
