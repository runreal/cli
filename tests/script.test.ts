import { snapshotTest } from '@cliffy/testing'
import { script } from '../src/commands/script.ts'

await snapshotTest({
	name: 'should execute the command ',
	meta: import.meta,
	args: ['./tests/fixtures/hello-world.ts'],
	denoArgs: ['--allow-read', '--allow-env', '--allow-write', '--allow-run'],
	async fn() {
		await script.parse()
	},
})
