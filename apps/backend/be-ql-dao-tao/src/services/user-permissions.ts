import axios from "axios"
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

const MAX_USER_IDS = 100

function systemPublicUrl(path: string) {
  return `${env.MTA_API_URL.replace(/\/$/, "")}${path}`
}

function mapPermission(item: Partial<SystemPermission> | null | undefined): SystemPermission {
  return {
    sFormName: item?.sFormName ?? null,
    sTen: item?.sTen ?? null,
    lPermission: item?.lPermission ?? null,
    PermissionNames: Array.isArray(item?.PermissionNames) ? item.PermissionNames : [],
  }
}

function mapRole(item: Partial<SystemRole> | null | undefined): SystemRole {
  return {
    sRoleId: item?.sRoleId ?? null,
    sCodeName: item?.sCodeName ?? null,
    sRoleName: item?.sRoleName ?? null,
    sVersion: item?.sVersion ?? null,
    Permissions: Array.isArray(item?.Permissions) ? item.Permissions.map(mapPermission) : [],
  }
}

export async function fetchUserPermissions(userIds: string[]): Promise<UserPermissionItem[]> {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) {
    throw new Error("UserIds không được để trống")
  }
  if (ids.length > MAX_USER_IDS) {
    throw new Error(`Tối đa ${MAX_USER_IDS} user mỗi lần gọi`)
  }

  const res = await axios.post(systemPublicUrl("/UserPermissions/permissions"), ids, {
    headers: {
      "x-clientid": env.KEYCLOAK_CLIENT_ID_LMS,
      "x-clientsecret": env.KEYCLOAK_CLIENT_SECRET_LMS,
      "Content-Type": "application/json",
    },
    timeout: 30_000,
  })

  const payload = res.data
  const list = Array.isArray(payload) ? payload : (payload?.Data ?? payload?.data ?? [])
  if (!Array.isArray(list)) {
    throw new Error("Phản hồi quyền người dùng không hợp lệ")
  }

  return list.map((item: Partial<UserPermissionItem>) => ({
    UserId: String(item?.UserId ?? ""),
    Roles: Array.isArray(item?.Roles) ? item.Roles.map(mapRole) : [],
  }))
}
