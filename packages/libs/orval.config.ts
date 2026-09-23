import { defineConfig } from "orval"

export default defineConfig({
  model_api: {
    input: "https://daotao.swantech.vn/api/model/openapi",
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/model.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customModelFetch",
        },
      },
    },
  },
  training_api: {
    input: "./openapi/training.openapi.json",
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/training.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customTrainingFetch",
        },
      },
    },
  },
  ems_api: {
    input: "./openapi/ems.openapi.json",
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/exam.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customExamFetch",
        },
      },
    },
  },
  portal_api: {
    // input: 'http://localhost:3002/openapi',
    input: {
      target: "https://daotao.swantech.vn/api/portal/openapi",
      override: {
        transformer: "./scripts/openapi-transformer.mjs",
      },
    },
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/portal.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customPortalFetch",
        },
      },
    },
  },
  system_share_api: {
    input: "https://daotao.swantech.vn/api/system/share/swagger/v1/swagger.json",
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/system-share.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customSystemShareFetch",
        },
      },
    },
  },
  // storage_api: {
  //     input: 'https://daotao.swantech.vn/api/system/storage/swagger/v1/swagger.json',
  //     output: {
  //         client: 'react-query',
  //         httpClient: 'fetch',
  //         mode: 'single',
  //         target: './src/api/storage.ts',
  //         schemas: './src/api/schemas',
  //         packageJson: 'fake',
  //         override: {
  //             query: { version: 5 },
  //             mutator: {
  //                 path: './src/api/custom-instance.ts',
  //                 name: 'customStorageFetch',
  //             },
  //         },
  //     },
  // },
  system_api: {
    input: "https://daotao.swantech.vn/api/system/public/swagger/v1/swagger.json",
    output: {
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      target: "./src/api/system.ts",
      schemas: "./src/api/schemas",
      packageJson: "fake",
      override: {
        query: { version: 5 },
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customSystemFetch",
        },
      },
    },
  },
})
