import { z } from '/deps.ts'
import { GlobalOptions } from '/index.ts'
import { DebugOptions } from '../commands/debug.ts'

import { CacheOptions } from '/commands/engine/cache.ts'
import { RestoreOptions } from '/commands/engine/restore.ts'
import { SetupOptions } from '/commands/engine/setup.ts'
import { InstallOptions } from '/commands/engine/install.ts'
import { UpdateOptions } from '/commands/engine/update.ts'
import { ConfigSchema } from '/lib/schema.ts'

export type CliOptions = Partial<
	& GlobalOptions
	& DebugOptions
	& CacheOptions
	& RestoreOptions
	& SetupOptions
	& InstallOptions
	& UpdateOptions
>

export interface EngineConfig {
	path: string
	source?: string
	branch?: string
	cachePath?: string
}

export interface ProjectConfig {
	name: string
	path: string
}

export interface GitConfig {
	dependenciesCachePath: string
	mirrors: boolean
	mirrorsPath: string
}

export interface BuildConfig {
	id: string
	path: string
	branch: string
	branchSafe: string
	commit: string
	commitShort: string
}

export interface BuildkiteMetadata {
	branch: string
	checkout: string
	buildNumber: string
	buildCheckoutPath: string
	buildPipelineSlug: string
}

export type RunrealConfig = z.infer<typeof ConfigSchema>

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
