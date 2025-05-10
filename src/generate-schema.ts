import { z } from 'zod'
import { UserConfigSchemaForJsonSchema } from './lib/schema.ts'

const schema = z.toJSONSchema(UserConfigSchemaForJsonSchema, { target: 'draft-7' })

await Deno.writeTextFile('schema.json', JSON.stringify(schema, null, 2))
