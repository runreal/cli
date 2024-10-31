import { assertEquals } from '@std/assert'
import { returnsNext, stub } from '@std/testing/mock'
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
	using _clientStub = stub(Perforce.prototype, 'getClientName', returnsNext(['pclient', 'sclient']))
	using _changeStub = stub(Perforce.prototype, 'changelist', returnsNext(['5034', '5035', '5036']))
	using _streamStub = stub(Perforce.prototype, 'stream', returnsNext(['//Stream/Main', '//Stream/Main2']))

	const psource = new Perforce('cwd')
	assertEquals(psource.safeRef(), '5034')
	assertEquals(psource.safeFullRef(), 'stream-main-5035')

	const psource2 = Source('cwd', 'perforce')
	assertEquals(psource2.safeRef(), '5036')
})
