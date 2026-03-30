import { z } from "@hono/zod-openapi"
import type { ExamType } from "@workspace/db"
import { SuccessResponseSchema } from "./base"

export const TYPE_PROGRAM = {
  NOT_IN_CURRICULUM: "0",
  IN_CURRICULUM: "1",
} as const

export const TYPE_REGISTRABLE = {
  REGISTRABLE: "0",
  UN_REGISTRABLE: "1",
} as const

export const OpenCoursesRequest = z
  .object({
    students_code: z.string(),
    session_code: z.string().optional(),
    program_code: z.string().optional(),
    type_program: z.nativeEnum(TYPE_PROGRAM).optional().default(TYPE_PROGRAM.IN_CURRICULUM),
    key_word: z.string().optional(),
    type: z.nativeEnum(TYPE_REGISTRABLE).optional(),
  })
  .openapi("OpenCoursesRequest")

export type OpenCoursesRequest = z.infer<typeof OpenCoursesRequest>

export const ClassDetailsSchema = z
  .object({
    session_code: z.string().nullable(),
    program_code: z.string().nullish(),
    type_program: z.nativeEnum(TYPE_PROGRAM),
    courses_code: z.string().nullable(),
    courses_name: z.string(),
    class_id: z.string(),
    class_students_reg: z.number(),
    class_students_count: z.number(),
    class_teachers: z.string(),
    class_credit_hour: z.number(),
    class_tuition: z.number(),
    class_time: z.string(),
    class_exam_date: z.date().nullable(),
  })
  .openapi("ClassDetails")

export type ClassDetails = z.infer<typeof ClassDetailsSchema>

export const OpenCourseResponse = SuccessResponseSchema.extend({
  data: z.array(ClassDetailsSchema),
}).openapi("OpenCourseResponse")

export type OpenCourseResponse = z.infer<typeof OpenCourseResponse>

export const CoursesDetailRequest = z
  .object({
    class_id: z.string(),
  })
  .openapi("CoursesDetailRequest")

// Kiểu thi
// 1: Vấn đáp
// 2: Viết
// 3: Trực tuyến
// 4: Trắc nghiệm
export const EXAM_TYPE = {
  Oral: 1,
  OfflineWritten: 2,
  Practice: 3,
  Project: 4,
  Other: 5,
  OnlineWritten: 6,
} as const satisfies Record<ExamType, number>

export const CoursesDetailResponse = SuccessResponseSchema.extend({
  class_terms: z.string(),
  courses_code: z.string().nullable(),
  courses_name: z.string(),
  class_id: z.string(),
  class_classroom: z.string(),
  exam_type: z.nativeEnum(EXAM_TYPE).nullable(),
  teacher_1: z.string().nullable(),
  teacher_2: z.string().nullable(),
  study_schedules: z.array(
    z.object({
      study_date: z.date(),
      study_period_start: z.number(),
      study_period_end: z.number(),
    })
  ),
  students_list: z.array(z.string()),
}).openapi("CoursesDetailResponse")
