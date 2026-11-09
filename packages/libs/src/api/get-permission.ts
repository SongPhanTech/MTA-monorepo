import { useQuery, type QueryFunction, type UseQueryOptions } from "@tanstack/react-query"
import { customModelFetch } from "./custom-instance"

export type GetPermissionItem = {
  sFormName?: string | null
  lPermission?: number | null
  sTen?: string | null
  PermissionNames?: string[] | null
}

export type GetPermissionRole = {
  sRoleId?: string | null
  sCodeName?: string | null
  sRoleName?: string | null
  sVersion?: string | null
  Permissions?: GetPermissionItem[] | null
}

export type GetPermissionData = {
  Roles?: GetPermissionRole[] | null
  Permissions?: GetPermissionItem[] | null
  message?: string
}

export type getPermissionResponse = {
  status: number
  data: GetPermissionData
  headers: Headers
}

/**
 * FE → be-model POST `/api/getPermission`.
 * customModelFetch base = `/api/model` → URL công khai `/api/model/api/getPermission`
 * (nginx `location /api/model/` strip prefix → be-model `/api/getPermission`).
 */
export const getGetPermissionUrl = () => `/api/getPermission`

export const getPermission = async (
  appCode: string,
  userId: string,
  options?: RequestInit
): Promise<getPermissionResponse> => {
  return customModelFetch<getPermissionResponse>(getGetPermissionUrl(), {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify({ appCode, userId }),
  })
}

export const getGetPermissionQueryKey = (appCode?: string, userId?: string) =>
  [`/api/getPermission`, appCode, userId] as const

export const getGetPermissionQueryOptions = <
  TData = Awaited<ReturnType<typeof getPermission>>,
  TError = unknown,
>(
  appCode: string,
  userId: string,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermission>>, TError, TData>>
    request?: RequestInit
  }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getGetPermissionQueryKey(appCode, userId)
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getPermission>>> = ({ signal }) =>
    getPermission(appCode, userId, { signal, ...requestOptions })

  return {
    queryKey,
    queryFn,
    enabled: !!(appCode && userId),
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof getPermission>>, TError, TData> & {
    queryKey: typeof queryKey
  }
}

export function useGetPermission<
  TData = Awaited<ReturnType<typeof getPermission>>,
  TError = unknown,
>(
  appCode: string,
  userId: string,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermission>>, TError, TData>>
    request?: RequestInit
  }
) {
  return useQuery(getGetPermissionQueryOptions(appCode, userId, options))
}
