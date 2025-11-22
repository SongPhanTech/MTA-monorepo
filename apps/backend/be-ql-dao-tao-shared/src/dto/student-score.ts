// dto/student-schedule.ts
import { z } from '@hono/zod-openapi'
import { SuccessResponseSchema } from './base'

export const StudentScoreRequest = z
    .object({
        student_code: z.string(),
    })
    .openapi('StudentScoreRequest')

export type StudentScoreRequest = z.infer<typeof StudentScoreRequest>

export const StudentScoreItem = z
    .object({
        subject_code: z.string().nullish(),
        subject_name: z.string(),
        credit: z.number(),
        class_id: z.string(),
        final_score: z.number(),
        base4: z.number().nullish(),
        letter: z.string().nullish(),
        classification: z.string().nullish(),
        pass: z.boolean(),
        improvement_register: z.boolean(),
    })
    .nullish()
    .openapi('StudentScoreItem')

export type StudentScoreItem = z.infer<typeof StudentScoreItem>

export const StudentScoreResponse = SuccessResponseSchema.extend({
    semesters: z.array(
        z.object({
            semester_name: z.string(),
            semester_code: z.string().nullish(),
            subject_classes: z.array(StudentScoreItem),
        })
    ),
}).openapi('StudentScoreResponse')

export type StudentScoreResponse = z.infer<typeof StudentScoreResponse>
