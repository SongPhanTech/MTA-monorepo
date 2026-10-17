import { useQuery } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type LecturerExamScheduleParams = {
  userProfileId?: string
  semesterId?: string
  schoolYearId?: string
  fromDate?: string
  toDate?: string
}

export type LecturerExamScheduleItem = {
  Id: string
  Rownum?: number
  lecturer_code?: string | null
  lecturer_name?: string | null
  user_profile_id?: string | null
  student_count?: number | null
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

export type LecturerExamSchedulePayload = {
  Total: number
  Data: LecturerExamScheduleItem[]
}

type LecturerExamScheduleSuccess = {
  status: 200
  data: LecturerExamSchedulePayload
  headers: Headers
}

type LecturerExamScheduleError = {
  status: 400 | 401 | 500
  data: { message?: string }
  headers: Headers
}

export type LecturerExamScheduleResponse = LecturerExamScheduleSuccess | LecturerExamScheduleError

const buildQuery = (params?: LecturerExamScheduleParams) => {
  const search = new URLSearchParams()
  if (params?.userProfileId) search.set("userProfileId", params.userProfileId)
  if (params?.semesterId) search.set("semesterId", params.semesterId)
  if (params?.schoolYearId) search.set("schoolYearId", params.schoolYearId)
  if (params?.fromDate) search.set("fromDate", params.fromDate)
  if (params?.toDate) search.set("toDate", params.toDate)
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

export const getLecturerExamSchedule = async (
  params?: LecturerExamScheduleParams,
  options?: RequestInit
): Promise<LecturerExamScheduleResponse> => {
  return customTrainingFetch<LecturerExamScheduleResponse>(
    `/api/exam-schedules/lecturer${buildQuery(params)}`,
    {
      ...options,
      method: "GET",
    }
  )
}

export const useLecturerExamSchedule = (
  params?: LecturerExamScheduleParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["lms", "exam-schedules", "lecturer", params],
    queryFn: () => getLecturerExamSchedule(params),
    enabled: options?.enabled ?? true,
  })
}
