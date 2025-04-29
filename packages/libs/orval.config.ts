import { defineConfig } from 'orval'

export default defineConfig({
    user_api: {
        input: 'https://api.user.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/user.ts',
            schemas: './src/api/schemas',
            biome: true,
            override: {
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customUserFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    model_api: {
        input: 'https://api.model.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/model.ts',
            schemas: './src/api/schemas',
            biome: true,
            override: {
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customModelFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    training_api: {
        input: 'https://api.daotao.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/training.ts',
            schemas: './src/api/schemas',
            biome: true,
            override: {
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customTrainingFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
})
