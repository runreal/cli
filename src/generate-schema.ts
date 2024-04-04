import { zodToJsonSchema } from 'npm:zod-to-json-schema'

import { ConfigSchema } from '/lib/schema.ts'

const schema = zodToJsonSchema(ConfigSchema, {
	target: 'jsonSchema2019-09',
})

await Deno.writeTextFile('schema.json', JSON.stringify(schema, null, 2))
