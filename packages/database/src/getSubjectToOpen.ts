import { $Enums, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
async function getSubjectsToOpen(semesterId: string) {
    const semester = await prisma.semester.findUniqueOrThrow({
        where: { id: semesterId },
        select: {
            id: true,
            code: true,
            name: true,
            semesterType: true,
            order: true,
            schoolYear: {
                select: {
                    startDate: true,
                },
            },
        },
    })

    console.log('semester', semester)

    const maxSemesterCurriculum = await prisma.curriculumVersion.findFirst({
        orderBy: { numberOfSemesters: 'desc' },
        select: { numberOfSemesters: true },
    })

    // thời gian đào tạo tối đa: fre-filter
    const maxSemester = maxSemesterCurriculum?.numberOfSemesters || 12
    const maxSchoolYear = maxSemester / 2

    const startDate = new Date(semester.schoolYear.startDate)
    startDate.setFullYear(
        semester.schoolYear.startDate.getFullYear() - maxSchoolYear
    )

    console.log(111, startDate, semester.schoolYear.startDate)

    // những lớp nằm trong kỳ học này (tối đa 6 năm ~ 12 kỳ)
    const classes = await prisma.fixedClass.findMany({
        where: {
            trainingCourse: {
                semesterStart: {
                    schoolYear: {
                        startDate: { gte: startDate },
                    },
                },
            },
            curriculumVersionId: { not: null },
        },
        include: {
            trainingCourse: {
                include: {
                    semesterStart: {
                        include: {
                            schoolYear: true,
                        },
                    },
                },
            },
        },
    })

    const results: any[] = []

    for (const cls of classes) {
        if (!cls.trainingCourse || !cls.curriculumVersionId) continue

        const semesterOrder =
            semester.semesterType === $Enums.SemesterType.FIRST
                ? 1
                : semester.semesterType === $Enums.SemesterType.SECOND
                  ? 2
                  : semester.order

        const semesterOffset =
            (semester.schoolYear.startDate.getFullYear() -
                cls.trainingCourse.semesterStart.schoolYear.startDate.getFullYear()) *
                2 +
            (semesterOrder - 1)

        console.log(
            'class',
            cls.name,
            cls.trainingCourse.semesterStart.schoolYear,
            semesterOffset
        )

        const subjects = await prisma.subjectVersion.findMany({
            where: {
                trainingBlocks: {
                    some: {
                        trainingBlockOnCurriculumVersion: {
                            curriculumVersionId: cls.curriculumVersionId,
                        },
                        semester: semesterOffset,
                    },
                },
            },
            include: {
                trainingBlocks: {
                    where: {
                        trainingBlockOnCurriculumVersion: {
                            curriculumVersionId: cls.curriculumVersionId,
                        },
                        semester: semesterOffset,
                    },
                    include: {
                        trainingBlockOnCurriculumVersion: {
                            include: {
                                curriculumVersion: true,
                            },
                        },
                    },
                },
            },
        })

        results.push({
            classId: cls.id,
            coursePlans: subjects,
        })
    }

    return results
}

const subjects = await getSubjectsToOpen('HK2_2425')
console.log('subjects', subjects)
