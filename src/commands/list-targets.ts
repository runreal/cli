import { Command } from '@cliffy/command'
import { createProject } from '../lib/project.ts'
import { createEngine } from '../lib/engine.ts'
import type { GlobalOptions } from '../lib/types.ts'
import { Config } from '../lib/config.ts'

export type ListTargetsOptions = typeof listTargets extends
	Command<void, void, infer Options, infer Argument, GlobalOptions> ? Options
	: never

const logTargets = (targets: string[]) => {
	return targets.map((target) => {
		console.log(target)
	})
}

export const listTargets = new Command<GlobalOptions>()
	.description('list-targets')
	.option('-e, --engine-only', 'list only engine targets')
	.option('-p, --project-only', 'list only project targets', { conflicts: ['engine-only'] })
	.action(async (options) => {
		const { engineOnly, projectOnly } = options as ListTargetsOptions
		const config = Config.getInstance()
		const { engine: { path: enginePath }, project: { path: projectPath } } = config.mergeConfigCLIConfig({
			cliOptions: options,
		})

		const engine = createEngine(enginePath)
		const engineTargets = await engine.parseEngineTargets()
		let projectTargets: string[] = []

		if (projectPath) {
			const project = await createProject(enginePath, projectPath)
			projectTargets = (await project.parseProjectTargets()).filter((target) => !engineTargets.includes(target))
		}

		if (engineOnly) {
			return logTargets(engineTargets)
		}

		if (projectOnly) {
			return logTargets(projectTargets)
		}

		const targets = Array.from(new Set([...engineTargets, ...projectTargets]))
		return logTargets(targets)
	})
