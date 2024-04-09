import { assertEquals } from 'https://deno.land/std@0.221.0/assert/mod.ts'
import { Source } from './source.ts'

Deno.test('source', () => {
	const source = Source('cwd', 'git')
	assertEquals(source.executable, 'git')

	source.ref = () => 'branch/commit'
	assertEquals(source.safeRef(), 'branch-commit')
	source.ref = () => 'branch//commit'
	assertEquals(source.safeRef(), 'branch-commit')

	const psource = Source('cwd', 'perforce')
	assertEquals(psource.executable, 'p4')

	psource.ref = () => 'main/1'
	assertEquals(psource.safeRef(), 'main-1')
	psource.ref = () => 'main//1'
	assertEquals(psource.safeRef(), 'main-1')
})
