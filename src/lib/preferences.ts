import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { UserRunrealPreferencesSchema } from './schema.ts'
import { UserRunrealPreferences } from './types.ts'

const homeDir = os.homedir()
const preferencesPath = path.join(homeDir, '.runreal')
const preferencesFile = 'preferences.json'
const preferencesFullPath = path.join(preferencesPath, preferencesFile)

const get = async (): Promise<UserRunrealPreferences> => {
	let prefs: UserRunrealPreferences = {}
	try {
		const fileInfo = await fs.stat(preferencesFullPath)
		if (!fileInfo.isFile()) {
			return prefs
		}
		const file = await fs.readFile(preferencesFullPath, 'utf8')
		const parsed = JSON.parse(file)
		try {
			prefs = UserRunrealPreferencesSchema.parse(parsed)
		} catch (e) {
			console.error('Invalid preferences file:', e)
			return prefs
		}
	} catch (e) {
		console.error('Error reading preferences file:', e)
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			return prefs
		}
		throw e
	}

	return prefs
}

const set = async (prefs: UserRunrealPreferences): Promise<UserRunrealPreferences> => {
	try {
		const fileInfo = await fs.stat(preferencesFullPath)
		if (!fileInfo.isFile()) {
			await fs.mkdir(preferencesPath, { recursive: true })
		}
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			await fs.mkdir(preferencesPath, { recursive: true })
		} else {
			throw e
		}
	}

	const data = JSON.stringify(prefs, null, 2)
	await fs.writeFile(preferencesFullPath, data, 'utf8')

	return prefs
}

export const preferences = {
	get,
	set,
}
