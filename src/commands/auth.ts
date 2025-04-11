import { Command } from '@cliffy/command'
import { customAlphabet } from 'nanoid'
import { colors } from '@cliffy/ansi/colors'
import type { GlobalOptions } from '../lib/types.ts'
import { preferences } from '../lib/preferences.ts'

// base58 uppercase characters
const idgen = customAlphabet('123456789ABCDEFGHJKMNPQRSTUVWXYZ', 6)

const RUNREAL_AUTH_ENDPOINT = Deno.env.get('RUNREAL_AUTH_ENDPOINT') || 'https://auth.runreal.dev'

let _server: any = null
let _code: string | null = null
export const auth = new Command<GlobalOptions>()
	.description('auth')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		if (command === 'login') {
			_code = idgen(6)
			const hostname = Deno.hostname().replace(/[^a-z0-9A-Z-_\.]/, '')

			let port = 56833
			for (let i = 0; i < 10; i++) {
				try {
					_server = Deno.serve({ port, onListen: () => {} }, handler)
					break
				} catch (e) {
					port++
					if (i === 9) {
						console.error(colors.red('Unable to start server. Please try again.'))
						Deno.exit(1)
					}
				}
			}

			const link = `${RUNREAL_AUTH_ENDPOINT}/auth/cli?port=${port}&hostname=${hostname}&code=${_code}`

			console.log(`Login code: ${colors.bold.green(_code)}`)
			console.log(`Please open ${colors.bold.cyan(link)} to authorize.`)
			return
		}

		if (command === 'logout') {
			const prefs = await preferences.get()
			if (prefs.accessToken) {
				delete prefs.accessToken
				await preferences.set(prefs)
				console.log(colors.bold.cyan('Logged out successfully!'))
			} else {
				console.log(colors.red('You are not logged in.'))
			}
			return
		}

		throw new Error('Invalid command. Use "login" or "logout".')
	})

async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url)
	const headers = new Headers()

	headers.append('Access-Control-Allow-Origin', RUNREAL_AUTH_ENDPOINT)
	headers.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	headers.append('Access-Control-Allow-Headers', 'Content-Type')

	if (url.pathname !== '/auth/callback') {
		return new Response('Not found', { status: 404, headers })
	}
	if (req.method === 'OPTIONS') {
		return new Response('OK', { status: 200, headers })
	}

	try {
		const body = await req.json()
		if (!body.access_token || body.code !== _code) {
			console.log(colors.red('Unable to authenticate. Please try again.'))
			shutdown()
			return new Response('Invalid request', { status: 400, headers })
		}

		await preferences.set({
			accessToken: body.access_token,
		})
	} catch (e) {
		console.log(colors.red('Unable to authenticate. Please try again.'))
		shutdown()
		return new Response('Invalid request', { status: 400, headers })
	}

	console.log(colors.bold.cyan('Authenticated successfully!'))
	shutdown()
	return new Response('OK', { status: 200, headers })
}

function shutdown() {
	setTimeout(() => {
		Deno.exit(0)
	}, 500)
}
