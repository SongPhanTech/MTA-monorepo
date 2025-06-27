import { ExamType, PrismaClient, SubjectClassSchedule } from '@prisma/client'

const prisma = new PrismaClient()

// const trainingCourses = await prisma.trainingCourse.findMany()

// console.log(trainingCourses)

async function main() {
    await prisma.dM_DonVi.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: 'KCK',
                sTen: 'Khoa Cơ khí',
                sMa: 'KCK',
                sGhiChu: 'Khoa Cơ khí',
                sParentId: null,
            },
            {
                Id: 'KQS',
                sTen: 'Khoa Quân sự',
                sMa: 'KQS',
                sGhiChu: 'Khoa Quân sự',
                sParentId: null,
            },
        ],
    })

    await prisma.subject.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'NMKTPM',
                code: 'NMKTPM',
                name: 'Nhập môn kỹ thuật phần mềm',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440001',
            },
        ],
    })

    await prisma.subjectVersion.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'NMKTPM_1',
                code: 'NMKTPM_1',
                name: 'Nhập môn kỹ thuật phần mềm(2025)',
                credit: 3,
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440001',
                subjectId: 'NMKTPM',
                examType: ExamType.OfflineWritten,
                period: 60,
            },
        ],
    })

    await prisma.subjectClass.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'LNMKTPM_1',
                code: 'LNMKTPM_1',
                name: 'Lớp NMKTPM_1',
                subjectId: 'NMKTPM_1',
                semesterId: '550e8409-e29b-41d4-a716-446655440000',
                maxStudent: 60,
                schedule: SubjectClassSchedule.MORNING,
                startDate: new Date('2025-07-22'),
            },
            {
                id: 'LNMKTPM_2',
                code: 'LNMKTPM_2',
                name: 'Lớp NMKTPM_2',
                subjectId: 'NMKTPM_1',
                semesterId: '550e8409-e29b-41d4-a716-446655440000',
                maxStudent: 60,
                schedule: SubjectClassSchedule.AFTERNOON,
                startDate: new Date('2025-07-22'),
            },
        ],
    })
}

main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
