import { Command } from '../../deps.ts'
import type { GlobalOptions } from '../../lib/types.ts'
import { generateBlueprintHtml } from '../../lib/utils.ts'

const url = Deno.env.get('RENDER_URL') || 'http://localhost:8787'

export const renderBlueprint = new Command<GlobalOptions>()
    .description('Render your blueprint')
	.option(
		'-b, --blueprint <file:string>',
		'Path to the input file',
		{ required: true },
	)
	.option('-o, --output <file:string>', 'Path to the output in local', {
		default: 'index.html',
	})
	.option('-l, --local', 'Local export', { default: true })
	.action(
		async (options) => {
			const data = Deno.readFileSync(options.blueprint)
			const decoder = new TextDecoder('utf-8')
			const blueprint = decoder.decode(data)
			if (!options.local) {
				// Send blueprint to the server
				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ blueprint }),
				})
				const blob = await res.blob()

				Deno.writeFileSync('result.png', await blob.bytes())
			} else {
				const encoder = new TextEncoder()
				const html = generateBlueprintHtml(blueprint)
				Deno.writeFileSync(options.output, encoder.encode(html))
			}
		},
	)
