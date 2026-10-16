import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { NotificationType } from "../generated/prisma-client"
import { modelPolicyUser } from "./model-policy-user"
import policyJs from "../generated/zenstack/policy.js"
import policyTs from "../generated/zenstack/policy"

type Guard = (context: { user: unknown; preValue?: unknown }, db?: unknown) => unknown
type Checker = (input: { type?: string }, context: { user: unknown }) => boolean

function matches(filter: unknown, row: Record<string, unknown>): boolean {
  if (filter == null || typeof filter !== "object") return false
  const node = filter as Record<string, unknown>
  if (Array.isArray(node.AND)) return node.AND.every((part) => matches(part, row))
  if (Array.isArray(node.OR)) return node.OR.some((part) => matches(part, row))
  if (node.NOT) return !matches(node.NOT, row)
  const fields = Object.entries(node).filter(([key]) => key !== "AND" && key !== "OR" && key !== "NOT")
  if (fields.length !== 1) return false
  const [field, cond] = fields[0]
  if (cond && typeof cond === "object" && "equals" in (cond as object)) {
    return row[field] === (cond as { equals: unknown }).equals
  }
  if (cond && typeof cond === "object" && "not" in (cond as object)) {
    const inner = (cond as { not: { equals?: unknown } }).not
    if (inner && typeof inner === "object" && "equals" in inner) return row[field] !== inner.equals
  }
  return false
}

function notificationOf(mod: unknown) {
  const root = (mod as { default?: unknown }).default ?? mod
  const policy = (root as { policy?: unknown }).policy ? root : (root as { default: unknown }).default
  return (policy as { policy: { notification: NotificationPolicy } }).policy.notification
}

type NotificationPolicy = {
  modelLevel: {
    read: { guard: Guard }
    create: { guard: Guard; inputChecker: Checker }
    update: { guard: Guard }
    postUpdate: { guard: Guard }
    delete: { guard: Guard }
  }
}

const jsPolicy = notificationOf(policyJs)
const tsPolicy = notificationOf(policyTs)

describe("modelPolicyUser", () => {
  test("missing identity stays anonymous", () => {
    expect(modelPolicyUser(undefined)).toBeUndefined()
    expect(modelPolicyUser({ id: "" })).toBeUndefined()
    expect(modelPolicyUser({ id: null })).toBeUndefined()
  })

  test("dev mock is marked and production never is", () => {
    const env = { nodeEnv: "development", mockProfileId: "shared-profile" }
    expect(modelPolicyUser({ id: "shared-profile" }, env)).toEqual({ id: "shared-profile", mock: true })
    expect(modelPolicyUser({ id: "real-student" }, env)).toEqual({ id: "real-student" })
    expect(modelPolicyUser({ id: "shared-profile" }, { nodeEnv: "production", mockProfileId: "shared-profile" })).toEqual({
      id: "shared-profile",
    })
  })
})

describe("CHAT notification policy", () => {
  const cases = [
    ["js", jsPolicy],
    ["ts", tsPolicy],
  ] as const

  test("js and ts deny the same CHAT reads and mutations", () => {
    const users = [null, { id: "real-1" }, { id: "shared", mock: true }]
    for (const user of users) {
      const context = { user }
      for (const action of ["read", "create", "update", "postUpdate", "delete"] as const) {
        expect(JSON.stringify(jsPolicy.modelLevel[action].guard(context))).toBe(
          JSON.stringify(tsPolicy.modelLevel[action].guard(context)),
        )
      }
      const postContext = { user, preValue: { type: NotificationType.CHAT } }
      expect(JSON.stringify(jsPolicy.modelLevel.postUpdate.guard(postContext))).toBe(
        JSON.stringify(tsPolicy.modelLevel.postUpdate.guard(postContext)),
      )
    }
  })

  for (const [name, policy] of cases) {
    test(`${name} allows the original recipient and denies reassigned, mock, and anonymous`, () => {
      const row = { type: NotificationType.CHAT, recipientProfileId: "original", deletedAt: null }
      expect(matches(policy.modelLevel.read.guard({ user: { id: "original" } }), row)).toBe(true)
      expect(matches(policy.modelLevel.read.guard({ user: { id: "reassigned-owner" } }), row)).toBe(false)
      expect(matches(policy.modelLevel.read.guard({ user: { id: "original", mock: true } }), row)).toBe(false)
      expect(matches(policy.modelLevel.read.guard({ user: null }), row)).toBe(false)
      const read = JSON.stringify(policy.modelLevel.read.guard({ user: { id: "original" } }))
      expect(read).not.toContain("userProfileId")
      expect(read).not.toContain("targetStudents")
    })

    test(`${name} update passes the row and post-update denies an existing or new CHAT type`, () => {
      const user = { user: { id: "original" } }
      const chat = { type: NotificationType.CHAT, recipientProfileId: "original", deletedAt: null }
      expect(matches(policy.modelLevel.update.guard(user), chat)).toBe(true)
      const wasChat = policy.modelLevel.postUpdate.guard({
        ...user,
        preValue: { type: NotificationType.CHAT },
      })
      expect(matches(wasChat, { type: NotificationType.GENERAL })).toBe(false)
      const wasGeneral = policy.modelLevel.postUpdate.guard({
        ...user,
        preValue: { type: NotificationType.GENERAL },
      })
      expect(matches(wasGeneral, { type: NotificationType.CHAT })).toBe(false)
      expect(matches(wasGeneral, { type: NotificationType.GENERAL })).toBe(true)
      expect(matches(policy.modelLevel.create.guard(user), { type: NotificationType.CHAT })).toBe(false)
      expect(matches(policy.modelLevel.create.guard(user), { type: NotificationType.GENERAL })).toBe(true)
      expect(matches(policy.modelLevel.delete.guard(user), chat)).toBe(false)
    })
  }
})

function studentOf(mod: unknown) {
  const root = (mod as { default?: unknown }).default ?? mod
  const policy = (root as { policy?: unknown }).policy ? root : (root as { default: unknown }).default
  return (policy as { policy: { student: { modelLevel: { update: { guard: Guard } } } } }).policy.student
}

describe("student profile reassignment stays available", () => {
  test("authenticated Student update is not closed by the CHAT fix", () => {
    for (const policy of [studentOf(policyJs), studentOf(policyTs)]) {
      expect(policy.modelLevel.update.guard({ user: { id: "staff" } })).toEqual({ AND: [] })
    }
  })
})

describe("generated CHAT artifacts", () => {
  const root = resolve(import.meta.dir, "..")
  const files = [
    "generated/zenstack/policy.ts",
    "generated/zenstack/policy.js",
    "prisma/schema.prisma",
    "prisma/migrations/20261016090000_notification_chat/migration.sql",
    "prisma/migrations/20261016103000_notification_chat_recipient/migration.sql",
    "generated/zod/enums/NotificationType.schema.ts",
    "generated/openapi.json",
    "generated/prisma-client/schema.prisma",
    "generated/zenstack/logical-prisma-client/schema.prisma",
  ]

  test("policy files and schema artifacts agree on CHAT", () => {
    for (const file of files) {
      const text = readFileSync(resolve(root, file), "utf8")
      expect(text.includes("CHAT") || text.includes("'CHAT'")).toBe(true)
    }
    for (const file of ["generated/zenstack/policy.ts", "generated/zenstack/policy.js"]) {
      const policyText = readFileSync(resolve(root, file), "utf8")
      expect(policyText).toContain("recipientProfileId")
      expect(policyText).toContain('preUpdateSelector: { "type": true }')
      expect(policyText).toContain("UserProfile$mock_read")
      expect(policyText).toContain('"mock": true')
      expect(policyText).not.toContain("targetStudents: { some: { userProfileId")
    }
    expect(readFileSync(resolve(root, "generated/zenstack/policy.ts"), "utf8")).toContain("user?.mock")
    expect(readFileSync(resolve(root, "generated/zenstack/policy.js"), "utf8")).toContain("user.mock")
    const zmodel = readFileSync(resolve(root, "models/ql-danh-muc/notification.zmodel"), "utf8")
    expect(zmodel).not.toMatch(/@@deny\(\s*['"]postUpdate['"]/)
    expect(zmodel).toContain("future().type == CHAT")
    expect(zmodel).toContain("auth().mock == true")
    expect(zmodel).toContain("recipientProfileId")
    const student = readFileSync(resolve(root, "models/ql-dao-tao/student.zmodel"), "utf8")
    expect(student).toContain("userProfileId")
    expect(student).not.toMatch(/@@deny\([^)]*userProfileId/)
  })
})
