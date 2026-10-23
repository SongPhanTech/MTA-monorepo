import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseQueryOptions } from "@tanstack/react-query"
import { customPortalFetch } from "./custom-instance"

export type DataSyncHistoryItem = {
  id: string
  type: "IMPORT" | "EXPORT"
  status: "PENDING" | "SUCCESS" | "FAILED"
  sessionName: string
  fileName: string | null
  fileVersion: string | null
  description?: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt?: string
  classRegisterSessionId: string | null
}

/** Đợt đăng ký cho dropdown xuất (admin sync) — không lọc theo SV */
export type DataSyncSessionItem = {
  id: string
  name: string
  active: boolean
  startDate: string
  endDate: string
  semester?: {
    id?: string
    name?: string | null
    schoolYear?: { id?: string; name?: string | null } | null
  } | null
}

type PortalSessionsResponse = {
  status: number
  data: DataSyncSessionItem[]
}

export type StartDataSyncRequest = {
  type: "IMPORT" | "EXPORT"
  sessionName: string
  classRegisterSessionId?: string
  fileName?: string
  fileVersion?: string
  sourceExportedAt?: string
  recordCounts?: Record<string, number>
}

type PortalListResponse = {
  status: number
  data: DataSyncHistoryItem[]
}

type PortalStartResponse = {
  status: number
  data: { id: string; status: string }
}

type PortalFinishResponse = {
  status: number
  data: { message: string }
}

const historyQueryKey = ["data-sync-history"] as const

export const getDataSyncHistory = async (limit = 50) => {
  return customPortalFetch<PortalListResponse>(
    `/api/data-sync/get-data-sync-history?limit=${limit}`,
    { method: "GET" }
  )
}

export const listDataSyncSessions = async () => {
  return customPortalFetch<PortalSessionsResponse>("/api/data-sync/list-sessions", {
    method: "GET",
  })
}

export const getListDataSyncSessionsQueryKey = () => ["data-sync-sessions"] as const

export const useListDataSyncSessions = (
  options?: Omit<
    UseQueryOptions<PortalSessionsResponse, Error, DataSyncSessionItem[]>,
    "queryKey" | "queryFn" | "select"
  >
) =>
  useQuery({
    queryKey: getListDataSyncSessionsQueryKey(),
    queryFn: () => listDataSyncSessions(),
    select: (res) => (res.status === 200 ? res.data : []),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    ...options,
  })

export const startDataSync = async (body: StartDataSyncRequest) => {
  return customPortalFetch<PortalStartResponse>("/api/data-sync/start-data-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const finishDataSync = async (body: {
  id: string
  status: "SUCCESS" | "FAILED"
  errorMessage?: string
}) => {
  return customPortalFetch<PortalFinishResponse>("/api/data-sync/finish-data-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const useGetDataSyncHistory = (
  limit = 50,
  options?: Omit<
    UseQueryOptions<PortalListResponse, Error, DataSyncHistoryItem[]>,
    "queryKey" | "queryFn" | "select"
  >
) =>
  useQuery({
    queryKey: [...historyQueryKey, limit],
    queryFn: () => getDataSyncHistory(limit),
    select: (res) => (res.status === 200 ? res.data : []),
    refetchOnWindowFocus: false,
    ...options,
  })

export const useStartDataSync = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startDataSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyQueryKey })
    },
  })
}

export const useFinishDataSync = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: finishDataSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyQueryKey })
    },
  })
}
