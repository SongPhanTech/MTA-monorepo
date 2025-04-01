Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    sourcemap: 'linked',
    external: ['@opentelemetry/exporter-trace-otlp-http'],
    bytecode: true,
    target: 'bun',
})
