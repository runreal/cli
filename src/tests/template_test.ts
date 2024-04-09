import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { render } from '../lib/template.ts'
import { RunrealConfig } from '../lib/types.ts'

Deno.test('template tests', () => {
	const tmpl =
		'{"name": "${project.name}", "engine": "${engine.path}\\BuildGraph\\Build.xml", "project": "${project.path}"}'
	const cfg = { project: { name: 'Deno' }, engine: { path: 'C:\\Program Files\\V8' } } as RunrealConfig

	const result = render([tmpl], cfg)
	assertEquals(result, [
		'{"name": "Deno", "engine": "C:\\Program Files\\V8\\BuildGraph\\Build.xml", "project": "project.path"}',
	])
})
