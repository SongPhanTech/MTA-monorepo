import { z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"

export const OpenSubjectClass = z
  .object({
    trainingMajorId: z.string(),
    managementOrganizationId: z.string(),
    managementOrganizationName: z.string(),
    subjectVersionId: z.string(),
    subjectVersionName: z.string(),
    subjectVersionCode: z.string(),
    managementOrganizationCode: z.string(),
    subjectVersionCredit: z.number(),
    fixedClass: z.array(
      z.object({
        trainingBlockSubjectId: z.string(),
        fixedClassId: z.string(),
        fixedClassName: z.string(),
        fixedClassCount: z.number(),
        fixedClassSemester: z.number(),
        fixedClassCode: z.string(),
        trainingCourseId: z.string(),
        curriculumVersionId: z.string(),
        curriculumVersionName: z.string(),
        curriculumVersionCode: z.string(),
      })
    ),
    countStudent: z.number(),
  })
  .openapi("OpenSubjectClass")

export type OpenSubjectClass = z.infer<typeof OpenSubjectClass>

export const EnrollFixedClassOnSubjectClass = z
  .object({
    id: z.string(),
    code: z.string(),
    active: z.boolean(),
    description: z.string().nullable(),
    deletedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    from: z.coerce.date().nullable(),
    to: z.coerce.date().nullable(),
    trainingLocationId: z.string().nullable(),
    status: z.nativeEnum($Enums.StudentStatus), // cập nhật nếu có enum khác
    fixedClassId: z.string(),
    userProfileId: z.string(),
    trainingLevelId: z.string().nullable(),
    trainingObjectTypeId: z.string().nullable(),
    trainingTypeId: z.string().nullable(),
    trainingFormId: z.string().nullable(),
    registrationAreaId: z.string().nullable(),
    curriculumVersionId: z.string(),
    userProfile: z.object({
      id: z.string(),
      code: z.string().nullable(),
      lastName: z.string(),
      firstName: z.string(),
      familyName: z.string().nullable(),
      gender: z.string(),
      dateOfBirth: z.coerce.date(),
    }),

    fixedClass: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      trainingCourse: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
      }),
      curriculumVersion: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        curriculum: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          trainingMajor: z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
          }),
        }),
      }),
    }),
  })
  .openapi("EnrollFixedClassOnSubjectClass")

export type EnrollFixedClassOnSubjectClass = z.infer<typeof EnrollFixedClassOnSubjectClass>
