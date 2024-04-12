import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { Perforce, Source } from '../src/lib/source.ts'

Deno.test('source git', () => {
	const source = Source('cwd', 'git')
	assertEquals(source.executable, 'git')

	source.ref = () => 'branch/commit'
	assertEquals(source.safeRef(), 'branch-commit')

	source.ref = () => 'branch//commit'
	assertEquals(source.safeRef(), 'branch-commit')
})

Deno.test('source perforce - safeRef test', () => {
	const psource = Source('cwd', 'perforce')
	assertEquals(psource.executable, 'p4')

	psource.ref = () => 'main/1'
	assertEquals(psource.safeRef(), 'main-1')

	psource.ref = () => 'main//1'
	assertEquals(psource.safeRef(), 'main-1')

	psource.ref = () => '//main//1'
	assertEquals(psource.safeRef(), 'main-1')

	psource.ref = () => '//Main//1'
	assertEquals(psource.safeRef(), 'main-1')

	const psource2 = new Perforce('cwd')
	assertEquals(psource2.executable, 'p4')

	psource2.stream = () => '//Stream/Main'
	psource2.changelist = () => '50'
	assertEquals(psource2.safeRef(), 'stream-main-50')
})
