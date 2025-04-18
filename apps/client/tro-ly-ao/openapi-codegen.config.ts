import {
    generateSchemaTypes,
    generateReactQueryComponents,
} from '@openapi-codegen/typescript'
import { defineConfig } from '@openapi-codegen/cli'

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
