import { Command } from '@cliffy/command'
import { customAlphabet } from 'nanoid'
import { colors } from '@cliffy/ansi/colors'
import type { GlobalOptions } from '../lib/types.ts'
import { preferences } from '../lib/preferences.ts'

// base58 uppercase characters
const idgen = customAlphabet('123456789ABCDEFGHJKMNPQRSTUVWXYZ', 6)

const RUNREAL_API_ENDPOINT = Deno.env.get('RUNREAL_API_ENDPOINT') || 'https://api.dashboard.runreal.dev/v1'
const RUNREAL_AUTH_ENDPOINT = Deno.env.get('RUNREAL_AUTH_ENDPOINT') || 'https://auth.runreal.dev'

export const auth = new Command<GlobalOptions>()
	.description('auth')
	.arguments('<command> [args...]')
	.stopEarly()
	.action(async (options, command, ...args) => {
		if (command === 'login') {
			const code = idgen(6)
			const hostname = Deno.hostname().replace(/[^a-z0-9A-Z-_\.]/, '')

			const link = `${RUNREAL_AUTH_ENDPOINT}/auth/cli?hostname=${hostname}&code=${code}`

			console.log(`Login code: ${colors.bold.green(code)}`)
			console.log(`Please open ${colors.bold.cyan(link)} to authorize.`)

			let count = 0
			const interval = setInterval(async () => {
				if (count > 20) {
					clearInterval(interval)
					console.log(colors.red('Authentication timed out.'))
					shutdown()
					return
				}

				await fetch(`${RUNREAL_API_ENDPOINT}/cli`, {
					method: 'POST',
					body: JSON.stringify({
						hostname,
						code,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then(async (res) => {
					if (res.status === 200) {
						clearInterval(interval)
						const body = await res.json()

						await preferences.set({
							accessToken: body.token,
						})
						console.log(colors.bold.cyan('Authenticated successfully!'))
						shutdown()
					}
				}).catch((err) => {
					console.log(err)
					// ignore error
				})
				count++
			}, 5000)

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

function shutdown() {
	setTimeout(() => {
		Deno.exit(0)
	}, 500)
}
