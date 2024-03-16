import { Command, EnumType, ValidationError } from '/deps.ts'
import { config } from '/lib/config.ts'
import { cmd, GlobalOptions } from '/index.ts'
import { CliOptions, RunrealConfig } from '/lib/types.ts'
import { exec as execCmd, randomBuildkiteEmoji } from '/lib/utils.ts'

export type ExecOptions = typeof exec extends Command<any, any, infer Options, any, any> ? Options
	: never

// Object containing the allowed substitutions
const getSubstitutions = (cfg: RunrealConfig) => ({
	'engine.path': cfg.engine.path,
	'project.path': cfg.project.path,
	'project.name': cfg.project.name,
	'build.id': cfg.build.id,
	'build.path': cfg.build.path,
	'build.branch': cfg.build.branchSafe,
	'build.commit': cfg.build.commitShort,
	'buildkite.buildNumber': cfg.buildkite.buildNumber,
})

// This helper function will take a command string with placeholders and a substitutions object
// It will replace all placeholders in the command with their corresponding values
// If the key is not found in substitutions, keep the original placeholder
function interpolateCommand(input: string[], substitutions: Record<string, string>) {
	// This regular expression matches all occurrences of ${placeholder}
	const placeholderRegex = /\$\{([^}]+)\}/g
	return input.map((arg) =>
		arg.replace(placeholderRegex, (_, key) => {
			return key in substitutions ? substitutions[key] : _
		})
	)
}

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
			await execCmd(baseCmd, [...step.command.split(' ').slice(1), ...step.args])
		}
	} catch (e) {
		console.log(`[error] failed to exec :runreal ${step.command} ${step.args.join(' ')}: => ${e.message}`)
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

export const exec = new Command<GlobalOptions>()
	.option('-d, --dry-run', 'Dry run')
	.type('mode', new EnumType(Mode))
	.option('-m, --mode <mode:mode>', 'Execution mode', { default: Mode.Local })
	.description('run')
	.arguments('<workflow>')
	.action(async (options, workflow) => {
		const { dryRun, mode } = options as ExecOptions
		const cfg = config.get(options as CliOptions) as any

		const run = cfg.workflows.find((w: any) => w.name === workflow)
		if (!run) {
			throw new ValidationError(`Workflow ${workflow} not found`)
		}

		const steps = []
		for await (const step of run.steps) {
			const command = interpolateCommand([step.command], getSubstitutions(cfg))[0]
			const args = interpolateCommand(step.args || [], getSubstitutions(cfg))
			steps.push({ command, args })
		}

		if (dryRun) {
			steps.forEach((step) => {
				console.log(`[workflow] exec => ${step.command} ${step.args.join(' ')}`)
			})
			return
		}

		// Stop cliffy for exiting the process after running single command
		cmd.noExit()

		if (mode === Mode.Local) {
			await localExecutor(steps).catch((e) => Deno.exit(1))
		} else if (mode === Mode.Buildkite) {
			await buildkiteExecutor(steps).catch((e) => Deno.exit(1))
		}
	})
