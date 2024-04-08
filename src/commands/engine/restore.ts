import { Command, path, ValidationError } from '../../deps.ts'

import { config } from '../../lib/config.ts'
import { GlobalOptions } from '../../index.ts'
import { CliOptions } from '../../lib/types.ts'
import { exec, execSync } from '../../lib/utils.ts'

export type RestoreOptions = typeof restore extends Command<any, any, infer Options, any, any> ? Options
	: never

export const restore = new Command<GlobalOptions>()
	.description('restore engine cached build')
	.option('-d, --debug', 'debug', { default: false })
	.option('-c, --cache-path <cachePath:file>', 'cache directory', {
		required: true,
		default: 'E:\\RX\\.cache',
	})
	.action(
		async (options, ..._args) => {
			const { debug, cachePath } = options as RestoreOptions
			const { engine: { path: enginePath } } = config.get(options as CliOptions)

			const gitRevision = await execSync('git', ['rev-parse', 'HEAD'], {
				cwd: enginePath,
				quiet: true,
			})

			const manifestPath = path.join(cachePath, `${gitRevision.output}.txt`)
			const manifestFile = await Deno.stat(manifestPath)
			const archivePath = path.join(cachePath, `${gitRevision.output}.7z`)
			const archiveFile = await Deno.stat(archivePath)
			if (!manifestFile.isFile || !archiveFile.isFile) {
				throw new ValidationError(`Cache for ${gitRevision} does not exist`)
			}

			// extract the cache file
			await exec('7z', ['x', '-aoa', '-y', '-bsp1', archivePath], { cwd: enginePath })

			// modify the timestamp of each file to prevent UBT from rebuilding
			const now = new Date()
			const cachedFiles = (await Deno.readTextFile(manifestPath)).split('\n')
			await Promise.all(cachedFiles.map((file) => {
				const filePath = path.join(enginePath, file)
				return Deno.utime(filePath, now, now)
			}))
		},
	)
