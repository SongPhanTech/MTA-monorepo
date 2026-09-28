import { prisma } from ".."
import { fetchUserPermissions, type SystemPermission, type SystemRole } from "./user-permissions"

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
  const uniqueRecipientIds = [...new Set(recipientIds.map((id) => id.trim()).filter(Boolean))].filter(
    (id) => id !== granterId
  )
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

  const current = await fetchUserPermissions([granterId])
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

export async function listDelegatedPermissions(recipientId: string): Promise<DelegatedPermission[]> {
  const grants = await prisma.accessRoleGrant.findMany({
    where: { recipientId, active: true, deletedAt: null },
    select: {
      permissions: {
        where: { deletedAt: null },
        select: { sFormName: true, lPermission: true },
      },
    },
  })

  const merged = new Map<string, number>()
  for (const grant of grants) {
    for (const permission of grant.permissions) {
      if (!permission.sFormName) continue
      merged.set(permission.sFormName, (merged.get(permission.sFormName) ?? 0) | permission.lPermission)
    }
  }

  return [...merged.entries()].map(([name, permission]) => ({ name, permission }))
}
