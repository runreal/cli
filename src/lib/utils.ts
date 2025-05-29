import { mergeReadableStreams } from '@std/streams'
import * as path from '@std/path'
import { createEngine } from './engine.ts'
import type { GitIgnoreFiles, UeDepsManifest } from './types.ts'

export async function exec(
	cmd: string,
	args: string[],
	options: { cwd?: string | URL; dryRun?: boolean; quiet?: boolean } = { dryRun: false, quiet: false },
) {
	const { dryRun, quiet } = options

	if (dryRun) {
		console.log(`[${cmd}] ${args.join(' ')}`)
		return { success: true, code: 0, signal: null, output: '' }
	}

	const command = new Deno.Command(cmd, {
		args,
		cwd: options.cwd,
		stderr: 'piped',
		stdout: 'piped',
	})
	const process = command.spawn()
	const joined = mergeReadableStreams(process.stdout, process.stderr)
	let output = ''

	for await (const chunk of joined) {
		if (!quiet) {
			Deno.stdout.write(chunk)
		}
		output += new TextDecoder().decode(chunk)
	}

	output = output.trim()

	const { success, code, signal } = await process.status
	return { success, code, signal, output }
}

export function execSync(
	cmd: string,
	args: string[],
	options: { cwd?: string | URL; dryRun?: boolean; quiet?: boolean } = { dryRun: false, quiet: false },
) {
	const { dryRun, quiet } = options

	if (dryRun) {
		console.log(`[${cmd}] ${args.join(' ')}`)
		return { success: true, code: 0, signal: null, output: '' }
	}

	const command = new Deno.Command(cmd, {
		args,
		cwd: options.cwd,
		stderr: 'piped',
		stdout: 'piped',
	})
	const process = command.outputSync()
	let output = ''
	if (!quiet) {
		Deno.stdout.writeSync(process.stdout)
		Deno.stderr.writeSync(process.stderr)
	}
	output += new TextDecoder().decode(process.stdout)
	output += new TextDecoder().decode(process.stderr)
	output = output.trim()

	const { success, code, signal } = process
	return { success, code, signal, output }
}

export async function findProjectFile(projectPath: string): Promise<string> {
	const files = await Deno.readDir(projectPath)
	for await (const file of files) {
		if (file.isFile && file.name.endsWith('.uproject')) {
			return path.normalize(`${projectPath}/${file.name}`)
		}
	}
	throw new Error(`Could not find .uproject file in ${projectPath}`)
}

export async function getProjectName(projectPath: string): Promise<string> {
	const projectFile = await findProjectFile(projectPath)
	return path.basename(projectFile, '.uproject')
}

export const getRepoName = (repoUrl: string) => {
	const parts = repoUrl.replace(/\/$/, '').split('/')
	return parts[parts.length - 1]?.replace(/\.git$/, '') ?? ''
}

export const getRepoOrg = (repoUrl: string) => {
	const parts = repoUrl.replace(/\/$/, '').split('/')
	return parts[parts.length - 2] ?? ''
}

export const isGitRepo = async (path: string) => {
	try {
		const { success } = await exec('git', ['status'], { cwd: path, quiet: true })
		return success
	} catch (e) {
		return false
	}
}

export const createOrUpdateMirror = async (source: string, destination: string, dryRun?: boolean) => {
	const repoName = getRepoName(source)
	const repoOrg = getRepoOrg(source)
	const dest = path.join(destination, `${repoOrg}-${repoName}`)
	console.log(`creating mirror ${dest}`)
	try {
		await Deno.mkdir(dest)
	} catch (e) {
		if (e instanceof Deno.errors.AlreadyExists) {
			console.log(`mirror ${destination} already exists, updating`)
			const args1 = ['--git-dir', dest, 'remote', 'set-url', 'origin', source]
			await exec('git', args1, { dryRun })
			const args2 = ['--git-dir', dest, 'fetch', 'origin']
			await exec('git', args2, { dryRun })
			return dest
		}
	}
	const args = ['clone', '--progress', '--mirror', source, dest]
	await exec('git', args, { dryRun })
	return dest
}

export const cloneRepo = async (
	{
		source,
		destination,
		branch,
		useMirror = false,
		mirrorPath,
		dryRun = false,
	}: {
		source: string
		destination: string
		branch?: string
		useMirror: boolean
		mirrorPath?: string
		dryRun?: boolean
	},
) => {
	const cloneArgs = ['clone', '--progress']
	if (useMirror && mirrorPath) {
		// console.log(`using mirror ${mirrorPath}`)
		const referencePath = await createOrUpdateMirror(source, mirrorPath, dryRun)
		cloneArgs.push('--reference', referencePath)
	}
	if (branch) {
		cloneArgs.push('--branch', branch)
	}
	cloneArgs.push(source, destination)
	await exec('git', cloneArgs, { dryRun })
	return destination
}

export const runEngineSetup = async (
	{
		enginePath,
		gitDependsCache,
		excludes = ['FeaturePacks/', 'Templates/', 'Samples/'],
		dryRun = false,
	}: {
		enginePath: string
		gitDependsCache?: string
		excludes?: string[]
		dryRun?: boolean
	},
) => {
	const engine = createEngine(enginePath)
	const threads = 16
	const args = [`--threads=${threads.toString()}`]
	if (gitDependsCache) {
		args.push(`--cache=${gitDependsCache}`)
	}
	for (const exclude of excludes) {
		args.push(`--exclude=${exclude}`)
	}

	const deps = await exec(engine.getGitDependencesBin(), args, { cwd: enginePath, dryRun })

	await exec(engine.getGenerateScript(), [], { dryRun })
}

export const deleteEngineHooks = async (enginePath: string) => {
	const hooksPath = path.join(enginePath, '.git', 'hooks')
	await Deno.remove(hooksPath, { recursive: true }).catch(() => {})
}

/*
@deprecated - revist with alternative xml parser
export const getDepsList = async (enginePath: string) => {
	const ueDependenciesManifest = path.join(enginePath, '.uedependencies')
	const data = await Deno.readTextFile(ueDependenciesManifest)
	const { WorkingManifest: { Files: { File } } } = xml2js(data, { compact: true }) as unknown as UeDepsManifest
	return File.map(({ _attributes: { Name, Hash, ExpectedHash, Timestamp } }) => ({
		name: Name,
		hash: Hash,
		expectedHash: ExpectedHash,
		timestamp: Timestamp,
	}))
}
*/

export const getGitIgnoreList = (
	enginePath: string,
	relevantDirs: string[] = ['Engine/'],
) => {
	const { output = '' } = execSync('git', [
		'status',
		'--ignored',
		'-uall',
		'-s',
		...relevantDirs,
	], { cwd: enginePath, quiet: true })
	const items: GitIgnoreFiles = { files: [], dirs: [] }

	for (const item of output.split('\n')) {
		const parse = item.replace(/"|\?\? |!! /g, '')
		if (parse.endsWith('/')) {
			items.dirs.push(parse)
		} else {
			items.files.push(parse)
		}
	}
	return items
}

/*
Temporarily copy the scripts to the ${enginePath}/BuildGraph folder
BuildGraph expects scripts to be contained inside the engine folder
until we apply a patch to BuildGraph that allows external scripts
*/
export const copyBuildGraphScripts = async (enginePath: string, bgScriptPath: string) => {
	const engineBg = path.join(enginePath, 'BuildGraph')
	await Deno.mkdir(engineBg, { recursive: true })
	for await (const entry of Deno.readDir(path.dirname(bgScriptPath))) {
		if (path.extname(entry.name) === '.xml') {
			await Deno.copyFile(
				path.join(path.dirname(bgScriptPath), entry.name),
				path.join(engineBg, entry.name),
			)
		}
	}
	return path.join(engineBg, path.basename(bgScriptPath))
}

export const randomBuildkiteEmoji = () => {
	const emojis = [
		':mr-bones:',
		':heart_on_fire:',
		':skull_and_crossbones:',
		':partying_face:',
		':face_with_cowboy_hat:',
		':sunglasses:',
		':boom:',
		':imp:',
		':space_invader:',
		':alien:',
		':ghost:',
		':japanese_goblin:',
		':japanese_ogre:',
		':space_invader:',
		':skier:',
		':anatomical_heart:',
		':brain:',
		':genie:',
		':fairy:',
		':mage:',
		':astronaut:',
		':ninja:',
		':bone:',
		':shamrock:',
		':beetle:',
	]
	return emojis[Math.floor(Math.random() * emojis.length)]
}

export class DefaultMap<K, V> extends Map<K, V> {
	constructor(private defaultFn: (key: K) => V, entries?: readonly (readonly [K, V])[] | null) {
		super(entries)
	}

	override get(key: K): V {
		if (!super.has(key)) {
			super.set(key, this.defaultFn(key))
		}
		return super.get(key)!
	}
}

export const getRandomInt = (max: number) => Math.floor(Math.random() * max)

/**
 * Format a timestamp string to a human-readable date string.
 * @param {string} ISO timestamp string
 * @param {Intl.LocalesArgument} locale
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string} the formatted date string
 */
export function formatIsoTimestamp(
	ts: string,
	locale: Intl.LocalesArgument = 'en-CA',
	options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' },
): string {
	return new Intl.DateTimeFormat(locale, options).format(new Date(ts))
}

export const generateBlueprintHtml = (blueprint: string) => {
	const html = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	<meta charset="utf-8" />
	<title>UE Blueprint</title>
	<link rel="stylesheet" href="https://barsdeveloper.github.io/ueblueprint/dist/css/ueb-style.min.css">
	<style>
	body {
		margin: 0;
		padding: 0;
		--ueb-height: 100vh;
	}
	</style>
	</head>

	<body>
	<script type="module">
	import { Blueprint } from "https://barsdeveloper.github.io/ueblueprint/dist/ueblueprint.js"
	</script>
	<code>
	<ueb-blueprint>
		<template>
${blueprint}
		</template>
	</ueb-blueprint>
	</code>
	</body>
	</html>
`
	return html
}

export async function findFilesByExtension(
	rootDir: string,
	extension: string,
	recursive: boolean,
): Promise<string[]> {
	const files: string[] = []

	try {
		for await (const entry of Deno.readDir(rootDir)) {
			const checkPath = `${rootDir}/${entry.name}`

			if (entry.isDirectory && recursive) {
				const subFiles = await findFilesByExtension(checkPath, extension, recursive)
				files.push(...subFiles)
			} else if (entry.isFile && checkPath.endsWith(extension)) {
				files.push(checkPath)
			}
		}
	} catch (error) {
		console.error(`Error reading directory ${rootDir}:`, error)
	}

	return files
}

export async function parseCSForTargetType(filePath: string): Promise<{
	targetName: string | null
	targetType: string | null
}> {
	// Read the file
	const fileContent = await Deno.readTextFile(filePath)

	// Results object
	const result = {
		targetName: null as string | null,
		targetType: null as string | null,
	}

	// Find the class name using regex
	const classRegex = /class\s+(\S+)Target[\s:]/g
	let classMatch

	while ((classMatch = classRegex.exec(fileContent)) !== null) {
		result.targetName = classMatch[1]
		break // Get only the first class name
	}

	// Find variables named TargetType
	// This pattern looks for field declarations that have 'TargetType' as variable name
	const targetTypeRegex = /\s*TargetType\.(.+)\s*;/g
	let targetTypeMatch

	while ((targetTypeMatch = targetTypeRegex.exec(fileContent)) !== null) {
		result.targetType = targetTypeMatch[1]
		break
	}

	return result
}
