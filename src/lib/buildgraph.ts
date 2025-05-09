export interface BuildGraphArgs {
	buildId?: string
	editorTarget?: string
	gameTargets?: string[] | string
	licensee?: string
	versioned?: string
	promoted?: string
	archiveStream?: string
	forceSubmit?: string
	preferredAgent?: string
	archiveName?: string
	symbolStorePath?: string
	clientPlatforms?: string[] | string
	serverPlatforms?: string[] | string
	clientConfigurations?: string[] | string
	serverConfigurations?: string[] | string
	clientTargetType?: string
	outputDir?: string
	extraCompileArguments?: string[] | string
	extraCookArguments?: string[] | string
	extraPackageArguments?: string[] | string
	additionalTools?: string[] | string
	dryRun?: boolean
}

function buildGraphArgToString(arg: string[] | string, separator: string = ';') {
	if (Array.isArray(arg)) {
		return `${(arg as string[]).join(separator).replaceAll(' ', '')}`
	} else {
		return `${(arg as string)}`
	}
}

export function buildCommandLine(buildGraphArgs: BuildGraphArgs): string[] {
	const outArgs: string[] = []

	if (buildGraphArgs.buildId) {
		outArgs.push(`-Set:buildId=${buildGraphArgToString(buildGraphArgs.buildId)}`)
	}

	if (buildGraphArgs.editorTarget) {
		outArgs.push(`-Set:editorTarget=${buildGraphArgToString(buildGraphArgs.editorTarget)}`)
	}

	if (buildGraphArgs.gameTargets) {
		outArgs.push(`-Set:gameTargets=${buildGraphArgToString(buildGraphArgs.gameTargets, ';')}`)
	}

	if (buildGraphArgs.versioned) {
		outArgs.push(`-Set:versioned=${buildGraphArgToString(buildGraphArgs.versioned)}`)
	}

	if (buildGraphArgs.promoted) {
		outArgs.push(`-Set:promoted=${buildGraphArgToString(buildGraphArgs.promoted)}`)
	}

	if (buildGraphArgs.archiveStream) {
		outArgs.push(`-Set:archiveStream=${buildGraphArgToString(buildGraphArgs.archiveStream)}`)
	}

	if (buildGraphArgs.forceSubmit) {
		outArgs.push(`-Set:forceSubmit=${buildGraphArgToString(buildGraphArgs.forceSubmit)}`)
	}

	if (buildGraphArgs.preferredAgent) {
		outArgs.push(`-Set:preferredAgent=${buildGraphArgToString(buildGraphArgs.preferredAgent)}`)
	}

	if (buildGraphArgs.archiveName) {
		outArgs.push(`-Set:archiveName=${buildGraphArgToString(buildGraphArgs.archiveName)}`)
	}

	if (buildGraphArgs.symbolStorePath) {
		outArgs.push(`-Set:symbolStorePath=${buildGraphArgToString(buildGraphArgs.symbolStorePath)}`)
	}

	if (buildGraphArgs.clientPlatforms) {
		outArgs.push(`-Set:clientPlatforms=${buildGraphArgToString(buildGraphArgs.clientPlatforms)}`)
	}

	if (buildGraphArgs.serverPlatforms) {
		outArgs.push(`-Set:serverPlatforms=${buildGraphArgToString(buildGraphArgs.serverPlatforms)}`)
	}

	if (buildGraphArgs.clientConfigurations) {
		outArgs.push(`-Set:clientConfigurations=${buildGraphArgToString(buildGraphArgs.clientConfigurations)}`)
	}

	if (buildGraphArgs.serverConfigurations) {
		outArgs.push(`-Set:serverConfigurations=${buildGraphArgToString(buildGraphArgs.serverConfigurations)}`)
	}

	if (buildGraphArgs.clientTargetType) {
		outArgs.push(`-Set:clientTargetType=${buildGraphArgToString(buildGraphArgs.clientTargetType)}`)
	}

	if (buildGraphArgs.outputDir) {
		outArgs.push(`-Set:outputDir=${buildGraphArgToString(buildGraphArgs.outputDir)}`)
	}

	if (buildGraphArgs.extraCompileArguments) {
		outArgs.push(`-Set:extraCompileArguments=${buildGraphArgToString(buildGraphArgs.extraCompileArguments)}`)
	}

	if (buildGraphArgs.extraCookArguments) {
		outArgs.push(`-Set:extraCookArguments=${buildGraphArgToString(buildGraphArgs.extraCookArguments)}`)
	}

	if (buildGraphArgs.extraPackageArguments) {
		outArgs.push(`-Set:extraPackageArguments=${buildGraphArgToString(buildGraphArgs.extraPackageArguments)}`)
	}

	if (buildGraphArgs.additionalTools) {
		outArgs.push(`-Set:additionalTools=${buildGraphArgToString(buildGraphArgs.additionalTools)}`)
	}

	if (buildGraphArgs.dryRun) {
		outArgs.push('-ListOnly')
	}

	return outArgs
}
