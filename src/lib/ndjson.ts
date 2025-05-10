import { TextLineStream } from '@std/streams/text-line-stream'
import { JsonParseStream, type JsonValue } from '@std/json'

const parse = async (file: string): Promise<JsonValue[]> => {
	using f = await Deno.open(file, { read: true })
	const readable = f.readable
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(new TextLineStream())
		.pipeThrough(new JsonParseStream())

	const data: JsonValue[] = []
	for await (const item of readable) {
		data.push(item as JsonValue)
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
