import type { ScriptContext } from '../../src/lib/types.ts'

export async function main(ctx: ScriptContext) {
	console.log('hello from script')
	await ctx.lib.$`echo hello from dax`
}
