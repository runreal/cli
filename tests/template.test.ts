import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { getSubstitutions, render, renderConfig } from '../src/lib/template.ts'
import { RunrealConfig } from '../src/lib/types.ts'

Deno.test('template tests', () => {
	const tmpl =
		'{"name": "${project.name}", "engine": "${engine.path}\\BuildGraph\\Build.xml", "project": "${project.path}"}'
	const cfg = { project: { name: 'Deno' }, engine: { path: 'C:\\Program Files\\V8' } } as RunrealConfig

	const result = render([tmpl], cfg)
	assertEquals(result, [
		'{"name": "Deno", "engine": "C:\\Program Files\\V8\\BuildGraph\\Build.xml", "project": "project.path"}',
	])
})

Deno.test('getSubstitutions should correctly extract values from config', () => {
	const cfg: RunrealConfig = {
		project: { name: 'Project', path: '/projects/project', buildPath: '/output/path', repoType: 'git' },
		engine: { path: '/engines/5.1', repoType: 'git' },
		build: { id: '1234' },
		buildkite: { buildNumber: '5678' },
		metadata: {
			safeRef: 'safeRef',
			git: {
				branch: 'longbranch',
				branchSafe: 'safebranch',
				commit: 'commit',
				commitShort: 'shortcommit',
			},
			perforce: { changelist: 'cl', stream: 'stream' },
		},
	}
	const expected = {
		'engine.path': '/engines/5.1',
		'project.path': '/projects/project',
		'project.name': 'Project',
		'project.buildPath': '/output/path',
		'build.path': '/output/path',
		'build.id': '1234',
		'buildkite.buildNumber': '5678',
		'metadata.safeRef': 'safeRef',
		'metadata.git.branch': 'safebranch',
		'metadata.git.commit': 'shortcommit',
		'metadata.perforce.changelist': 'cl',
		'metadata.perforce.stream': 'stream',
	}
	const result = getSubstitutions(cfg)
	assertEquals(result, expected)
})

Deno.test('render should replace placeholders with correct values', () => {
	const input = [
		'${project.name} uses ${engine.path}',
		'Build ID: ${build.id}',
		'Non-existent: ${non.existent}',
	]
	const cfg: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.1', repoType: 'git' },
		build: { id: '1234' },
	}
	const expected = [
		'Project uses /engines/5.1',
		'Build ID: 1234',
		'Non-existent: ${non.existent}',
	]
	const result = render(input, cfg as RunrealConfig)
	assertEquals(result, expected)
})

Deno.test('renderConfig should deeply replace all placeholders in config object', () => {
	const cfg: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.0', repoType: 'git' },
		build: { id: '1234' },
		workflows: [
			{
				name: 'compile',
				steps: [
					{
						command: 'build',
						args: [
							'${project.path}\\Build\\Build.xml',
							'-set:BuildId=${build.id}',
							'-set:ProjectName=${project.name}',
						],
					},
				],
			},
		],
	}
	const expected: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.0', repoType: 'git' },
		build: { id: '1234' },
		workflows: [
			{
				name: 'compile',
				steps: [
					{
						command: 'build',
						args: [
							'/projects/project\\Build\\Build.xml',
							'-set:BuildId=1234',
							'-set:ProjectName=Project',
						],
					},
				],
			},
		],
	}
	const result = renderConfig(cfg as RunrealConfig)
	assertEquals(result, expected)
})
