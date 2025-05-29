import { assertEquals } from '@std/assert'
import { getSubstitutions, normalizePaths, render, renderConfig } from '../src/lib/template.ts'
import type { RunrealConfig } from '../src/lib/types.ts'

Deno.test('template tests', () => {
	const tmpl =
		'{"name": "${project.name}", "engine": "${engine.path}\\BuildGraph\\Build.xml", "project": "${project.path}"}'
	const cfg = {
		project: { name: 'Deno', path: '', buildPath: '', repoType: 'git' },
		engine: { path: 'C:\\Program Files\\V8', gitBranch: 'main' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: '',
			git: { ref: '', branch: '', branchSafe: '', commit: '', commitShort: '' },
			perforce: { ref: '', stream: '', changelist: '' },
		},
		build: { id: '' },
		workflows: [],
	} as RunrealConfig

	const result = render([tmpl], cfg)
	assertEquals(result, [
		'{"name": "Deno", "engine": "C:\\Program Files\\V8\\BuildGraph\\Build.xml", "project": "project.path"}',
	])
})

Deno.test('getSubstitutions should correctly extract values from config', () => {
	const cfg: RunrealConfig = {
		project: { name: 'Project', path: '/projects/project', buildPath: '/output/path', repoType: 'git' },
		engine: { path: '/engines/5.1', gitBranch: 'main' },
		build: { id: '1234' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: 'safeRef',
			git: {
				ref: 'ref',
				branch: 'longbranch',
				branchSafe: 'safebranch',
				commit: 'commit',
				commitShort: 'shortcommit',
			},
			perforce: { ref: 'ref', changelist: 'cl', stream: 'stream' },
			buildkite: {
				branch: '',
				checkout: '',
				buildNumber: '5678',
				buildCheckoutPath: '',
				buildPipelineSlug: '',
			},
		},
		workflows: [],
	}
	const expected = {
		'engine.path': '/engines/5.1',
		'project.path': '/projects/project',
		'project.name': 'Project',
		'project.buildPath': '/output/path',
		'build.path': '/output/path',
		'build.id': '1234',
		'metadata.buildkite.buildNumber': '5678',
		'metadata.safeRef': 'safeRef',
		'metadata.git.branch': 'safebranch',
		'metadata.git.commit': 'shortcommit',
		'metadata.perforce.changelist': 'cl',
		'metadata.perforce.stream': 'stream',
		'metadata.ts': '2024-02-29T12:34:56Z',
		'metadata.date': '2024-02-29',
	}
	const result = getSubstitutions(cfg)
	assertEquals(result, expected)
})

Deno.test('render should replace placeholders with correct values', () => {
	const input = [
		'${project.name} uses ${engine.path}',
		'Build ID: ${build.id}',
		'Non-existent: ${non.existent}',
		'Timestamp: ${metadata.ts}',
		'Date: ${metadata.date}',
	]
	const cfg: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.1', gitBranch: 'main' },
		build: { id: '1234' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: '',
			git: { ref: '', branch: '', branchSafe: '', commit: '', commitShort: '' },
			perforce: { ref: '', stream: '', changelist: '' },
		},
		workflows: [],
	}
	const expected = [
		'Project uses /engines/5.1',
		'Build ID: 1234',
		'Non-existent: ${non.existent}',
		'Timestamp: 2024-02-29T12:34:56Z',
		'Date: 2024-02-29',
	]
	const result = render(input, cfg as RunrealConfig)
	assertEquals(result, expected)
})

Deno.test('renderConfig should deeply replace all placeholders in config object', () => {
	const cfg: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.0', gitBranch: 'main' },
		build: { id: '1234' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: '',
			git: { ref: '', branch: '', branchSafe: '', commit: '', commitShort: '' },
			perforce: { ref: '', stream: '', changelist: '' },
		},
		workflows: [
			{
				id: 'compile',
				name: 'compile',
				steps: [
					{
						command: 'build',
						args: [
							'${project.path}\\Build\\Build.xml',
							'-set:BuildId=${build.id}-${metadata.date}',
							'-set:ProjectName=${project.name}',
						],
					},
				],
			},
		],
	}
	const expected: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.0', gitBranch: 'main' },
		build: { id: '1234' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: '',
			git: { ref: '', branch: '', branchSafe: '', commit: '', commitShort: '' },
			perforce: { ref: '', stream: '', changelist: '' },
		},
		workflows: [
			{
				id: 'compile',
				name: 'compile',
				steps: [
					{
						command: 'build',
						args: [
							'/projects/project\\Build\\Build.xml',
							'-set:BuildId=1234-2024-02-29',
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

Deno.test('replace paths in template', () => {
	const cfg: Partial<RunrealConfig> = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git', buildPath: '/output/path' },
		engine: { path: '/engines/5.0', gitBranch: 'main' },
		build: { id: '1234' },
		metadata: {
			ts: '2024-02-29T12:34:56Z',
			safeRef: '',
			git: { ref: '', branch: '', branchSafe: '', commit: '', commitShort: '' },
			perforce: { ref: '', stream: '', changelist: '' },
		},
		workflows: [
			{
				id: 'compile',
				name: 'compile',
				steps: [
					{
						command: 'build',
						args: [
							'$path(${project.path}\\Build\\Build.xml)',
							'-set:BuildId=${build.id}',
							'-set:ProjectName=${project.name}',
						],
					},
				],
			},
		],
	}

	const result = normalizePaths(renderConfig(cfg as RunrealConfig))

	assertEquals(result.workflows[0].steps[0].args[0], '/projects/project/Build/Build.xml')
})
