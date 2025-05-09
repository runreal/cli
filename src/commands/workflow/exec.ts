import { Command, EnumType, ValidationError } from '@cliffy/command'
import { Config } from '../../lib/config.ts'
import { cmd } from '../../cmd.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { exec as execCmd, randomBuildkiteEmoji } from '../../lib/utils.ts'
import { render } from '../../lib/template.ts'

export type ExecOptions = typeof exec extends Command<void, void, infer Options, infer Argument, GlobalOptions>
	? Options
	: never

enum Mode {
	Local = 'local',
	Buildkite = 'buildkite',
}

async function executeCommand(step: { command: string; args: string[] }) {
	const isRunrealCmd = step.command.startsWith('runreal')
	try {
		if (isRunrealCmd) {
			const baseCmd = step.command.split(' ').slice(1)
			await cmd.parse([...baseCmd, ...step.args])
		} else {
			const baseCmd = step.command.split(' ').shift() || ''
			const { success, code } = await execCmd(baseCmd, [...step.command.split(' ').slice(1), ...step.args])
			if (!success) {
				throw new Error(`Command failed with code ${code}`)
			}
		}
	} catch (e) {
		if (e instanceof Error) {
			console.log(`[error] failed to exec :runreal ${step.command} ${step.args.join(' ')}: => ${e.message}`)
		}
		throw e
	}
}

async function localExecutor(steps: { command: string; args: string[] }[]) {
	for await (const step of steps) {
		console.log(`[workflow] exec => ${step.command} ${step.args.join(' ')}`)
		await executeCommand(step)
	}
}

async function buildkiteExecutor(steps: { command: string; args: string[] }[]) {
	for await (const step of steps) {
		console.log(`--- ${randomBuildkiteEmoji()} ${step.command} ${step.args.join(' ')}`)
		await executeCommand(step)
	}
}

function evaluateCondition(condition?: string): boolean {
	if (!condition) return true

	try {
		// Environment variable checks: ${env('NAME=VALUE')}
		const envRegex = /\${env\('([^']+)'\)}/
		const envMatch = condition.match(envRegex)

		if (envMatch) {
			const envVar = envMatch[1]
			const [name, expectedValue] = envVar.split('=')
			const value = Deno.env.get(name)

			if (expectedValue) {
				return value === expectedValue
			}

			return value === 'true' || value === '1' || value === 'yes'
		}

		// Support for direct boolean values or string "true"/"false"
		if (condition === 'true') return true
		if (condition === 'false') return false

		return false
	} catch (error) {
		console.log(`[workflow] error evaluating condition "${condition}":`, error)
		return false
	}
}

export const exec = new Command<GlobalOptions>()
	.option('-d, --dry-run', 'Dry run')
	.type('mode', new EnumType(Mode))
	.option('-m, --mode <mode:mode>', 'Execution mode', { default: Mode.Local })
	.description('run')
	.arguments('<workflow>')
	.action(async (options, workflow) => {
		const { dryRun, mode } = options
		const config = Config.getInstance()
		const cfg = config.mergeConfigCLIConfig({ cliOptions: options })

		if (!cfg.workflows) {
			throw new ValidationError('No workflows defined in config')
		}

		const run = cfg.workflows.find((w) => w.id === workflow || w.name === workflow)
		if (!run) {
			throw new ValidationError(`Workflow ${workflow} not found`)
		}

		const steps: { command: string; args: string[]; condition?: string }[] = []
		for await (const step of run.steps) {
			const command = render(step.command, cfg)
			const args = step.args ? step.args.map((arg) => render(arg, cfg)) : []
			steps.push({ command, args, condition: step.condition })
		}

		if (dryRun) {
			for (const step of steps) {
				console.log(`[workflow] exec => ${step.command} ${step.args.join(' ')}`)
			}
			return
		}

		// Stop cliffy for exiting the process after running single command
		cmd.noExit()

		// Filter steps based on conditions
		const filteredSteps = []
		for (const step of steps) {
			if (evaluateCondition(step.condition)) {
				filteredSteps.push(step)
			} else {
				console.log(`[workflow] skipping step due to condition: ${step.command} ${step.args.join(' ')}`)
			}
		}

		if (mode === Mode.Local) {
			await localExecutor(filteredSteps).catch((e) => Deno.exit(1))
		} else if (mode === Mode.Buildkite) {
			await buildkiteExecutor(filteredSteps).catch((e) => Deno.exit(1))
		}
	})
