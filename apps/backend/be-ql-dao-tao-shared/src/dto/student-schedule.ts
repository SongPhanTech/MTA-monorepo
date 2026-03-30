// dto/student-schedule.ts
import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"

export const StudentScheduleRequest = z
  .object({
    class_terms: z.string(),
    students_code: z.string(),
  })
  .openapi("StudentScheduleRequest")

export type StudentScheduleRequest = z.infer<typeof StudentScheduleRequest>

export const StudentScheduleItem = z
  .object({
    courses_code: z.string(),
    courses_name: z.string(),
    class_credit_hour: z.number(),
    class_id: z.string(),
    class_time: z.string(),
    class_classroom: z.string(),
  })
  .openapi("StudentScheduleItem")

export type StudentScheduleItem = z.infer<typeof StudentScheduleItem>

export const StudentScheduleResponse = SuccessResponseSchema.extend({
  class_terms: z.string(),
  students_code: z.string(),
  students_schedules: z.array(StudentScheduleItem),
}).openapi("StudentScheduleResponse")

export type StudentScheduleResponse = z.infer<typeof StudentScheduleResponse>
