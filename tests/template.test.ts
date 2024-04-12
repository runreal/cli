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
		project: { name: 'Project', path: '/projects/project', repoType: 'git' },
		engine: { path: '/engines/5.1', repoType: 'git' },
		build: { id: '1234', path: '/builds/1234', branchSafe: 'main', commitShort: 'abcd' },
		buildkite: { buildNumber: '5678' },
	}
	const expected = {
		'engine.path': '/engines/5.1',
		'project.path': '/projects/project',
		'project.name': 'Project',
		'build.id': '1234',
		'build.path': '/builds/1234',
		'build.branch': 'main',
		'build.commit': 'abcd',
		'buildkite.buildNumber': '5678',
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
	const cfg: RunrealConfig = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git' },
		engine: { path: '/engines/5.1', repoType: 'git' },
		build: { id: '1234', path: '/builds/1234' },
	}
	const expected = [
		'Project uses /engines/5.1',
		'Build ID: 1234',
		'Non-existent: ${non.existent}',
	]
	const result = render(input, cfg)
	assertEquals(result, expected)
})

Deno.test('renderConfig should deeply replace all placeholders in config object', () => {
	const cfg: RunrealConfig = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git' },
		engine: { path: '/engines/5.0', repoType: 'git' },
		build: { id: '1234', path: '/builds/1234' },
		metadata: { test: '${build.id}-${project.name}' },
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
	const expected: RunrealConfig = {
		project: { name: 'Project', path: '/projects/project', repoType: 'git' },
		engine: { path: '/engines/5.0', repoType: 'git' },
		build: { id: '1234', path: '/builds/1234' },
		metadata: { test: '1234-Project' },
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
	const result = renderConfig(cfg)
	assertEquals(result, expected)
})
