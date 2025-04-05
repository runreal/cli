import { Command } from '../../deps.ts'
import type { GlobalOptions } from '../../lib/types.ts'

import { parse } from './parse.ts'
import { renderBlueprint } from './render-blueprint.ts'
import { extractEventGraph } from './extract-eventgraph.ts'

export const uasset = new Command<GlobalOptions>()
	.description('uasset')
	.action(function () {
		this.showHelp()
	})
	.command('parse', parse)
	.command('render-blueprint', renderBlueprint)
	.command('extract-eventgraph', extractEventGraph)
