import { z } from '@hono/zod-openapi'
import { $Enums } from '@workspace/db'

export const OpenSubjectClass = z
    .object({
        trainingMajorId: z.string(),
        trainingCourseId: z.string(),
        subjectVersionId: z.string(),
        subjectVersionName: z.string(),
        subjectVersionCode: z.string(),
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
                fixedClassSemester: z.number(),
            })
        ),
        countStudent: z.number(),
    })
    .openapi('OpenSubjectClass')

export type OpenSubjectClass = z.infer<typeof OpenSubjectClass>
export const FixedClassBySubjectClassSemester = z
    .object({
        id: z.string(),
        code: z.string(),
        active: z.boolean(),
        description: z.string().nullable(),
        deletedAt: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
        name: z.string(),
        summary: z.string().nullable(),
        startYear: z.number(),
        graduated: z.boolean(),
        trainingCourseId: z.string(),
        managementOrganizationId: z.string().nullable(),
        lecturerManagementId: z.string().nullable(),
        staffManagementId: z.string().nullable(),
        initSize: z.number(),
        curriculumVersionId: z.string(),

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
        checked: z.boolean(),
        _count: z.object({
            students: z.number(),
        }),
    })
    .openapi('FixedClassBySubjectClassSemester')

export type FixedClassBySubjectClassSemester = z.infer<typeof FixedClassBySubjectClassSemester>

export const StudentClassBySubjectClassSemester = z
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
        studyRankId: z.string().nullable(),
        trainingRankId: z.string().nullable(),

        userProfile: z.object({
            id: z.string(),
            code: z.string().nullable(),
            lastName: z.string(),
            firstName: z.string(),
            familyName: z.string().nullable(),
            gender: z.nativeEnum($Enums.Gender),
            dateOfBirth: z.coerce.date(),
        }),
        checked: z.boolean(),
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
    .openapi('StudentClassBySubjectClassSemester')

export type StudentClassBySubjectClassSemester = z.infer<typeof StudentClassBySubjectClassSemester>

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
        studyRankId: z.string().nullable(),
        trainingRankId: z.string().nullable(),

        userProfile: z.object({
            id: z.string(),
            code: z.string().nullable(),
            lastName: z.string(),
            firstName: z.string(),
            familyName: z.string().nullable(),
            gender: z.nativeEnum($Enums.Gender),
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
    .openapi('EnrollFixedClassOnSubjectClass')

export type EnrollFixedClassOnSubjectClass = z.infer<typeof EnrollFixedClassOnSubjectClass>
