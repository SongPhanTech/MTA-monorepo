import { defineConfig } from '@openapi-codegen/cli'
import {
    generateFetchers,
    generateSchemaTypes,
} from '@openapi-codegen/typescript'
export default defineConfig({
    sessionMgt: {
        from: {
            relativePath: './src/wso2is-apis/session-mgt-by-admin.yaml',
            source: 'file',
        },
        outputDir: './src/wso2is-apis/generated',
        to: async (context) => {
            const filenamePrefix = 'session'
            const { schemasFiles } = await generateSchemaTypes(context, {
                filenamePrefix,
            })
            await generateFetchers(context, {
                filenamePrefix,
                schemasFiles,
            })
        },
    },
    scim2Users: {
        from: {
            relativePath: './src/wso2is-apis/scim2-users.yaml',
            source: 'file',
        },
        outputDir: './src/wso2is-apis/generated',
        to: async (context) => {
            const filenamePrefix = 'users'
            const { schemasFiles } = await generateSchemaTypes(context, {
                filenamePrefix,
            })
            await generateFetchers(context, {
                filenamePrefix,
                schemasFiles,
            })
        },
    },
})
