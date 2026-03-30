import { defineConfig } from "@openapi-codegen/cli"
import { generateReactQueryComponents, generateSchemaTypes } from "@openapi-codegen/typescript"

export default defineConfig({
  common: {
    from: {
      source: "url",
      url: "https://api.model.mta.swantech.vn/openapi",
    },
    outputDir: "src/lib/api/common",
    to: async (context) => {
      const filenamePrefix = "common"
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      })
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      })
    },
  },
  qa: {
    from: {
      source: "url",
      url: "http://14.224.217.69:8010/openapi.json",
    },
    outputDir: "src/lib/api/qa",
    to: async (context) => {
      const filenamePrefix = "qa"
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      })
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      })
    },
  },
  chat: {
    from: {
      source: "url",
      url: "http://14.224.217.69:8011/openapi.json",
    },
    outputDir: "src/lib/api/chat",
    to: async (context) => {
      const filenamePrefix = "chat"
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
