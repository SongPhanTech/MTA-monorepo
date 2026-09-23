import axios from "axios"
import { env } from "./env"

export type LecturerExamScheduleQuery = {
  userProfileId: string
  semesterId?: string
  schoolYearId?: string
  fromDate?: string
  toDate?: string
}

export type LecturerExamScheduleItem = {
  Id: string
  Rownum: number
  lecturer_code: string
  lecturer_name: string
  user_profile_id: string
  student_count: number | null
  exam_class_code: string | null
  exam_date: string | null
  start_time: string | null
  end_time: string | null
  room_name: string | null
  building_name: string | null
  training_location_name: string | null
  subject_code: string | null
  subject_name: string | null
  credit_count: number | null
  exam_type: string | null
  exam_period_name: string | null
  semester_name: string | null
  school_year_name: string | null
}

export type LecturerExamScheduleResponse = {
  Total: number
  Data: LecturerExamScheduleItem[]
}

export async function fetchLecturerExamSchedules(
  query: LecturerExamScheduleQuery
): Promise<LecturerExamScheduleResponse> {
  const params = new URLSearchParams()
  params.set("userProfileId", query.userProfileId)
  if (query.semesterId) params.set("semesterId", query.semesterId)
  if (query.schoolYearId) params.set("schoolYearId", query.schoolYearId)
  if (query.fromDate) params.set("fromDate", query.fromDate)
  if (query.toDate) params.set("toDate", query.toDate)

  const res = await axios.get(`${env.MTA_API_URL}/ExamSchedules/lecturer?${params.toString()}`, {
    headers: {
      "x-clientid": env.KEYCLOAK_CLIENT_ID_LMS,
      "x-clientsecret": env.KEYCLOAK_CLIENT_SECRET_LMS,
      "Content-Type": "application/json",
    },
    timeout: 30_000,
  })

  const data = res.data ?? {}
  return {
    Total: Number(data.Total ?? data.total ?? 0),
    Data: Array.isArray(data.Data) ? data.Data : Array.isArray(data.data) ? data.data : [],
  }
}

export type SubjectClassExamDateDto = {
  Id?: string
  id?: string
  subjectClassId?: string | null
  subject_class_id?: string | null
  subject_class_code?: string | null
  subject_class_name?: string | null
  exam_date?: string | null
  start_time?: string | null
  end_time?: string | null
  exam_period_name?: string | null
  room_name?: string | null
  exam_class_code?: string | null
  exam_class_name?: string | null
  schedule_status?: string | null
}

const EXAM_DATES_CHUNK_SIZE = 200

function normalizeExamDateList(payload: unknown): SubjectClassExamDateDto[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>
    if (Array.isArray(data.Data)) return data.Data
    if (Array.isArray(data.data)) return data.data
  }
  return []
}

/** POST public `/subject-classes/exam-dates` — body = danh sách SubjectClass.id (sourceIds). */
export async function fetchSubjectClassExamDates(
  sourceIds: string[]
): Promise<SubjectClassExamDateDto[]> {
  if (sourceIds.length === 0) return []

  const headers = {
    "x-clientid": env.KEYCLOAK_CLIENT_ID_LMS,
    "x-clientsecret": env.KEYCLOAK_CLIENT_SECRET_LMS,
    "Content-Type": "application/json",
  }
  const url = `${env.MTA_API_URL.replace(/\/$/, "")}/subject-classes/exam-dates`
  const results: SubjectClassExamDateDto[] = []

  for (let i = 0; i < sourceIds.length; i += EXAM_DATES_CHUNK_SIZE) {
    const chunk = sourceIds.slice(i, i + EXAM_DATES_CHUNK_SIZE)
    const res = await axios.post(url, chunk, {
      headers,
      timeout: 60_000,
    })
    results.push(...normalizeExamDateList(res.data))
  }

  return results
}

export function resolveSubjectClassIdFromExamDateDto(
  item: SubjectClassExamDateDto
): string | null {
  const raw = item.subjectClassId ?? item.subject_class_id
  if (raw == null) return null
  const value = String(raw).trim()
  return value || null
}

export function parseExamDateValue(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  // Date-only → giữ ngày theo UTC noon để tránh lệch timezone khi format VN
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`)
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
