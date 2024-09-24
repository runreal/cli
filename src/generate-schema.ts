import { zodToJsonSchema } from './deps.ts'

import { ConfigSchema } from './lib/schema.ts'

const schema = zodToJsonSchema(ConfigSchema, {
	target: 'jsonSchema7',
})

await Deno.writeTextFile('schema.json', JSON.stringify(schema, null, 2))
