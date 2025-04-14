Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    sourcemap: 'linked',
    external: [],
    bytecode: true,
    target: 'bun',
})
