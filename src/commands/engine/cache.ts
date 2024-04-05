import { Command, path } from '/deps.ts'
import { GlobalOptions } from '/index.ts'
import { exec, execSync, getDepsList, getGitIgnoreList } from '/lib/utils.ts'
import { CliOptions } from '/lib/types.ts'
import { config } from '/lib/config.ts'
import { Source } from '/lib/source.ts'

export type CacheOptions = typeof cache extends Command<any, any, infer Options, any, any> ? Options
	: never

export const cache = new Command<GlobalOptions>()
	.description('cache engine build')
	.option('--debug', 'debug', { default: false })
	.option('-c, --cache-path <cachePath:file>', 'cache directory', {
		required: true,
		default: 'E:\\RX\\.cache',
	})
	.option('-i, --ignorePdb', 'ignore pdb files', { default: false })
	.option('-z, --zstd', 'use zstd compression', { default: true })
	.action(
		async (options, ..._args) => {
			const { debug, cachePath, ignorePdb, zstd } = options as CacheOptions
			const { engine: { path: enginePath, repoType } } = config.get(options as CliOptions)

			const source = Source(enginePath, repoType)

			// initialize the cache dir
			await Deno.mkdir(cachePath, { recursive: true })

			// get the unreal .uedependencies files (ie GitDependencies.exe download)
			const uedepsFiles = new Set((await getDepsList(enginePath)).map(({ name }) => name))

			// get the currently ignored files in the working copy (Engine/)
			// TODO(source): migrate to Source
			const { files: ignoredFiles } = getGitIgnoreList(enginePath, [
				'Engine/Binaries',
				'Engine/Build',
				'Engine/Intermediate',
				'Engine/Plugins',
				'Engine/Source',
			])

			// filter to only the files that are not in the .uedependencies file
			const filesToCache = ignoredFiles
				.filter((file) => !uedepsFiles.has(file))
				.filter((file) => (ignorePdb ? !file.endsWith('.pdb') : true))

			const gitRevision = source.ref()

			if (debug) {
				await Promise.all([
					Deno.writeFile(
						path.join(cachePath, `${gitRevision}-ignored.txt`),
						new TextEncoder().encode(ignoredFiles.join('\n')),
					),
					Deno.writeFile(
						path.join(cachePath, `${gitRevision}-uedeps.txt`),
						new TextEncoder().encode(Array.from(uedepsFiles).join('\n')),
					),
				])
			}

			const manifestFile = path.join(cachePath, `${gitRevision}.txt`)
			const archiveFile = path.join(cachePath, `${gitRevision}.7z`)

			// write the cache files to a manifest file so we can pass to 7z and use for restoring
			await Deno.writeFile(
				manifestFile,
				new TextEncoder().encode(filesToCache.join('\n')),
			)

			// clear the previous archive if it exists
			await Deno.remove(archiveFile, { recursive: true }).catch(() => {})

			// archive the cache files
			if (zstd) {
				// zstd compression
				const cpuThreads = navigator.hardwareConcurrency ?? 8
				await exec('7z', [
					'a',
					'-mx0',
					'-m0=bcj',
					'-m0=zstd',
					`-mmt${cpuThreads}`,
					'-bsp1',
					`${archiveFile}`,
					`@${manifestFile}`,
				], { cwd: enginePath })
			} else {
				// default lzma2 compression
				await exec('7z', [
					'a',
					'-mx2',
					'-m0=bcj',
					'-m0=lzma2',
					`-mmt8`,
					'-bsp1',
					`${archiveFile}`,
					`@${manifestFile}`,
				], { cwd: enginePath })
			}
		},
	)
