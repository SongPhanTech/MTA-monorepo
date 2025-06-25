import { PrismaClient } from '@prisma/client'
import { trainingData } from './archived/trainingData'

const prisma = new PrismaClient()

await prisma.trainingTime.createMany({
    data: [
        {
            id: '4years',
            name: '4 năm',
        },
        {
            id: '5years',
            name: '5 năm',
        },
    ],
    skipDuplicates: true,
})
const firstOrg = await prisma.dM_DonVi.findFirstOrThrow()
await prisma.trainingField.createMany({
    data: trainingData.map(({ id, trainingField }) => ({
        id,
        name: trainingField,
        englishName: trainingField,
        organizationId: firstOrg?.Id,
        publishDate: new Date(),
    })),
    skipDuplicates: true,
})

await prisma.trainingMajor.createMany({
    data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
        trainingMajors.map(({ id, trainingMajor }) => ({
            id,
            name: trainingMajor,
            organizationId: firstOrg.Id,
            summary: '',
            trainingFieldId,
        }))
    ),
    skipDuplicates: true,
})

await prisma.curriculum.createMany({
    data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
        trainingMajors.map(({ id, trainingMajor }) => ({
            id,
            name: trainingMajor,
            managementOrganizationId: firstOrg.Id,
            trainingMajorId: id,
        }))
    ),
    skipDuplicates: true,
})

await prisma.curriculumVersion.createMany({
    data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
        trainingMajors.flatMap(({ id: trainingMajorId, curriculums }) =>
            curriculums.map((curriculum) => ({
                curriculumId: trainingMajorId,
                name: curriculum,
                trainingLevelId: '550e8404-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
                trainingTimeId: '4years',
            }))
        )
    ),
    skipDuplicates: true,
})
