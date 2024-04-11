import { Command, EnumType, ulid } from './deps.ts'

import { config } from './lib/config.ts'
import { logger, LogLevel } from './lib/logger.ts'

export const cmd = new Command()
	.globalOption('--session-id <sessionId:string>', 'Session Id', {
		default: ulid() as string,
		// action: ({ sessionId }) => logger.setSessionId(sessionId),
	})
	.globalType('log-level', new EnumType(LogLevel))
	.globalOption('--log-level <level:log-level>', 'Log level', {
		default: LogLevel.DEBUG,
		action: ({ logLevel }) => logger.setLogLevel(logLevel),
	})
	.globalOption('-c, --config-path <configPath:string>', 'Path to config file', {
		action: async ({ configPath }) => {
			if (configPath) { const cfg = await config.mergeConfig(configPath) }
		},
	})
	.globalEnv('RUNREAL_ENGINE_PATH=<enginePath:string>', 'Overide path to engine folder', { prefix: 'RUNREAL_' })
	.globalOption('--engine-path <enginePath:string>', 'Path to engine folder')
	.globalEnv('RUNREAL_PROJECT_PATH=<projectPath:string>', 'Overide path to project folder', { prefix: 'RUNREAL_' })
	.globalOption('--project-path <projectPath:string>', 'Path to project folder')
	.globalEnv('RUNREAL_BUILD_ID=<buildId:string>', 'Overide build ID', { prefix: 'RUNREAL_' })
	.globalOption('--build-id <buildId:string>', 'Overide build ID')
	.globalEnv('RUNREAL_BUILD_PATH=<buildPath:string>', 'Overide path to build output folder', { prefix: 'RUNREAL_' })
	.globalOption('--build-path <buildPath:string>', 'Path to save build outputs')
