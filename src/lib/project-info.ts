export interface UProject {
	FileVersion: number
	EngineAssociation: string
	Category: string
	Description: string
	Modules?: Array<{
		Name: string
		Type: string
		LoadingPhase?: string
	}>
	Plugins?: Array<{
		Name: string
		Enabled: boolean
	}>
	TargetPlatforms?: string[]
	[key: string]: any // For any additional properties
}

export interface UPlugin {
	FileVersion: number
	Version: number
	VersionName: string
	FriendlyName: string
	Description: string
	Category: string
	CreatedBy: string
	CreatedByURL: string
	DocsURL?: string
	MarketplaceURL?: string
	SupportURL?: string
	CanContainContent: boolean
	IsBetaVersion?: boolean
	IsExperimentalVersion?: boolean
	Installed?: boolean
	Modules: Array<{
		Name: string
		Type: string
		LoadingPhase?: string
		PlatformAllowList?: string[]
		PlatformDenyList?: string[]
		WhitelistPlatforms?: string[] // Legacy
		BlacklistPlatforms?: string[] // Legacy
	}>
	EnabledByDefault?: boolean
	[key: string]: any // For any additional properties
}

export async function readUPluginFile(filePath: string): Promise<UPlugin> {
	try {
		// Read the file
		const text = await Deno.readTextFile(filePath)

		// Parse the JSON content
		const upluginData: UPlugin = JSON.parse(text)

		return upluginData
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			throw new Error(`File not found: ${filePath}`)
		} else if (error instanceof SyntaxError) {
			throw new Error(`Invalid .uplugin file format: ${error.message}`)
		} else {
			throw new Error(`Error reading .uplugin file`)
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

export async function readUProjectFile(filePath: string): Promise<UProject> {
	try {
		// Read the file
		const text = await Deno.readTextFile(filePath)

		// Parse the JSON content
		const uprojectData: UProject = JSON.parse(text)

		return uprojectData
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			throw new Error(`File not found: ${filePath}`)
		} else if (error instanceof SyntaxError) {
			throw new Error(`Invalid .uproject file format: ${error.message}`)
		} else {
			throw new Error(`Error reading .uproject file`)
		}
	}
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

// export async function displayInfo(filePath: string, jsonOutput: boolean = false) {
// 	if (!filePath.endsWith('.uproject')) {
// 		console.warn("Warning: The provided file doesn't have a .uproject extension")
// 	}

// 	const uprojectData = await readUProjectFile(filePath)
// 	displayUProjectInfo(uprojectData)
// 	console.log(JSON.stringify(uprojectData, null, 2))
// }
