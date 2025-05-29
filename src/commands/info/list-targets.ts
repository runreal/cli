import { Command } from '@cliffy/command'
import { createProject } from '../../lib/project.ts'
import { createEngine } from '../../lib/engine.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { Config } from '../../lib/config.ts'

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
		const cfg = Config.instance().process(options)

		const engine = createEngine(cfg.engine.path)
		const engineTargets = await engine.parseEngineTargets()
		let projectTargets: string[] = []

		if (cfg.project.path) {
			const project = await createProject(cfg.engine.path, cfg.project.path)
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
