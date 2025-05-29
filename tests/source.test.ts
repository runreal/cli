import { assertEquals } from '@std/assert'
import { returnsNext, stub } from '@std/testing/mock'
import { Git, Perforce, Source } from '../src/lib/source.ts'
import { assert } from '@std/assert'

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
	using _isValidStub = stub(
		Perforce.prototype,
		'isValidRepo',
		returnsNext([true, true, true, true, true, true, true, true]),
	)

	const psource = new Perforce('cwd')
	assertEquals(psource.safeRef(), '5034')
	assertEquals(psource.safeFullRef(), 'stream-main-5035')

	const psource2 = Source('cwd', 'perforce')
	assertEquals(psource2.safeRef(), '5036')
})

Deno.test('source should handle non-existent directories gracefully', () => {
	const nonExistentPath = '/this/path/does/not/exist'

	// Test Git with non-existent directory
	const gitSource = new Git(nonExistentPath)
	assertEquals(gitSource.isValidRepo(), false)
	assertEquals(gitSource.safeRef(), '')
	assertEquals(gitSource.ref(), '')
	assertEquals(gitSource.branch(), '')
	assertEquals(gitSource.commit(), '')
	assertEquals(gitSource.commitShort(), '')

	const gitData = gitSource.data()
	assertEquals(gitData.ref, '')
	assertEquals(gitData.branch, '')
	assertEquals(gitData.branchSafe, '')
	assertEquals(gitData.commit, '')
	assertEquals(gitData.commitShort, '')

	// Test Perforce with non-existent directory
	const perfSource = new Perforce(nonExistentPath)
	assertEquals(perfSource.isValidRepo(), false)
	assertEquals(perfSource.safeRef(), '')
	assertEquals(perfSource.ref(), '')
	assertEquals(perfSource.changelist(), '')
	assertEquals(perfSource.stream(), '')

	const perfData = perfSource.data()
	assertEquals(perfData.ref, '')
	assertEquals(perfData.changelist, '')
	assertEquals(perfData.stream, '')
})

// TODO: This test is flaky on Buildkite, so we're ignoring it for now
Deno.test.ignore('source should work with explicit current directory', () => {
	const currentDir = Deno.cwd()

	// Test Git with explicit current directory
	const gitSource = new Git(currentDir)
	assertEquals(gitSource.isValidRepo(), true) // Should be true since we're in a git repo

	// Should return actual git data since we're in a valid git repository
	const gitData = gitSource.data()
	// We can't assert exact values since they depend on the actual git state,
	// but we can verify the structure exists and some fields are populated
	assert(typeof gitData.ref === 'string')
	assert(typeof gitData.branch === 'string')
	assert(typeof gitData.commit === 'string')
	assert(typeof gitData.commitShort === 'string')
})
