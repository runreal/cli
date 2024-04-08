import { Command, ulid } from '../deps.ts'
import { config } from '../lib/config.ts'
import { GlobalOptions } from '../index.ts'
import { CliOptions } from '../lib/types.ts'
import { logger } from '../lib/logger.ts'

interface SessionMetadata {
	id: string
	startTime: number
	lastUpdated: number
}

interface ExecutionMetadata {
	command: string
	args: string
	timestamp?: number
	duration?: number
	user?: string
	error?: any
}

async function openKv() {
	try {
		const kv = await Deno.openKv()
		return kv
	} catch (e) {
		console.error('Failed to open key-value store:', e)
		throw e
	}
}

async function getOutput(kv: Deno.Kv, sessionId: string, commandId: string) {
	const result = await kv.get([sessionId, commandId])
	if (!result) return {}
	return result.value
}

async function getSessionOutputs(kv: Deno.Kv, sessionId: string) {
	const session = await kv.get<SessionMetadata>([sessionId])
	if (!session) return {}
	const output = { ...session.value, commands: {} as Record<string, any> }
	const results = await kv.list({ prefix: [sessionId] })
	for await (const entry of results) {
		const [_, commandId] = entry.key
		output.commands[commandId.toString()] = entry.value
	}
	return output
}

async function initializeSession(kv: Deno.Kv, sessionId: string) {
	const session = await kv.get<SessionMetadata>([sessionId])
	if (session) {
		// Update existing session
		await kv.set([sessionId], { ...session.value, lastUpdated: Date.now() })
	} else {
		// Create new session
		await kv.set([sessionId], { id: sessionId, startTime: Date.now(), lastUpdated: Date.now() })
	}
	return sessionId
}

async function init(kv: Deno.Kv, commandName: string, sessionId: string) {
	logger.setContext(commandName)
	logger.setSessionId(sessionId)
	await initializeSession(kv, sessionId)
	return { commandId: ulid() }
}

async function saveOutput(
	kv: Deno.Kv,
	commandName: string,
	rawArgs: string[],
	sessionId: string,
	commandId: string,
	output: Record<string, any>,
) {
	const metadata: ExecutionMetadata = {
		command: commandName,
		args: rawArgs.join(' '),
		timestamp: Date.now(),
	}
	await kv.set([sessionId, commandId], { output, metadata })
}

async function dummyWork() {
	const output = {
		foo: 'xyz',
		baz: 'abc',
		someval: ulid(),
	}
	return await Promise.resolve(output)
}

export type DebugOptions = typeof debug extends Command<any, any, infer Options, any, any> ? Options
	: never

export const debug = new Command<GlobalOptions>()
	.option('-d, --dry-run', 'Dry run')
	.option('-q, --quiet', 'Quiet')
	.option('--debug', 'Debug')
	.description('run')
	.action(async (options) => {
		const { dryRun, quiet, sessionId } = options as DebugOptions & GlobalOptions
		const cfg = config.get(options as CliOptions)

		console.log(cfg)
		await Promise.resolve(cfg)

		/*
		// initialize the command
		const kv = await openKv()
		const { commandId } = await init(kv, debug.getName(), sessionId)

		// dummy work
		const output = await dummyWork()

		// save to output to kv
		await saveOutput(kv, debug.getName(), debug.getRawArgs(), sessionId, commandId, output)

		// debug print the saved kv data
		if (options.debug) {
			const saved = await getOutput(kv, sessionId, commandId)
			logger.debug('------------ command ------------')
			logger.debug(saved)
			const session = await getSessionOutputs(kv, sessionId)
			logger.debug('------------ session ------------')
			logger.debug(session)
		}

		return await Promise.resolve(output)
		*/
	})
