import { useQuery } from "@tanstack/react-query"
import { customPortalFetch } from "./custom-instance"

export type StudentExamScheduleParams = {
  semesterId?: string
  schoolYearId?: string
  fromDate?: string
  toDate?: string
}

export type StudentExamScheduleItem = {
  Id: string
  Rownum?: number
  student_code?: string | null
  student_name?: string | null
  user_profile_id?: string | null
  so_thu_tu?: number | null
  exam_class_code?: string | null
  exam_date?: string | null
  start_time?: string | null
  end_time?: string | null
  room_name?: string | null
  building_name?: string | null
  training_location_name?: string | null
  subject_code?: string | null
  subject_name?: string | null
  credit_count?: number | null
  exam_type?: string | null
  exam_period_name?: string | null
  semester_name?: string | null
  school_year_name?: string | null
}

export type StudentExamSchedulePayload = {
  Total: number
  Data: StudentExamScheduleItem[]
}

type StudentExamScheduleSuccess = {
  status: 200
  data: StudentExamSchedulePayload
  headers: Headers
}

type StudentExamScheduleError = {
  status: 400 | 401 | 500
  data: { message?: string }
  headers: Headers
}

export type StudentExamScheduleResponse = StudentExamScheduleSuccess | StudentExamScheduleError

const buildQuery = (params?: StudentExamScheduleParams) => {
  const search = new URLSearchParams()
  if (params?.semesterId) search.set("semesterId", params.semesterId)
  if (params?.schoolYearId) search.set("schoolYearId", params.schoolYearId)
  if (params?.fromDate) search.set("fromDate", params.fromDate)
  if (params?.toDate) search.set("toDate", params.toDate)
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

export const getStudentExamSchedule = async (
  params?: StudentExamScheduleParams,
  options?: RequestInit
): Promise<StudentExamScheduleResponse> => {
  return customPortalFetch<StudentExamScheduleResponse>(
    `/api/exam-schedules/student${buildQuery(params)}`,
    {
      ...options,
      method: "GET",
    }
  )
}

export const useStudentExamSchedule = (
  params?: StudentExamScheduleParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["portal", "exam-schedules", "student", params],
    queryFn: () => getStudentExamSchedule(params),
    enabled: options?.enabled ?? true,
  })
}
