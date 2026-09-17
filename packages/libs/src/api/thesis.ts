import { customModelFetch } from "./custom-instance"

export type CreateSampleThesisDataRequest = {
  thesisSessionId: string
  studentIds: string[]
}

export type CreateSampleThesisDataResponse = {
  status: number
  data: { createdCount: number }
  headers: Headers
}

export type CreateSampleThesisDataErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

export type BatchUpdateThesisItem = {
  thesisProjectId: string
  studentCode?: string | null
  title?: string | null
  type?: string | null
  language?: string | null
  status?: string | null
  defenseDate?: string | null
  researchTopicAssociated?: string | null
  organizationId?: string | null
  supervisorId?: string | null
  coSupervisorId?: string | null
  roomId?: string | null
  defenseSessionId?: string | null
  score?: string | number | null
  councilChairman?: string | null
  councilSecretary?: string | null
  reviewer1?: string | null
  reviewer2?: string | null
  councilMember?: string | null
}

export type BatchUpdateThesisProjectsRequest = {
  thesisSessionId: string
  allowSupervisorEdit?: boolean
  items: BatchUpdateThesisItem[]
}

export type BatchUpdateThesisProjectsResponse = {
  status: number
  data: { updatedCount: number }
  headers: Headers
}

export type BatchUpdateThesisProjectsErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

export type DeleteStudentThesisRequest = {
  thesisSessionId: string
  studentId: string
}

export type DeleteStudentThesisResponse = {
  status: number
  data: { deleted: true }
  headers: Headers
}

export type DeleteStudentThesisErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

const getCreateSampleThesisDataUrl = () => "/api/thesis/create-sample-data"
const getBatchUpdateThesisProjectsUrl = () => "/api/thesis/batch-update"
const getDeleteStudentThesisUrl = () => "/api/thesis/delete-student-thesis"

export const createSampleThesisData = async (
  body: CreateSampleThesisDataRequest
): Promise<CreateSampleThesisDataResponse | CreateSampleThesisDataErrorResponse> => {
  return customModelFetch(getCreateSampleThesisDataUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const batchUpdateThesisProjects = async (
  body: BatchUpdateThesisProjectsRequest
): Promise<BatchUpdateThesisProjectsResponse | BatchUpdateThesisProjectsErrorResponse> => {
  return customModelFetch(getBatchUpdateThesisProjectsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const deleteStudentThesis = async (
  body: DeleteStudentThesisRequest
): Promise<DeleteStudentThesisResponse | DeleteStudentThesisErrorResponse> => {
  return customModelFetch(getDeleteStudentThesisUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export type ExportCouncilImportTemplateRequest = {
  thesisSessionId: string
}

export type ExportCouncilImportTemplateResponse = {
  status: number
  data: Blob
  headers: Headers
}

export type ExportCouncilImportTemplateErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

const getExportCouncilImportTemplateUrl = () => "/api/thesis/export-council-import-template"

export const exportCouncilImportTemplate = async (
  body: ExportCouncilImportTemplateRequest
): Promise<ExportCouncilImportTemplateResponse | ExportCouncilImportTemplateErrorResponse> => {
  return customModelFetch(getExportCouncilImportTemplateUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export type ImportCouncilFromExcelResponse = {
  status: number
  data: { updatedCount: number }
  headers: Headers
}

export type ImportCouncilFromExcelErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

const getImportCouncilFromExcelUrl = () => "/api/thesis/import-council-from-excel"

export const importCouncilFromExcel = async (
  formData: FormData
): Promise<ImportCouncilFromExcelResponse | ImportCouncilFromExcelErrorResponse> => {
  return customModelFetch(getImportCouncilFromExcelUrl(), {
    method: "POST",
    body: formData,
  })
}

export type ThesisExportFilter = {
  thesisSessionId: string
  trainingCourseIds?: string[]
  fixedClassIds?: string[]
  organizationId?: string
  organizationIds?: string[]
  signerName?: string
  isChief?: boolean
  signingDate?: string
  moneyAmount?: number
  recreateAllPayments?: boolean
}

export type ThesisExportTemplateResponse = {
  status: number
  data: Blob
  headers: Headers
}

export type ThesisExportTemplateErrorResponse = {
  status: number
  data: { message: string }
  headers: Headers
}

const getThesisExportTemplateUrl = (kind: string) => `/api/thesis/export/${kind}`

export const exportThesisTemplate = async (
  kind: string,
  body: ThesisExportFilter
): Promise<ThesisExportTemplateResponse | ThesisExportTemplateErrorResponse> => {
  return customModelFetch(getThesisExportTemplateUrl(kind), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
