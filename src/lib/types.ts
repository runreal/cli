import type { Command, z } from '../deps.ts'
import type { cmd } from '../cmd.ts'

import type { ConfigSchema, InternalSchema } from './schema.ts'

export type GlobalOptions = typeof cmd extends
	Command<void, void, void, [], infer Options extends Record<string, unknown>> ? Options
	: never

export type CliOptions = Partial<
	GlobalOptions
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
