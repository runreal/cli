import * as fs from 'node:fs'
import * as readline from 'node:readline'

const parse = async (file: string): Promise<any[]> => {
	const fileStream = fs.createReadStream(file)
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	})

	const data: any[] = []
	for await (const line of rl) {
		if (line.trim()) {
			data.push(JSON.parse(line))
		}
	}
	return data
}

const safeParse = async <T>(file: string, fallback: T): Promise<T> => {
	try {
		return await parse(file) as T
	} catch (e) {
		return fallback
	}
}

export { parse, safeParse }
