import { UserRunrealConfigSchema } from './schema.ts'
import { UserRunrealConfig } from './types.ts'

const homeDir = Deno.env.get('HOME')
const preferencesPath = `${homeDir}/.runreal/`
const preferencesFile = 'preferences.json'
const preferencesFullPath = `${preferencesPath}${preferencesFile}`

const get = async (): Promise<UserRunrealConfig> => {
	let prefs: UserRunrealConfig = {}
	try {
		const fileInfo = await Deno.stat(preferencesFullPath)
		if (!fileInfo.isFile) {
			return prefs
		}
		const file = await Deno.readTextFile(preferencesFullPath)
		const parsed = JSON.parse(file)
		try {
			prefs = UserRunrealConfigSchema.parse(parsed)
		} catch (e) {
			console.error('Invalid preferences file:', e)
			return prefs
		}
	} catch (e) {
		console.error('Error reading preferences file:', e)
		if (e instanceof Deno.errors.NotFound) {
			return prefs
		}
		throw e
	}

	return prefs
}

const set = async (prefs: UserRunrealConfig): Promise<UserRunrealConfig> => {
	try {
		const fileInfo = await Deno.stat(preferencesFullPath)
		if (!fileInfo.isFile) {
			await Deno.mkdir(preferencesPath, { recursive: true })
		}
	} catch (e) {
		if (e instanceof Deno.errors.NotFound) {
			await Deno.mkdir(preferencesPath, { recursive: true })
		} else {
			throw e
		}
	}

	const data = JSON.stringify(prefs, null, 2)
	await Deno.writeTextFile(preferencesFullPath, data)

	return prefs
}

export const preferences = {
	get,
	set,
}
