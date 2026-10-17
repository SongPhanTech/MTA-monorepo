import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Hono } from "hono"
import { jwtAuth } from "../../auth/src/hono/index.ts"
import { MODEL_API_APP_CODES, modelApiAppCodes } from "./model-api-app-codes"

describe("modelApiAppCodes", () => {
  test("includes the portals that call the shared model API", () => {
    const codes = modelApiAppCodes(undefined)
    for (const code of ["lms", "ems", "dangkyhoc", "hrm", "conggiangvien", "CongGiangVien", "portal", "chatbot", "lct"]) {
      expect(codes).toContain(code)
    }
    expect(codes).toEqual([...MODEL_API_APP_CODES])
  })

  test("an explicit list replaces the default", () => {
    expect(modelApiAppCodes("ems, dangkyhoc")).toEqual(["ems", "dangkyhoc"])
  })
})

describe("model API jwtAuth", () => {
  const previousEnv = process.env.NODE_ENV
  const previousMock = process.env.MOCK_USER_PROFILE_ID

  test("ems and dangkyhoc cookies are tokens, and the shared mock profile is not a fallback", async () => {
    process.env.NODE_ENV = "production"
    delete process.env.MOCK_USER_PROFILE_ID
    try {
      const app = new Hono()
      app.use("/api/model/*", jwtAuth(modelApiAppCodes(undefined)))
      app.get("/api/model/ping", (c) => c.text("ok"))

      for (const code of ["lms", "ems", "dangkyhoc", "hrm", "chatbot"]) {
        const response = await app.request("/api/model/ping", {
          headers: { Cookie: `x-token-${code}=header.payload.sig` },
        })
        const body = await response.text()
        expect(body).not.toContain("No token provided")
        expect(response.status).toBe(401)
      }

      const unknown = await app.request("/api/model/ping", {
        headers: { Cookie: "x-token-billing=header.payload.sig" },
      })
      expect(await unknown.text()).toContain("No token provided")
      expect(unknown.status).toBe(401)
    } finally {
      process.env.NODE_ENV = previousEnv
      if (previousMock == null) delete process.env.MOCK_USER_PROFILE_ID
      else process.env.MOCK_USER_PROFILE_ID = previousMock
    }
  })
})

describe("model route wiring", () => {
  const backend = resolve(import.meta.dir, "../../../apps/backend")

  test("be-model and be-ql-dao-tao accept the shared app-code list", () => {
    for (const file of ["be-model/src/index.ts", "be-ql-dao-tao/src/index.ts"]) {
      const text = readFileSync(resolve(backend, file), "utf8")
      expect(text).toContain('app.use("/api/model/*", jwtAuth(modelApiAppCodes()))')
      expect(text).toContain("modelPolicyUser(ctx.get(\"user\"))")
      expect(text).not.toContain("findFirstOrThrow")
    }
  })
})
