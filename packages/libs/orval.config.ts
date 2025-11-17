import { defineConfig } from 'orval'

export default defineConfig({
    model_api: {
        input: 'https://api.model.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/model.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
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
            packageJson: 'fake',
            override: {
                query: { version: 5 },
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
    ems_api: {
        input: 'https://api.khaothi.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/exam.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customExamFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    portal_api: {
        // input: 'http://localhost:3002/openapi',
        input: 'https://api.portal.mta.swantech.vn/openapi',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/portal.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customPortalFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    system_api: {
        input: 'https://mta.swantech.vn/api/system/public/swagger/v1/swagger.json',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/system.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customSystemFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    system_share_api: {
        input: 'https://mta.swantech.vn/api/system/share/swagger/v1/swagger.json',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/system-share.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customSystemShareFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
    storage_api: {
        input: 'https://mta.swantech.vn/api/system/storage/swagger/v1/swagger.json',
        output: {
            client: 'react-query',
            httpClient: 'fetch',
            mode: 'single',
            target: './src/api/storage.ts',
            schemas: './src/api/schemas',
            biome: true,
            packageJson: 'fake',
            override: {
                query: { version: 5 },
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customStorageFetch',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'biome check --fix --unsafe .',
        },
    },
})
