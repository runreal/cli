import { snapshotTest } from '@cliffy/testing'
import { script } from '../src/commands/script.ts'
import { Config } from '../src/lib/config.ts'

await snapshotTest({
	name: 'should execute the command',
	meta: import.meta,
	args: ['tests/fixtures/hello-world.ts'],
	denoArgs: ['-A'],
	async fn() {
		await Config.initialize({ path: './tests/fixtures/minimal.config.json' })
		await script.parse()
	},
})
