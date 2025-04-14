import type { Command } from '@cliffy/command'
import type * as path from '@std/path'
import type { $ } from '@david/dax'
import type { z } from 'zod'
import type { cmd } from '../cmd.ts'

import type { DebugConfigOptions } from '../commands/debug/debug-config.ts'
import type { SetupOptions } from '../commands/engine/setup.ts'
import type { InstallOptions } from '../commands/engine/install.ts'
import type { UpdateOptions } from '../commands/engine/update.ts'
import type { ConfigSchema, InternalSchema, UserRunrealConfigSchema, UserRunrealPreferencesSchema } from './schema.ts'
import type { Type } from '@cliffy/command'

export type GlobalOptions = typeof cmd extends Command<void, void, void, [], infer Options> ? Options
	: never

type allOptions = Partial<
	& GlobalOptions
	& DebugConfigOptions
	& SetupOptions
	& InstallOptions
	& UpdateOptions
>

export type CliOptions = { [K in keyof allOptions]: Type.infer<allOptions[K]> }

type InternalRunrealConfig = z.infer<typeof InternalSchema>
export type RunrealConfig = z.infer<typeof ConfigSchema> & InternalRunrealConfig

export type UserRunrealConfig = z.infer<typeof UserRunrealConfigSchema>

export type UserRunrealPreferences = z.infer<typeof UserRunrealPreferencesSchema>

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
