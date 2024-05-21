
export async function main(ctx: ScriptContext) {
  console.log(ctx.env)
  await ctx.lib.uploadArtifact()
}
