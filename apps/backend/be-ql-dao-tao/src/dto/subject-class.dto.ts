import { z } from '@hono/zod-openapi'

export const OpenSubjectClass = z
    .object({
        subjectVersionId: z.string(),
        subjectVersionName: z.string(),
        subjectVersionCredit: z.number(),
        curriculumVersion: z.array(
            z.object({
                curriculumVersionId: z.string(),
                curriculumVersionName: z.string(),
            })
        ),
        fixedClass: z.array(
            z.object({ fixedClassId: z.string(), fixedClassName: z.string() })
        ),
    })
    .openapi('OpenSubjectClass')

export type OpenSubjectClass = z.infer<typeof OpenSubjectClass>
