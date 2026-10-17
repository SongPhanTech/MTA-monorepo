import {
  getUserPermissionsPermissionAppCodeUserId,
  postUserPermissionsPermissions,
} from "@workspace/libs/api/system"
import { prisma } from ".."
import { env } from "./env"

export type SystemPermission = {
  sFormName?: string | null
  sTen?: string | null
  lPermission?: number | null
  PermissionNames?: string[] | null
}

export type SystemRole = {
  sRoleId?: string | null
  sCodeName?: string | null
  sRoleName?: string | null
  sVersion?: string | null
  Permissions: SystemPermission[]
}

export type UserPermissionItem = {
  UserId: string
  Roles: SystemRole[]
}

const XEM = 1
const MAX_RECIPIENTS = 50

export type DelegationPermissionInput = {
  sFormName: string
  lPermission: number
}

export type DelegationGrantInput = {
  sRoleId: string
  permissions: DelegationPermissionInput[]
}

export type AssignDelegationResult = {
  assigned: number
  skippedRecipientIds: string[]
  skippedRoleIds: string[]
}

export type DelegatedPermission = {
  name: string
  permission: number
}

export type GrantedPermission = {
  sFormName: string
  sTen: string | null
  lPermission: number
}

export type GrantedRole = {
  id: string
  recipientId: string
  fullname: string | null
  code: string | null
  officerNumber: string | null
  sRoleId: string
  sRoleName: string | null
  sCodeName: string | null
  permissions: GrantedPermission[]
  createdAt: string
}

export type RevokeGrantsResult = {
  revoked: number
}

type StoredPermission = {
  sFormName: string
  sTen: string | null
  lPermission: number
}

type StoredGrant = {
  sRoleId: string
  sRoleName: string | null
  sCodeName: string | null
  permissions: StoredPermission[]
}

function ownedMask(permission: SystemPermission | undefined) {
  const mask = Number(permission?.lPermission ?? 0)
  return Number.isFinite(mask) ? mask : 0
}

function storeMask(requested: number, owned: number) {
  let stored = requested & owned
  if ((stored & ~XEM) !== 0 && (owned & XEM) === XEM) {
    stored |= XEM
  }
  return stored
}

function finiteMask(value: unknown) {
  const mask = Number(value ?? 0)
  return Number.isFinite(mask) ? mask : 0
}

function capRolesToHeld(
  roles: SystemRole[],
  held: Map<string, number> | null,
  received: StoredGrant[]
): SystemRole[] {
  const receivedByRole = new Map(received.map((grant) => [grant.sRoleId, grant]))
  const seenRoleIds = new Set<string>()

  const capped = roles.flatMap((role) => {
    const roleId = role.sRoleId ?? ""
    if (roleId) seenRoleIds.add(roleId)
    const grant = roleId ? receivedByRole.get(roleId) : undefined
    const grantByForm = new Map(
      (grant?.permissions ?? []).map((permission) => [permission.sFormName, permission])
    )
    const seenForms = new Set<string>()
    const permissions: SystemPermission[] = []

    for (const permission of role.Permissions) {
      const form = permission.sFormName
      if (!form) continue
      seenForms.add(form)
      const systemMask = finiteMask(permission.lPermission)
      const grantMask = finiteMask(grantByForm.get(form)?.lPermission)
      const native = held?.has(form) ? systemMask & (held.get(form) ?? 0) : systemMask
      const mask = native | grantMask
      if (mask === 0) continue
      permissions.push({
        sFormName: form,
        sTen: permission.sTen ?? grantByForm.get(form)?.sTen ?? null,
        lPermission: mask,
        PermissionNames: [],
      })
    }

    for (const permission of grant?.permissions ?? []) {
      if (seenForms.has(permission.sFormName) || permission.lPermission === 0) continue
      permissions.push({
        sFormName: permission.sFormName,
        sTen: permission.sTen,
        lPermission: permission.lPermission,
        PermissionNames: [],
      })
    }

    if (!permissions.length) return []
    return [{ ...role, Permissions: permissions }]
  })

  for (const grant of received) {
    if (seenRoleIds.has(grant.sRoleId)) continue
    const permissions = grant.permissions.flatMap((permission) => {
      if (permission.lPermission === 0) return []
      const mask = held
        ? permission.lPermission & (held.get(permission.sFormName) ?? permission.lPermission)
        : permission.lPermission
      if (mask === 0) return []
      return [
        {
          sFormName: permission.sFormName,
          sTen: permission.sTen,
          lPermission: mask,
          PermissionNames: [] as string[],
        },
      ]
    })
    if (!permissions.length) continue
    capped.push({
      sRoleId: grant.sRoleId,
      sRoleName: grant.sRoleName,
      sCodeName: grant.sCodeName,
      sVersion: null,
      Permissions: permissions,
    })
  }

  if (!held || held.size === 0) return capped

  const hadPermissions = roles.some((role) =>
    role.Permissions.some((permission) => permission.sFormName)
  )
  const overlap = roles.some((role) =>
    role.Permissions.some((permission) => permission.sFormName && held.has(permission.sFormName))
  )
  if (hadPermissions && !overlap && received.length === 0) return roles
  return capped
}

const APP_CODE =
  process.env.NEXT_PUBLIC_APP_CODE?.trim() || process.env.MTA_APP_CODE?.trim() || "lms"
const MAX_USER_IDS = 100

const systemRequest = () => ({
  headers: {
    "x-clientid": env.KEYCLOAK_CLIENT_ID_LMS,
    "x-clientsecret": env.KEYCLOAK_CLIENT_SECRET_LMS,
  },
})

export async function fetchUserPermissions(userIds: string[]): Promise<UserPermissionItem[]> {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) {
    throw new Error("UserIds không được để trống")
  }
  if (ids.length > MAX_USER_IDS) {
    throw new Error(`Tối đa ${MAX_USER_IDS} user mỗi lần gọi`)
  }

  const res = await postUserPermissionsPermissions(ids, systemRequest())
  if (res.status !== 200) {
    const data = res.data as { message?: string; title?: string }
    const error = new Error(
      data?.message || data?.title || "Không lấy được quyền người dùng"
    ) as Error & {
      response?: { status: number; data: unknown }
    }
    error.response = { status: res.status, data: res.data }
    throw error
  }

  return res.data.map((item) => ({
    UserId: String(item.UserId ?? ""),
    Roles: (item.Roles ?? []).map((role) => ({
      sRoleId: role.sRoleId ?? null,
      sCodeName: role.sCodeName ?? null,
      sRoleName: role.sRoleName ?? null,
      sVersion: role.sVersion ?? null,
      Permissions: (role.Permissions ?? []).map((permission) => ({
        sFormName: permission.sFormName ?? null,
        sTen: permission.sTen ?? null,
        lPermission: permission.lPermission ?? null,
        PermissionNames: Array.isArray(permission.PermissionNames)
          ? permission.PermissionNames
          : [],
      })),
    })),
  }))
}

async function fetchEffectivePermissions(userId: string): Promise<Map<string, number>> {
  const res = await getUserPermissionsPermissionAppCodeUserId(APP_CODE, userId, systemRequest())
  if (res.status !== 200) {
    throw new Error("Không lấy được quyền thực tế")
  }

  const masks = new Map<string, number>()
  for (const item of res.data.Permissions ?? []) {
    const name = item.sFormName ?? ""
    if (!name) continue
    const mask = Number(item.lPermission ?? 0)
    if (!Number.isFinite(mask)) continue
    masks.set(name, (masks.get(name) ?? 0) | mask)
  }
  return masks
}

async function loadHeldMasks(userId: string): Promise<Map<string, number> | null> {
  try {
    return await fetchEffectivePermissions(userId)
  } catch (error) {
    console.error("[access-delegation] actual permissions failed", userId, error)
    return null
  }
}

async function loadReceivedGrants(userIds: string[]): Promise<Map<string, StoredGrant[]>> {
  const byUser = new Map<string, StoredGrant[]>()
  if (userIds.length === 0) return byUser

  const grants = await prisma.accessRoleGrant.findMany({
    where: { recipientId: { in: userIds }, active: true, deletedAt: null },
    select: {
      recipientId: true,
      sRoleId: true,
      sRoleName: true,
      sCodeName: true,
      permissions: {
        where: { active: true, deletedAt: null },
        select: { sFormName: true, sTen: true, lPermission: true },
      },
    },
  })

  for (const grant of grants) {
    const list = byUser.get(grant.recipientId) ?? []
    list.push({
      sRoleId: grant.sRoleId,
      sRoleName: grant.sRoleName,
      sCodeName: grant.sCodeName,
      permissions: grant.permissions,
    })
    byUser.set(grant.recipientId, list)
  }

  return byUser
}

export async function applyActualRolePermissions(
  users: UserPermissionItem[]
): Promise<UserPermissionItem[]> {
  const userIds = [...new Set(users.map((user) => user.UserId).filter(Boolean))]
  const receivedByUser = await loadReceivedGrants(userIds)

  return Promise.all(
    users.map(async (user) => {
      if (!user.UserId) return user
      const held = await loadHeldMasks(user.UserId)
      return {
        ...user,
        Roles: capRolesToHeld(user.Roles, held, receivedByUser.get(user.UserId) ?? []),
      }
    })
  )
}

function resolveGrants(roles: SystemRole[], requested: DelegationGrantInput[]) {
  const byRoleId = new Map<string, SystemRole>()
  for (const role of roles) {
    if (role.sRoleId) byRoleId.set(role.sRoleId, role)
  }

  const grants: StoredGrant[] = []
  const skippedRoleIds: string[] = []

  for (const item of requested) {
    const role = byRoleId.get(item.sRoleId)
    if (!role) {
      skippedRoleIds.push(item.sRoleId)
      continue
    }

    const ownedByForm = new Map<string, SystemPermission>()
    for (const permission of role.Permissions) {
      if (permission.sFormName) ownedByForm.set(permission.sFormName, permission)
    }

    const permissions: StoredPermission[] = []
    for (const permission of item.permissions) {
      const owned = ownedByForm.get(permission.sFormName)
      if (!owned) continue
      const stored = storeMask(permission.lPermission, ownedMask(owned))
      if (stored === 0) continue
      permissions.push({
        sFormName: permission.sFormName,
        sTen: owned.sTen ?? null,
        lPermission: stored,
      })
    }

    grants.push({
      sRoleId: item.sRoleId,
      sRoleName: role.sRoleName ?? null,
      sCodeName: role.sCodeName ?? null,
      permissions,
    })
  }

  return { grants, skippedRoleIds }
}

export async function assignDelegation(
  granterId: string,
  recipientIds: string[],
  requestedGrants: DelegationGrantInput[]
): Promise<AssignDelegationResult> {
  const uniqueRecipientIds = [
    ...new Set(recipientIds.map((id) => id.trim()).filter(Boolean)),
  ].filter((id) => id !== granterId)
  if (uniqueRecipientIds.length === 0) {
    throw new Error("Chọn cán bộ hoặc giảng viên nhận ủy quyền")
  }
  if (uniqueRecipientIds.length > MAX_RECIPIENTS) {
    throw new Error(`Tối đa ${MAX_RECIPIENTS} người nhận mỗi lần gán`)
  }

  const profiles = await prisma.userProfile.findMany({
    where: {
      id: { in: uniqueRecipientIds },
      bLaHocVien: { not: true },
      OR: [
        { lecturer: { isNot: null } },
        { staffs: { isNot: null } },
        { bLaGiangVien: true },
        { bLaCanBoNhanVien: true },
      ],
    },
    select: { id: true },
  })
  const validRecipientIds = profiles.map((profile) => profile.id)
  const validSet = new Set(validRecipientIds)
  const skippedRecipientIds = uniqueRecipientIds.filter((id) => !validSet.has(id))
  if (validRecipientIds.length === 0) {
    throw new Error("Không có cán bộ hoặc giảng viên hợp lệ để nhận ủy quyền")
  }

  const current = await applyActualRolePermissions(await fetchUserPermissions([granterId]))
  const granter = current.find((item) => item.UserId === granterId) ?? current[0]
  const { grants, skippedRoleIds } = resolveGrants(granter?.Roles ?? [], requestedGrants)
  if (grants.length === 0) {
    throw new Error("Không có vai trò hợp lệ để ủy quyền")
  }

  await prisma.$transaction(async (tx) => {
    for (const recipientId of validRecipientIds) {
      for (const grant of grants) {
        const existing = await tx.accessRoleGrant.findUnique({
          where: { recipientId_sRoleId: { recipientId, sRoleId: grant.sRoleId } },
        })
        const roleGrant = existing
          ? await tx.accessRoleGrant.update({
              where: { id: existing.id },
              data: {
                granterId,
                sRoleName: grant.sRoleName,
                sCodeName: grant.sCodeName,
                active: grant.permissions.length > 0,
                deletedAt: null,
              },
            })
          : await tx.accessRoleGrant.create({
              data: {
                granterId,
                recipientId,
                sRoleId: grant.sRoleId,
                sRoleName: grant.sRoleName,
                sCodeName: grant.sCodeName,
                active: grant.permissions.length > 0,
              },
            })

        await tx.accessPermissionGrant.deleteMany({ where: { roleGrantId: roleGrant.id } })
        if (grant.permissions.length > 0) {
          await tx.accessPermissionGrant.createMany({
            data: grant.permissions.map((permission) => ({
              roleGrantId: roleGrant.id,
              sFormName: permission.sFormName,
              sTen: permission.sTen,
              lPermission: permission.lPermission,
            })),
          })
        }
      }
    }
  })

  return {
    assigned: validRecipientIds.length,
    skippedRecipientIds,
    skippedRoleIds,
  }
}

export async function listGrantedRoles(granterId: string): Promise<GrantedRole[]> {
  const grants = await prisma.accessRoleGrant.findMany({
    where: { granterId, active: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      recipientId: true,
      sRoleId: true,
      sRoleName: true,
      sCodeName: true,
      createdAt: true,
      permissions: {
        where: { active: true, deletedAt: null },
        select: { sFormName: true, sTen: true, lPermission: true },
      },
    },
  })

  const recipientIds = [...new Set(grants.map((grant) => grant.recipientId))]
  const profiles = recipientIds.length
    ? await prisma.userProfile.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, fullname: true, code: true, officerNumber: true },
      })
    : []
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

  return grants.map((grant) => {
    const profile = profileById.get(grant.recipientId)
    return {
      id: grant.id,
      recipientId: grant.recipientId,
      fullname: profile?.fullname ?? null,
      code: profile?.code ?? null,
      officerNumber: profile?.officerNumber ?? null,
      sRoleId: grant.sRoleId,
      sRoleName: grant.sRoleName,
      sCodeName: grant.sCodeName,
      permissions: grant.permissions,
      createdAt: grant.createdAt.toISOString(),
    }
  })
}

export async function revokeGrants(
  granterId: string,
  grantIds: string[]
): Promise<RevokeGrantsResult> {
  const uniqueIds = [...new Set(grantIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    throw new Error("Chọn quyền cần thu hồi")
  }

  const grants = await prisma.accessRoleGrant.findMany({
    where: { id: { in: uniqueIds }, granterId, active: true, deletedAt: null },
    select: { id: true },
  })
  if (grants.length === 0) {
    throw new Error("Không có quyền hợp lệ để thu hồi")
  }

  const ids = grants.map((grant) => grant.id)
  const now = new Date()
  await prisma.$transaction([
    prisma.accessPermissionGrant.updateMany({
      where: { roleGrantId: { in: ids }, deletedAt: null },
      data: { active: false, deletedAt: now },
    }),
    prisma.accessRoleGrant.updateMany({
      where: { id: { in: ids } },
      data: { active: false, deletedAt: now },
    }),
  ])

  return { revoked: ids.length }
}

export async function listDelegatedPermissions(
  recipientId: string
): Promise<DelegatedPermission[]> {
  const grants = await prisma.accessRoleGrant.findMany({
    where: { recipientId, active: true, deletedAt: null },
    select: {
      permissions: {
        where: { active: true, deletedAt: null },
        select: { sFormName: true, lPermission: true },
      },
    },
  })

  const merged = new Map<string, number>()
  for (const grant of grants) {
    for (const permission of grant.permissions) {
      if (!permission.sFormName) continue
      merged.set(
        permission.sFormName,
        (merged.get(permission.sFormName) ?? 0) | permission.lPermission
      )
    }
  }

  return [...merged.entries()].map(([name, permission]) => ({ name, permission }))
}
