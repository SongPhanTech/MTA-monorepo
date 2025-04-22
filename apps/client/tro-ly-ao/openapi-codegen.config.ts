import { defineConfig } from '@openapi-codegen/cli'
import {
    generateReactQueryComponents,
    generateSchemaTypes,
} from '@openapi-codegen/typescript'

export default defineConfig({
    common: {
        from: {
            source: 'url',
            url: 'http://localhost:3000/openapi',
        },
        outputDir: 'src/lib/api/common',
        to: async (context) => {
            const filenamePrefix = 'common'
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
