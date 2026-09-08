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
      "x-clientid": env.LMS_CLIENT_ID,
      "x-clientsecret": env.LMS_SECRET_KEY,
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
