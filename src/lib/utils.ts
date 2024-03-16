import { mergeReadableStreams, path, xml2js } from '/deps.ts'
import { createEngine, EngineConfiguration, EnginePlatform, EngineTarget } from '/lib/engine.ts'
import { GitIgnoreFiles, UeDepsManifest } from '/lib/types.ts'

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

export async function getHomeDir(): Promise<string> {
	// Check if the Deno permissions for environment access are granted
	if (await Deno.permissions.query({ name: 'env' })) {
		// Determine the home directory based on the operating system
		const homeDir = Deno.build.os === 'windows' ? Deno.env.get('USERPROFILE') : Deno.env.get('HOME')

		if (homeDir) {
			return homeDir
		} else {
			throw new Error('Could not determine the home directory.')
		}
	} else {
		throw new Error('Permission denied: Cannot access environment variables.')
	}
}

export function getHomeDirSync(): string {
	// Check if the Deno permissions for environment access are granted
	if (Deno.permissions.querySync({ name: 'env' })) {
		// Determine the home directory based on the operating system
		const homeDir = Deno.build.os === 'windows' ? Deno.env.get('USERPROFILE') : Deno.env.get('HOME')

		if (homeDir) {
			return homeDir
		} else {
			throw new Error('Could not determine the home directory.')
		}
	} else {
		throw new Error('Permission denied: Cannot access environment variables.')
	}
}

export async function createConfigDir(): Promise<string> {
	const homeDir = await getHomeDir()
	const configDir = `${homeDir}/.runreal`
	await Deno.mkdir(configDir, { recursive: true })
	return configDir
}

export function createConfigDirSync(): string {
	const homeDir = getHomeDirSync()
	const configDir = `${homeDir}/.runreal`
	Deno.mkdirSync(configDir, { recursive: true })
	return configDir
}

export async function readConfigFile(): Promise<Record<string, string>> {
	const configDir = await createConfigDir()
	const configFile = `${configDir}/config.json`
	try {
		const file = await Deno.readTextFile(configFile)
		return JSON.parse(file)
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			return {}
		} else {
			throw error
		}
	}
}

export async function writeConfigFile(config: Record<string, string>): Promise<void> {
	const configDir = await createConfigDir()
	const configFile = `${configDir}/config.json`
	const file = JSON.stringify(config, null, 2)
	await Deno.writeTextFile(configFile, file)
}

export async function updateConfigFile(config: Record<string, string>): Promise<void> {
	const currentConfig = await readConfigFile()
	await writeConfigFile({ ...currentConfig, ...config })
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
	const engine = await createEngine(enginePath)
	const threads = 16
	const args = [`--threads=${threads.toString()}`]
	if (gitDependsCache) {
		args.push(`--cache=${gitDependsCache}`)
	}
	excludes.forEach((exclude) => {
		args.push(`--exclude=${exclude}`)
	})
	const deps = await exec(engine.getGitDependencesBin(), args, { cwd: enginePath, dryRun })
}

export const deleteEngineHooks = async (enginePath: string) => {
	const hooksPath = path.join(enginePath, '.git', 'hooks')
	await Deno.remove(hooksPath, { recursive: true }).catch(() => {})
}

export const getGitDepsList = async (enginePath: string) => {
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
	output.split('\n').forEach((item) => {
		const parse = item.replace(/"|\?\? |!! /g, '')
		if (parse.endsWith('/')) {
			items.dirs.push(parse)
		} else {
			items.files.push(parse)
		}
	})
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

	get(key: K): V {
		if (!super.has(key)) {
			super.set(key, this.defaultFn(key))
		}
		return super.get(key)!
	}
}

export const getRandomInt = (max: number) => Math.floor(Math.random() * max)
