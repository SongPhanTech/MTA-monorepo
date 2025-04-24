import {
    generateSchemaTypes,
    generateReactQueryComponents,
} from '@openapi-codegen/typescript'
import { defineConfig } from '@openapi-codegen/cli'

export default defineConfig({
    daoTao: {
        from: {
            source: 'url',
            url: 'https://api.user.mta.swantech.vn/openapi',
        },
        outputDir: 'src/lib/api/dao-tao',
        to: async (context) => {
            const filenamePrefix = 'app'
            const { schemasFiles } = await generateSchemaTypes(context, {
                filenamePrefix,
            })
            await generateReactQueryComponents(context, {
                filenamePrefix,
                schemasFiles,
            })
        },
    },
    model: {
        from: {
            source: 'url',
            url: 'https://api.model.mta.swantech.vn/openapi',
        },
        outputDir: 'src/lib/api/model',
        to: async (context) => {
            const filenamePrefix = 'model'
            const { schemasFiles } = await generateSchemaTypes(context, {
                filenamePrefix,
            })
            await generateReactQueryComponents(context, {
                filenamePrefix,
                schemasFiles,
            })
        },
    },
})
