import { z } from '@hono/zod-openapi'

export const OpenSubjectClass = z
    .object({
        trainingMajorId: z.string(),
        trainingCourseId: z.string(),
        subjectVersionId: z.string(),
        subjectVersionName: z.string(),
        subjectVersionCredit: z.number(),
        curriculumVersion: z.array(
            z.object({
                curriculumVersionId: z.string(),
                curriculumVersionName: z.string(),
            })
        ),
        subjectClass: z.array(
            z.object({
                subjectClassId: z.string(),
                subjectClassName: z.string(),
                subjectClassCode: z.string(),
            })
        ),
        fixedClass: z.array(
            z.object({
                fixedClassId: z.string(),
                fixedClassName: z.string(),
                fixedClassCount: z.number(),
            })
        ),
        countStudent: z.number(),
    })
    .openapi('OpenSubjectClass')

export type OpenSubjectClass = z.infer<typeof OpenSubjectClass>
