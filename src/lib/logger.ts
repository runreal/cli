import * as util from 'node:util'
import ansis from 'npm:ansis'
import { DefaultMap, getRandomInt } from './utils.ts'

export enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	ERROR = 'ERROR',
}

interface Rgb {
	r: number
	g: number
	b: number
}

const randomRgb24 = (): Rgb => ({
	r: getRandomInt(256),
	g: getRandomInt(256),
	b: getRandomInt(256),
})

const randomStrColors = new DefaultMap<string, Rgb>(randomRgb24)

const randomColorForStr = (str: string): Rgb => {
	return randomStrColors.get(str)
}

class Logger {
	private commandContext = null as string | null
	private sessionId = null as string | null
	private logToFile = true
	private logLevel = LogLevel.DEBUG
	// private logDir = createConfigDirSync()
	private writeQueue: Promise<void>[] = []

	setContext(context: string) {
		this.commandContext = context
	}

	setSessionId(id: string) {
		this.sessionId = id
	}

	enableFileLogging(enable: boolean) {
		this.logToFile = enable
	}

	setLogLevel(level: LogLevel) {
		this.logLevel = level
	}

	private formatMessage(level: LogLevel, message: string): string {
		const timestamp = new Date().toISOString()
		const messageStr = typeof message === 'object' ? `\n${util.inspect(message, { colors: true })}` : message
		let levelStr: string
		switch (level) {
			case LogLevel.INFO:
				levelStr = ansis.bold.green(level)
				break
			case LogLevel.ERROR:
				levelStr = ansis.bold.red(level)
				break
			case LogLevel.DEBUG:
				levelStr = ansis.bold.yellow(level)
				break
			default:
				levelStr = level
		}
		let str = `[${timestamp}] [${levelStr}]`
		if (this.commandContext) {
			const color = randomColorForStr(this.commandContext)
			str += ` [${ansis.rgb(color.r, color.g, color.b)(this.commandContext.toUpperCase())}]`
		}
		str += ` ${messageStr}`
		return str
	}

	private writeToFile(message: string) {
		if (this.logToFile && this.sessionId) {
			// const file = `${this.logDir}/${this.sessionId}.log`
			// const msg = `${fmt.stripAnsiCode(message)}\n`
			// const p = Deno.writeTextFile(file, msg, { append: true }).catch((e) => {})
			// this.writeQueue.push(p)
		}
	}

	async drainWriteQueue(): Promise<void> {
		await Promise.all(this.writeQueue)
		this.writeQueue = []
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel
	}

	info(message: string) {
		if (!this.shouldLog(LogLevel.INFO)) return
		const formatted = this.formatMessage(LogLevel.INFO, message)
		console.log(formatted)
		this.writeToFile(formatted)
	}

	error(message: string) {
		if (!this.shouldLog(LogLevel.ERROR)) return
		const formatted = this.formatMessage(LogLevel.ERROR, message)
		console.error(formatted)
		this.writeToFile(formatted)
	}

	debug(message: string) {
		if (!this.shouldLog(LogLevel.DEBUG)) return
		const formatted = this.formatMessage(LogLevel.DEBUG, message)
		console.log(formatted)
		this.writeToFile(formatted)
	}
}

export const logger = new Logger()

// Before the program exits, ensure all logs are written to the file.
process.on('SIGINT', async () => {
	await logger.drainWriteQueue()
	process.exit()
})
