import type { defineConfig } from 'orval'

export default {
    sessionsZod: {
        input: './src/wso2is-apis/session-mgt-by-admin.yaml',
        output: {
            client: 'zod',
            target: './src/wso2is-apis/generated/zod/sessions.ts',
        },
    },
    sessions: {
        input: './src/wso2is-apis/session-mgt-by-admin.yaml',
        output: {
            client: 'fetch',
            target: './src/wso2is-apis/generated/sessions.ts',
            headers: true,
            override: {
                mutator: {
                    path: './src/wso2is-apis/custom-fetch.ts',
                    name: 'customFetch',
                },
            },
        },
    },
} as ReturnType<typeof defineConfig>
