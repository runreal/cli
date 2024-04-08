import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { render } from '../lib/template.ts'

Deno.test('template test', () => {
	const tmpl = '{"name": "${project.name}", "engine": "${engine.path}", "project": "${project.name}"}'
	const cfg = { project: { name: 'Deno' }, engine: { path: 'V8' } }

	const result = render(tmpl, cfg)
	assertEquals(result, '{"name": "Deno", "engine": "V8", "project": "Deno"}')
})

Deno.test('template test with default path placeholder when undefined ', () => {
	const tmpl = '{"name": "${project.name}", "engine": "${engine.path}", "project": "${project.path}"}'
	const cfg = { project: { name: 'Deno' }, engine: { path: 'V8' } }

	const result = render(tmpl, cfg)
	assertEquals(result, '{"name": "Deno", "engine": "V8", "project": "project.path"}')
})
