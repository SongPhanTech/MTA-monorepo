import { defineConfig } from "@openapi-codegen/cli"
import { generateReactQueryComponents, generateSchemaTypes } from "@openapi-codegen/typescript"

export default defineConfig({
  common: {
    from: {
      source: "url",
      url: "https://mta.swantech.vn/api/model/openapi",
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
      url: "https://api.doc.chatbot.swantech.vn/openapi.json",
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
      url: "https://api.chat.chatbot.swantech.vn/openapi.json",
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
