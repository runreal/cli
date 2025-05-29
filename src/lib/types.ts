import type { Command } from '@cliffy/command'
import type { $ } from '@david/dax'
import type { z } from 'zod'
import type { cmd } from '../cmd.ts'

import type { DebugConfigOptions } from '../commands/info/config.ts'
import type { SetupOptions } from '../commands/engine/setup.ts'
import type { InstallOptions } from '../commands/engine/install.ts'
import type { UpdateOptions } from '../commands/engine/update.ts'
import type {
	InternalConfigSchema,
	RunrealConfigSchema,
	UserConfigSchema,
	UserRunrealPreferencesSchema,
} from './schema.ts'
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

export type InternalRunrealConfig = z.infer<typeof InternalConfigSchema>
export type UserConfig = z.infer<typeof UserConfigSchema>
export type RunrealConfig = z.infer<typeof RunrealConfigSchema>
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
	config: RunrealConfig
	lib: {
		$: typeof $
	}
	scriptName: string
}

export interface Script {
	main: (ctx: ScriptContext) => Promise<void>
}
