// dto/student-schedule.ts
import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"

export const StudentScoreRequest = z
  .object({
    student_code: z.string(),
  })
  .openapi("StudentScoreRequest")

export type StudentScoreRequest = z.infer<typeof StudentScoreRequest>
export const StudentScoreNotFoundResponse = z.object({
  result_code: z.literal("404"),
  result_desc: z.string(),
})

export const StudentScoreItem = z
  .object({
    subject_code: z.string().nullish(),
    subject_name: z.string(),
    class_id: z.string(),
    attendanceScore: z.number().nullish(),
    midtermScore: z.number().nullish(),
    examScore: z.number().nullish(),
    credit: z.number(),
    final_score10: z.number().nullish(),
    final_score4: z.number().nullish(),
    grade_letter: z.string().nullish(),
    pass: z.boolean(),
    bonusScore: z.number().default(0),
    archivedCertificate: z.string(),
    description: z.string().nullish(),
  })
  .openapi("StudentScoreItem")

export type StudentScoreItem = z.infer<typeof StudentScoreItem>

export const StudentScoreResponse = SuccessResponseSchema.extend({
  semesters: z.array(
    z.object({
      semester_name: z.string(),
      semester_code: z.string().nullish(),
      subject_classes: z.array(StudentScoreItem),
    })
  ),
}).openapi("StudentScoreResponse")

export type StudentScoreResponse = z.infer<typeof StudentScoreResponse>
