import { z } from '@hono/zod-openapi'

import { models } from '@workspace/db/zod'

export const FixedClassScalar = models.FixedClassScalarSchema.extend({
    trainingCourseId: z.string(),
    managementOrganizationId: z.string().nullable(),
    lecturerManagementId: z.string().nullable(),
})
    .describe('Lớp quản lý')
    .openapi('FixedClassScalar')

export const SchoolYearScalar =
    models.SchoolYearScalarSchema.describe('Năm học').openapi('SchoolYearScalar')

export const SemesterScalar = models.SemesterScalarSchema.extend({ schoolYearId: z.string() })
    .describe('Học kỳ')
    .openapi('SemesterScalar')

export const TrainingCourseScalar = models.TrainingCourseScalarSchema.extend({
    semesterStartId: z.string(),
    trainingLanguageId: z.string().nullable(),
})
    .describe('Khoá học')
    .openapi('TrainingCourseScalar')

export const TrainingFieldScalar = models.TrainingFieldScalarSchema.extend({
    organizationId: z.string(),
})
    .describe('Ngành đào tạo')
    .openapi('TrainingFieldScalar')

export const TrainingMajorScalar = models.TrainingMajorScalarSchema.extend({
    organizationId: z.string(),
    secondOrganizationId: z.string().nullable(),
    thirdOrganizationId: z.string().nullable(),
    trainingFieldId: z.string(),
})
    .describe('Chuyên ngành đào tạo')
    .openapi('TrainingMajorScalar')

export const TrainingObjectTypeScalar = models.TrainingObjectTypeScalarSchema.describe(
    'Đối tượng đào tạo'
).openapi('TrainingObjectTypeScalar')
