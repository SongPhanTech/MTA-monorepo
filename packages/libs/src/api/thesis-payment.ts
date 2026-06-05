import { customModelFetch } from "./custom-instance"

export type ThesisPaymentScopeRequest = {
  thesisSessionId: string
  studentIds?: string[]
}

export type SyncThesisPaymentsRequest = ThesisPaymentScopeRequest & {
  recreateAll?: boolean
}

export type SyncThesisPaymentsResponse = {
  status: number
  data: { syncedCount: number; projectCount: number }
  headers: Headers
}

export type ExportThesisPaymentsResponse = {
  status: number
  data: Blob
  headers: Headers
}

export type ThesisPaymentErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

const getSyncCouncilPaymentsUrl = () => "/api/thesis-payment/sync-council-payments"
const getSyncSupervisorPaymentsUrl = () => "/api/thesis-payment/sync-supervisor-payments"
const getExportCouncilPaymentsUrl = () => "/api/thesis-payment/export-council-payments"
const getExportSupervisorPaymentsUrl = () => "/api/thesis-payment/export-supervisor-payments"

export const syncThesisCouncilPayments = async (
  body: SyncThesisPaymentsRequest
): Promise<SyncThesisPaymentsResponse | ThesisPaymentErrorResponse> => {
  return customModelFetch(getSyncCouncilPaymentsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const syncThesisSupervisorPayments = async (
  body: SyncThesisPaymentsRequest
): Promise<SyncThesisPaymentsResponse | ThesisPaymentErrorResponse> => {
  return customModelFetch(getSyncSupervisorPaymentsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const exportThesisCouncilPayments = async (
  body: ThesisPaymentScopeRequest
): Promise<ExportThesisPaymentsResponse | ThesisPaymentErrorResponse> => {
  return customModelFetch(getExportCouncilPaymentsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const exportThesisSupervisorPayments = async (
  body: ThesisPaymentScopeRequest
): Promise<ExportThesisPaymentsResponse | ThesisPaymentErrorResponse> => {
  return customModelFetch(getExportSupervisorPaymentsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
