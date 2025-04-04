import { Command } from '../deps.ts'
import type { CliOptions, GlobalOptions } from '../lib/types.ts'

const url = Deno.env.get('RENDER_URL') || 'http://localhost:8787'

const blueprint = new Command<GlobalOptions>().description('Visualize your blueprint')
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
			if (!options.blueprint) {
				console.log('Input file path is required')
				return
			}
			const data = Deno.readFileSync(options.blueprint)
			const decoder = new TextDecoder('utf-8')
			const bluePrint = decoder.decode(data)
			if (!options.local) {
			// Send bluePrint to the server

				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ blueprint: bluePrint }),
				})
				const blob = await res.blob()

				Deno.writeFileSync('result.png', await blob.bytes())
			} else {
				const encoder = new TextEncoder()
				const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>UE Blueprint</title>
        <link rel="stylesheet" href="https://barsdeveloper.github.io/ueblueprint/dist/css/ueb-style.min.css">
        <style>
            body {
                margin: 0;
                padding: 0;
                --ueb-height: 100vh;
            }
        </style>
    </head>

    <body>
        <script type="module">
        import { Blueprint } from "https://barsdeveloper.github.io/ueblueprint/dist/ueblueprint.js"
        </script>
        <code>
            <ueb-blueprint>
                <template>
                ${bluePrint}
                </template>
            </ueb-blueprint>
        </code>
    </body>
    </html>
  `

				Deno.writeFileSync(options.output, encoder.encode(html))
			}
		},
	)

export const asset = new Command<GlobalOptions>().description("View uasset").action(function () {
		this.showHelp()
	}).command('blueprint', blueprint)
