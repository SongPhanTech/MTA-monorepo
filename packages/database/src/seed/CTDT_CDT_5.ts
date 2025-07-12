import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')
    //#region Semester
    const semesters = await prisma.semester.findMany({
        take: 10,
        orderBy: { startDate: 'asc' },
        where: {
            semesterType: { in: ['FIRST', 'SECOND'] },
        },
    })
    console.log(`Found ${semesters.length} semesters.`)
    //#region TrainingBlockSubject
    const trainingBlockSubjects = await prisma.trainingBlockSubject.findMany({
        where: {
            trainingBlockOnCurriculumVersionId: {
                in: ['DC_CDT_K6_V1', 'CSN_CDT_K6_V1', 'CN_CDT_K6_V1'],
            },
        },
        include: {
            subject: true,
        },
    })
    console.log(`Found ${trainingBlockSubjects.length} training block subjects.`)
    //#region SubjectClass
    for (const tbs of trainingBlockSubjects) {
        const subject = tbs.subject
        const semesterOrder = tbs.semester || 1
        const semesterId = semesters[semesterOrder - 1]?.id || semesters[0]?.id
        const startDate = semesters[semesterOrder - 1]?.startDate
        if (!startDate) {
            console.warn(
                `No startDate found for semester order ${semesterOrder} (subject ${subject.id}), skipping creation.`
            )
            return
        }
        const year = startDate.getFullYear()
        if (!semesterId) {
            console.warn(
                `No semesterId found for subject ${subject.id} with semester order ${semesterOrder}, skipping creation.`
            )
            continue
        }
        await prisma.subjectClass.create({
            data: {
                id: `${subject.id}_${semesterOrder}_CDT_K6_V1`,
                subjectId: subject.id,
                name: `${subject.name} - ${year}`, // Replace as appropriate
                startDate: startDate,
                schedule: 'MORNING',
                maxStudent: 30,
                semesterId: semesterId,
                code: `${subject.code}_${semesterOrder}_CDT_K6_V1`,
            },
        })
    }

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
