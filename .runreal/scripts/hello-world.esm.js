// tests/fixtures/hello-world.ts
async function main(ctx) {
  console.log("hello from script");
  await ctx.lib.$`echo hello from dax`;
}
export {
  main
};
