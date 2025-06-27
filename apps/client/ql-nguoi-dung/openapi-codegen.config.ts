import { defineConfig } from '@openapi-codegen/cli'
import { generateReactQueryComponents, generateSchemaTypes } from '@openapi-codegen/typescript'

export default defineConfig({
    app: {
        from: {
            source: 'url',
            url: 'https://api.user.mta.swantech.vn/openapi',
        },
        outputDir: 'src/lib/api/open-api',
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
})
