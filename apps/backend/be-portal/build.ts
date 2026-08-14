Bun.build({
  entrypoints: ["src/index.ts", "src/worker-data-sync.ts"],
  outdir: "dist",
  sourcemap: "linked",
  target: "bun",
  format: "esm",
})
