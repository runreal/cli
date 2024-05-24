import { $, Command, path, z } from '../deps.ts'
import { cmd } from '../cmd.ts'

import { DebugConfigOptions } from '../commands/debug/debug-config.ts'
import { SetupOptions } from '../commands/engine/setup.ts'
import { InstallOptions } from '../commands/engine/install.ts'
import { UpdateOptions } from '../commands/engine/update.ts'
import { ConfigSchema, InternalSchema } from './schema.ts'

export type GlobalOptions = typeof cmd extends
	Command<void, void, void, [], infer Options extends Record<string, unknown>> ? Options
	: never

export type CliOptions = Partial<
	& GlobalOptions
	& DebugConfigOptions
	& SetupOptions
	& InstallOptions
	& UpdateOptions
>

type InternalRunrealConfig = z.infer<typeof InternalSchema>
export type RunrealConfig = z.infer<typeof ConfigSchema> & InternalRunrealConfig

export interface UeDepsManifestData {
	Name: string
	Hash: string
	ExpectedHash: string
	Timestamp: string
}

export interface UeDepsManifest {
	WorkingManifest: {
		Files: {
			File: {
				'_attributes': UeDepsManifestData
			}[]
		}
	}
}

export interface GitIgnoreFiles {
	files: string[]
	dirs: string[]
}

export interface ScriptContext {
	env: string
	config: RunrealConfig
	lib: {
		$: typeof $
		path: typeof path
	}
}

export interface Script {
	main: (ctx: ScriptContext) => Promise<void>
}
