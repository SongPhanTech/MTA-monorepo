import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    //#region Delete existing data before import
    console.log('Deleting existing data...')
    await prisma.studentSubjectScore.deleteMany({
        where: {
            studentId: {
                startsWith: 'student_CNTT_K11_',
            },
        },
    })
    await prisma.userProfile.deleteMany({
        where: {
            id: {
                in: [
                    'student_CNTT_K11_1',
                    'student_CNTT_K11_2',
                    'student_CNTT_K11_3',
                    'student_CNTT_K11_4',
                    'student_CNTT_K11_5',
                    'student_CNTT_K11_6',
                    'student_CNTT_K11_7',
                    'student_CNTT_K11_8',
                    'student_CNTT_K11_9',
                    'student_CNTT_K11_10',
                ],
            },
        },
    })
    await prisma.student.deleteMany({
        where: {
            fixedClassId: 'K25_CĐT',
        },
    })

    // Delete in reverse order of dependencies
    await prisma.fixedClass.deleteMany({
        where: {
            id: {
                in: ['K25_CĐT'],
            },
        },
    })

    await prisma.trainingBlockSubject.deleteMany({
        where: {
            trainingBlockOnCurriculumVersionId: {
                in: ['DC_CNTT_K11_V1', 'CSN_CNTT_K11_V1', 'CN_CNTT_K11_V1'],
            },
        },
    })

    await prisma.trainingBlockOnCurriculumVersion.deleteMany({
        where: {
            id: {
                in: ['DC_CNTT_K11_V1', 'CSN_CNTT_K11_V1', 'CN_CNTT_K11_V1'],
            },
        },
    })

    await prisma.trainingBlock.deleteMany({
        where: {
            id: {
                in: ['DC', 'CSN', 'CN'],
            },
        },
    })

    await prisma.curriculumVersion.deleteMany({
        where: {
            id: {
                in: ['CNTT_K11_V1'],
            },
        },
    })

    await prisma.curriculum.deleteMany({
        where: {
            id: {
                in: ['CNTT_K11'],
            },
        },
    })

    await prisma.subjectClass.deleteMany({
        where: {
            id: {
                endsWith: '_CNTT_K11_V1',
            },
        },
    })

    await prisma.subjectVersion.deleteMany({
        where: {
            id: {
                endsWith: '_CNTT_1',
            },
        },
    })

    await prisma.subject.deleteMany({
        where: {
            id: {
                endsWith: '_CNTT',
            },
        },
    })

    await prisma.scoreConvert.deleteMany({
        where: {
            trainingCourseId: {
                in: ['K57'],
            },
        },
    })

    await prisma.trainingCourse.deleteMany({
        where: {
            id: {
                in: ['K57'],
            },
        },
    })

    console.log('Existing data deleted successfully.')
    console.log('All data imported successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Database connection closed.')
    })
    .catch(async (e) => {
        console.error('Error during data import:', e)
        await prisma.$disconnect()
    })
