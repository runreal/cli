import * as path from '@std/path'

import { findFilesByExtension } from './utils.ts'

/**
 * Enum for target types
 */
type TargetType = 'Unknown' | 'Game' | 'Server' | 'Client' | 'Editor' | 'Program'

/**
 * Enum for target configurations
 */
type TargetConfiguration = 'Unknown' | 'Debug' | 'DebugGame' | 'Development' | 'Shipping' | 'Test'

/**
 * Enum for module types
 */
type ModuleType =
	| 'Runtime'
	| 'RuntimeNoCommandlet'
	| 'RuntimeAndProgram'
	| 'CookedOnly'
	| 'UncookedOnly'
	| 'Developer'
	| 'DeveloperTool'
	| 'Editor'
	| 'EditorNoCommandlet'
	| 'EditorAndProgram'
	| 'Program'
	| 'ServerOnly'
	| 'ClientOnly'
	| 'ClientOnlyNoCommandlet'

/**
 * Enum for loading phases
 */
type LoadingPhase =
	| 'EarliestPossible'
	| 'PostConfigInit'
	| 'PostSplashScreen'
	| 'PreEarlyLoadingScreen'
	| 'PreLoadingScreen'
	| 'PreDefault'
	| 'Default'
	| 'PostDefault'
	| 'PostEngineInit'
	| 'None'

/**
 * Enum for localization target loading policy
 */
type LoadingPolicy =
	| 'Never'
	| 'Always'
	| 'Editor'
	| 'Game'
	| 'PropertyNames'
	| 'ToolTips'

/**
 * Description of a loadable Unreal Engine module
 */
interface UnrealEngineModule {
	/** Name of the module */
	Name: string

	/** Usage type of module */
	Type: ModuleType

	/** When should the module be loaded during the startup sequence? This is sort of an advanced setting. */
	LoadingPhase?: LoadingPhase

	/** List of allowed platforms */
	PlatformAllowList?: string[]

	/** @deprecated Use "PlatformAllowList" instead. List of allowed platforms */
	WhitelistPlatforms?: string[]

	/** List of disallowed platforms */
	PlatformDenyList?: string[]

	/** @deprecated Use "PlatformDenyList" instead. List of disallowed platforms */
	BlacklistPlatforms?: string[]

	/** List of allowed targets */
	TargetAllowList?: TargetType[]

	/** @deprecated Use "TargetAllowList" instead. List of allowed targets */
	WhitelistTargets?: TargetType[]

	/** List of disallowed targets */
	TargetDenyList?: TargetType[]

	/** @deprecated Use "TargetDenyList" instead. List of disallowed targets */
	BlacklistTargets?: TargetType[]

	/** List of allowed target configurations */
	TargetConfigurationAllowList?: TargetConfiguration[]

	/** @deprecated Use "TargetConfigurationAllowList" instead. List of allowed target configurations */
	WhitelistTargetConfigurations?: TargetConfiguration[]

	/** List of disallowed target configurations */
	TargetConfigurationDenyList?: TargetConfiguration[]

	/** @deprecated Use "TargetConfigurationDenyList" instead. List of disallowed target configurations */
	BlacklistTargetConfigurations?: TargetConfiguration[]

	/** List of allowed programs */
	ProgramAllowList?: string[]

	/** @deprecated Use "ProgramAllowList" instead. List of allowed programs */
	WhitelistPrograms?: string[]

	/** List of allowed programs */
	ProgramDenyList?: string[]

	/** @deprecated Use "ProgramDenyList" instead. List of allowed programs */
	BlacklistPrograms?: string[]

	/** List of additional dependencies for building this module */
	AdditionalDependencies?: string[]

	/** When true, an empty PlatformAllowList is interpreted as 'no platforms' with the expectation that explicit platforms will be added in plugin extensions */
	HasExplicitPlatforms?: boolean
}

/**
 * Description of a localization target
 */
interface LocalizationTarget {
	/** Name of this target */
	Name: string

	/** Policy by which the localization data associated with a target should be loaded */
	LoadingPolicy?: LoadingPolicy
}

/**
 * Description for a Unreal Engine plugin reference
 * Contains the information required to enable or disable a plugin for a given platform
 */
export interface UnrealEnginePluginReference {
	/** Name of the plugin */
	Name: string

	/** Whether plugin should be enabled by default */
	Enabled: boolean

	/** Whether this plugin is optional, and the game should silently ignore it not being present */
	Optional?: boolean

	/** Description of the plugin for users that do not have it installed */
	Description?: string

	/** URL for this plugin on the marketplace, if the user doesn't have it installed */
	MarketplaceURL?: string

	/** List of platforms for which the plugin should be enabled (or all platforms if blank) */
	PlatformAllowList?: string[]

	/** @deprecated Use "PlatformAllowList" instead. List of platforms for which the plugin should be enabled (or all platforms if blank) */
	WhitelistPlatforms?: string[]

	/** List of target configurations for which the plugin should be disabled */
	PlatformDenyList?: string[]

	/** @deprecated Use "PlatformDenyList" instead. List of target configurations for which the plugin should be disabled */
	BlacklistPlatforms?: string[]

	/** List of target configurations for which the plugin should be enabled (or all target configurations if blank) */
	TargetConfigurationAllowList?: TargetConfiguration[]

	/** @deprecated Use "TargetConfigurationAllowList" instead. List of target configurations for which the plugin should be enabled (or all target configurations if blank) */
	WhitelistTargetConfigurations?: TargetConfiguration[]

	/** List of target configurations for which the plugin should be disabled */
	TargetConfigurationDenyList?: TargetConfiguration[]

	/** @deprecated Use "TargetConfigurationDenyList" instead. List of target configurations for which the plugin should be disabled */
	BlacklistTargetConfigurations?: TargetConfiguration[]

	/** List of targets for which the plugin should be enabled (or all targets if blank) */
	TargetAllowList?: TargetType[]

	/** @deprecated Use "TargetAllowList" instead. List of targets for which the plugin should be enabled (or all targets if blank) */
	WhitelistTargets?: TargetType[]

	/** List of targets for which the plugin should be disabled */
	TargetDenyList?: TargetType[]

	/** @deprecated Use "TargetDenyList" instead. List of targets for which the plugin should be disabled */
	BlacklistTargets?: TargetType[]

	/** The list of supported target platforms for this plugin. This field is copied from the plugin descriptor, and supplements the user's whitelisted and blacklisted platforms */
	SupportedTargetPlatforms?: string[]

	/** When true, empty SupportedTargetPlatforms and PlatformAllowList are interpreted as 'no platforms' with the expectation that explicit platforms will be added in plugin platform extensions */
	HasExplicitPlatforms?: boolean
}

/**
 * Type for build steps mapping
 */
type BuildSteps = {
	[hostPlatform: string]: string[]
}

/**
 * Unreal Engine Project Description File
 */
export interface UPlugin {
	/** Descriptor version number */
	FileVersion: number

	/** Version number for the plugin. The version number must increase with every version of the plugin, so that the system can determine whether one version of a plugin is newer than another, or to enforce other requirements. This version number is not displayed in front-facing UI. Use the VersionName for that. */
	Version?: number

	/** Name of the version for this plugin. This is the front-facing part of the version number. It doesn't need to match the version number numerically, but should be updated when the version number is increased accordingly. */
	VersionName?: string

	/** Friendly name of the plugin */
	FriendlyName?: string

	/** Description of the plugin */
	Description?: string

	/** The name of the category this plugin */
	Category?: string

	/** @deprecated Use "Category" instead. The name of the category this plugin */
	CategoryPath?: string

	/** The company or individual who created this plugin. This is an optional field that may be displayed in the user interface. */
	CreatedBy?: string

	/** Hyperlink URL string for the company or individual who created this plugin. This is optional. */
	CreatedByURL?: string

	/** Hyperlink URL string for documentation about this plugin */
	DocsURL?: string

	/** Marketplace URL for this plugin. This URL will be embedded into projects that enable this plugin, so we can redirect to the marketplace if a user doesn't have it installed. */
	MarketplaceURL?: string

	/** Support URL/email for this plugin */
	SupportURL?: string

	/** Version of the engine that this plugin is compatible with */
	EngineVersion?: string

	/** Optional custom virtual path to display in editor to better organize. Inserted just before this plugin's directory in the path: /All/Plugins/EditorCustomVirtualPath/PluginName */
	EditorCustomVirtualPath?: string

	/** List of target platforms supported by this plugin. This list will be copied to any plugin reference from a project file, to allow filtering entire plugins from staged builds. */
	SupportedTargetPlatforms?: string[]

	/** List of programs that are supported by this plugin */
	SupportedPrograms?: string[]

	/** The real plugin that this one is just extending */
	ParentPluginName?: string

	/** If true, this plugin is from a platform extension extending another plugin */
	bIsPluginExtension?: boolean

	/** List of all modules associated with this plugin */
	Modules?: UnrealEngineModule[]

	/** List of all localization targets associated with this plugin */
	LocalizationTargets?: LocalizationTarget[]

	/** Whether this plugin should be enabled by default for all projects */
	EnabledByDefault?: boolean

	/** Can this plugin contain content? */
	CanContainContent?: boolean

	/** Can this plugin contain Verse code? */
	CanContainVerse?: boolean

	/** Marks the plugin as beta in the UI */
	IsBetaVersion?: boolean

	/** Marks the plugin as experimental in the UI */
	IsExperimentalVersion?: boolean

	/** Signifies that the plugin was installed on top of the engine */
	Installed?: boolean

	/** For plugins that are under a platform folder (eg. /PS4/), determines whether compiling the plugin requires the build platform and/or SDK to be available */
	RequiresBuildPlatform?: boolean

	/** For auto-generated plugins that should not be listed in the plugin browser for users to disable freely */
	Hidden?: boolean

	/** When true, this plugin's modules will not be loaded automatically nor will it's content be mounted automatically. It will load/mount when explicitly requested and LoadingPhases will be ignored */
	ExplicitlyLoaded?: boolean

	/** When true, an empty SupportedTargetPlatforms is interpreted as 'no platforms' with the expectation that explicit platforms will be added in plugin platform extensions */
	HasExplicitPlatforms?: boolean

	/** @deprecated Add "UnrealHeaderTool" to "SupportedPrograms" instead. Marks this plugin as supporting the UnrealHeaderTool */
	CanBeUsedWithUnrealHeaderTool?: boolean

	/** Custom steps to execute before building targets in this plugin. A mapping from host platform to a list of commands */
	PreBuildSteps?: BuildSteps

	/** Custom steps to execute after building targets in this plugin. A mapping from host platform to a list of commands */
	PostBuildSteps?: BuildSteps

	/** List of dependent plugins */
	Plugins?: UnrealEnginePluginReference[]

	/** Additional properties are allowed */
	[key: string]: any
}

/**
 * Unreal Engine Project Description File (.uproject)
 */
export interface UProject {
	/** Descriptor version number */
	FileVersion: number

	/** The engine to open the project with */
	EngineAssociation?: string

	/** Category to show under the project browser */
	Category?: string

	/** Description to show in the project browser */
	Description?: string

	/** Indicates if this project is an Enterprise project */
	Enterprise?: boolean

	/** Indicates that enabled by default engine plugins should not be enabled unless explicitly enabled by the project or target files */
	DisableEnginePluginsByDefault?: boolean

	/** List of all modules associated with this project */
	Modules?: UnrealEngineModule[]

	/** List of plugins for this project (may be enabled/disabled) */
	Plugins?: UnrealEnginePluginReference[]

	/** List of additional directories to scan for plugins */
	AdditionalPluginDirectories?: string[]

	/** List of additional root directories to scan for modules */
	AdditionalRootDirectories?: string[]

	/** Array of platforms that this project is targeting */
	TargetPlatforms?: string[]

	/** A hash that is used to determine if the project was forked from a sample */
	EpicSampleNameHash?: number

	/** Custom steps to execute before building targets in this project. A mapping from host platform to a list of commands. */
	PreBuildSteps?: BuildSteps

	/** Custom steps to execute after building targets in this project. A mapping from host platform to a list of commands. */
	PostBuildSteps?: BuildSteps
}

export async function readUPluginFile(filePath: string): Promise<UPlugin | null> {
	try {
		// Read the file
		const text = await Deno.readTextFile(filePath)

		// Parse the JSON content
		const upluginData: UPlugin = await JSON.parse(text)

		return upluginData
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			//console.warn(`File not found: ${filePath}`)
			return null
		} else if (error instanceof SyntaxError) {
			//console.warn(`${filePath} Invalid .uplugin file format: ${error.message}`)
			return null
		} else {
			//console.warn(`${filePath} Error reading .uplugin file`)
			return null
		}
	}
}

export function displayUPluginInfo(uplugin: UPlugin): void {
	console.log('\n=== UPlugin Information ===')
	console.log(`File Version: ${uplugin.FileVersion}`)
	console.log(`Version: ${uplugin.Version}`)
	console.log(`Version Name: ${uplugin.VersionName}`)
	console.log(`Friendly Name: ${uplugin.FriendlyName}`)
	console.log(`Description: ${uplugin.Description}`)
	console.log(`Category: ${uplugin.Category}`)
	console.log(`Created By: ${uplugin.CreatedBy}`)
	console.log(`Created By URL: ${uplugin.CreatedByURL}`)

	if (uplugin.DocsURL) console.log(`Docs URL: ${uplugin.DocsURL}`)
	if (uplugin.MarketplaceURL) console.log(`Marketplace URL: ${uplugin.MarketplaceURL}`)
	if (uplugin.SupportURL) console.log(`Support URL: ${uplugin.SupportURL}`)

	console.log(`Can Contain Content: ${uplugin.CanContainContent}`)

	if (uplugin.IsBetaVersion !== undefined) console.log(`Is Beta Version: ${uplugin.IsBetaVersion}`)
	if (uplugin.IsExperimentalVersion !== undefined) {
		console.log(`Is Experimental Version: ${uplugin.IsExperimentalVersion}`)
	}
	if (uplugin.Installed !== undefined) console.log(`Installed: ${uplugin.Installed}`)
	if (uplugin.EnabledByDefault !== undefined) console.log(`Enabled By Default: ${uplugin.EnabledByDefault}`)

	if (uplugin.Modules && uplugin.Modules.length > 0) {
		console.log('\n--- Modules ---')
		uplugin.Modules.forEach((module, index) => {
			console.log(`\nModule ${index + 1}:`)
			console.log(`  Name: ${module.Name}`)
			console.log(`  Type: ${module.Type}`)

			if (module.LoadingPhase) {
				console.log(`  Loading Phase: ${module.LoadingPhase}`)
			}

			if (module.PlatformAllowList && module.PlatformAllowList.length > 0) {
				console.log(`  Platform Allow List: ${module.PlatformAllowList.join(', ')}`)
			}

			if (module.PlatformDenyList && module.PlatformDenyList.length > 0) {
				console.log(`  Platform Deny List: ${module.PlatformDenyList.join(', ')}`)
			}

			// Handle legacy platform lists
			if (module.WhitelistPlatforms && module.WhitelistPlatforms.length > 0) {
				console.log(`  Whitelist Platforms (Legacy): ${module.WhitelistPlatforms.join(', ')}`)
			}

			if (module.BlacklistPlatforms && module.BlacklistPlatforms.length > 0) {
				console.log(`  Blacklist Platforms (Legacy): ${module.BlacklistPlatforms.join(', ')}`)
			}
		})
	}
}

export async function readUProjectFile(filePath: string): Promise<UProject | null> {
	try {
		// Read the file
		const text = await Deno.readTextFile(filePath)

		// Parse the JSON content
		const uprojectData: UProject = JSON.parse(text)

		return uprojectData
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			//console.warn(`File not found: ${filePath}`)
			return null
		} else if (error instanceof SyntaxError) {
			//console.warn(`Invalid .uproject file format: ${error.message}`)
			return null
		} else {
			//console.warn(`Error reading .uproject file`)
			return null
		}
	}
}

export async function writeUProjectFile(filePath: string, projectData: UProject) {
	await Deno.writeTextFile(filePath, JSON.stringify(projectData))
}

export function displayUProjectInfo(uproject: UProject): void {
	console.log('\n=== UProject Information ===')
	console.log(`File Version: ${uproject.FileVersion}`)
	console.log(`Engine Association: ${uproject.EngineAssociation}`)
	console.log(`Category: ${uproject.Category}`)
	console.log(`Description: ${uproject.Description}`)

	if (uproject.Modules && uproject.Modules.length > 0) {
		console.log('\n--- Modules ---')
		uproject.Modules.forEach((module, index) => {
			console.log(`\nModule ${index + 1}:`)
			console.log(`  Name: ${module.Name}`)
			console.log(`  Type: ${module.Type}`)
			if (module.LoadingPhase) {
				console.log(`  Loading Phase: ${module.LoadingPhase}`)
			}
		})
	}

	if (uproject.Plugins && uproject.Plugins.length > 0) {
		console.log('\n--- Plugins ---')
		uproject.Plugins.forEach((plugin, index) => {
			console.log(`\nPlugin ${index + 1}:`)
			console.log(`  Name: ${plugin.Name}`)
			console.log(`  Enabled: ${plugin.Enabled}`)
		})
	}

	if (uproject.TargetPlatforms && uproject.TargetPlatforms.length > 0) {
		console.log('\n--- Target Platforms ---')
		uproject.TargetPlatforms.forEach((platform, index) => {
			console.log(`  ${index + 1}. ${platform}`)
		})
	}
}

export async function findPluginFile(
	pluginName: string,
	projectPath: string,
	enginePath?: string,
): Promise<string | null> {
	const pluginFiles = await findFilesByExtension(path.join(projectPath, 'Plugins'), 'uplugin', true)
	const regex = new RegExp(`${pluginName}\.uplugin`)
	const matches = pluginFiles.filter((element) => regex.test(element))

	if (matches.length <= 0 && enginePath) {
		const enginePlugins = await findFilesByExtension(path.join(enginePath, 'Engine', 'Plugins'), 'uplugin', true)
		const engineMatches = enginePlugins.filter((element) => regex.test(element))
		matches.push(...engineMatches)
	}

	if (matches.length == 1) {
		return matches[0]
	} else if (matches.length > 1) {
		console.log(`found more than one plugin with name ${pluginName}`)
		console.log(matches)
		return null
	} else {
		console.log(`could not find ${pluginName}`)
		return null
	}
}

// export async function displayInfo(filePath: string, jsonOutput: boolean = false) {
// 	if (!filePath.endsWith('.uproject')) {
// 		console.warn("Warning: The provided file doesn't have a .uproject extension")
// 	}

// 	const uprojectData = await readUProjectFile(filePath)
// 	displayUProjectInfo(uprojectData)
// 	console.log(JSON.stringify(uprojectData, null, 2))
// }
