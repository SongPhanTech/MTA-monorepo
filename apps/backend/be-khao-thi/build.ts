Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  sourcemap: "linked",
  target: "bun",
  format: "esm",
})
