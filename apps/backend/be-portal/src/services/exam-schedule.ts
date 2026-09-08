import axios from "axios"

export type StudentExamScheduleQuery = {
  userProfileId: string
  semesterId?: string
  schoolYearId?: string
  fromDate?: string
  toDate?: string
}

export type StudentExamScheduleItem = {
  Id: string
  Rownum: number
  student_code: string
  student_name: string
  user_profile_id: string
  so_thu_tu: number | null
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

export type StudentExamScheduleResponse = {
  Total: number
  Data: StudentExamScheduleItem[]
}

function getSystemPublicBaseUrl(): string {
  if (process.env.MTA_API_URL) return process.env.MTA_API_URL.replace(/\/$/, "")
  const systemBase = process.env.SYSTEM_BASE_URL?.replace(/\/$/, "")
  if (systemBase) return `${systemBase}/api/system/public`
  return "https://mta.swantech.vn/api/system/public"
}

function getClientCredentials() {
  const clientId =
    process.env.KEYCLOAK_CLIENT_ID_PORTAL ||
    process.env.LMS_CLIENT_ID ||
    process.env.KEYCLOAK_CLIENT_ID ||
    ""
  const clientSecret =
    process.env.KEYCLOAK_CLIENT_SECRET_PORTAL ||
    process.env.LMS_SECRET_KEY ||
    process.env.KEYCLOAK_CLIENT_SECRET ||
    ""
  return { clientId, clientSecret }
}

export async function fetchStudentExamSchedules(
  query: StudentExamScheduleQuery
): Promise<StudentExamScheduleResponse> {
  const { clientId, clientSecret } = getClientCredentials()
  if (!clientId || !clientSecret) {
    throw new Error("Missing system public API client credentials")
  }

  const params = new URLSearchParams()
  params.set("userProfileId", query.userProfileId)
  if (query.semesterId) params.set("semesterId", query.semesterId)
  if (query.schoolYearId) params.set("schoolYearId", query.schoolYearId)
  if (query.fromDate) params.set("fromDate", query.fromDate)
  if (query.toDate) params.set("toDate", query.toDate)

  const url = `${getSystemPublicBaseUrl()}/ExamSchedules/student?${params.toString()}`
  const res = await axios.get(url, {
    headers: {
      "x-clientid": clientId,
      "x-clientsecret": clientSecret,
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
