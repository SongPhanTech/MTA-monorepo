import { useQuery } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

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

type UserPermissionsSuccess = {
  status: 200
  data: UserPermissionItem[]
  headers: Headers
}

type UserPermissionsError = {
  status: 400 | 401 | 500
  data: { message?: string }
  headers: Headers
}

export type UserPermissionsResponse = UserPermissionsSuccess | UserPermissionsError

export const getUserPermissions = async (
  userIds: string[],
  options?: RequestInit
): Promise<UserPermissionsResponse> => {
  return customTrainingFetch<UserPermissionsResponse>("/api/user-permissions/permissions", {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify({ UserIds: userIds }),
  })
}

export const useUserPermissions = (userIds: string[], options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["lms", "user-permissions", userIds],
    queryFn: () => getUserPermissions(userIds),
    enabled: (options?.enabled ?? true) && userIds.length > 0,
  })
}
