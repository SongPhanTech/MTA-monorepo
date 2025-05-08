import type { defineConfig } from "orval";

export default {
  sessionsZod: {
    input: "./src/wso2is-apis/session-mgt-by-admin.yaml",
    output: {
      client: "zod",
      target: "./src/wso2is-apis/generated/zod/sessions.ts",
    },
  },
  sessions: {
    input: "./src/wso2is-apis/session-mgt-by-admin.yaml",
    output: {
      client: "fetch",
      target: "./src/wso2is-apis/generated/sessions.ts",
      headers: true,
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/wso2is-apis/custom-fetch.ts",
          name: "userFetch",
        },
      },
    },
  },

  configZod: {
    input: "./src/wso2is-apis/configs.yaml",
    output: {
      client: "zod",
      target: "./src/wso2is-apis/generated/zod/config.ts",
    },
  },
  config: {
    input: "./src/wso2is-apis/configs.yaml",
    output: {
      client: "fetch",
      target: "./src/wso2is-apis/generated/config.ts",
      headers: true,
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/wso2is-apis/custom-fetch.ts",
          name: "serverFetch",
        },
      },
    },
  },
} as ReturnType<typeof defineConfig>;
