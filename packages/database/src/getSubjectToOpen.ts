import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

const semesterId = 'HK1_2526'

const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId, deletedAt: null },
    select: {
        id: true,
        semesterType: true,
        order: true,
        schoolYear: {
            select: { startDate: true },
        },
    },
})

// 1. Lấy số học kỳ tối đa
const maxSemester =
    (
        await prisma.curriculumVersion.findFirst({
            orderBy: { numberOfSemesters: 'desc' },
            select: { numberOfSemesters: true },
        })
    )?.numberOfSemesters || 12
const maxSchoolYear = Math.ceil(maxSemester / 2)

// 2. Tìm tất cả các lớp có thể học trong học kỳ đã chọn
const classes = await prisma.fixedClass.findMany({
    where: {
        trainingCourse: {
            semesterStart: {
                schoolYear: {
                    startDate: {
                        gte: dayjs(semester.schoolYear.startDate)
                            .subtract(maxSchoolYear, 'year')
                            .startOf('year')
                            .toDate(),
                    },
                },
            },
        },
        curriculumVersionId: { not: null },
    },
    select: {
        id: true,
        name: true,
        curriculumVersionId: true,
        curriculumVersion: { select: { name: true } },
        trainingCourse: {
            select: {
                semesterStart: {
                    select: {
                        schoolYear: { select: { startDate: true } },
                    },
                },
            },
        },
    },
})

// 3. Tính offset học kỳ cho mỗi lớp
const classWithOffset = classes.map(({ trainingCourse, ...cls }) => {
    const semesterOrder =
        semester.semesterType === 'FIRST'
            ? 1
            : semester.semesterType === 'SECOND'
              ? 2
              : semester.order

    const offset =
        (semester.schoolYear.startDate.getFullYear() -
            // biome-ignore lint/style/noNonNullAssertion: <>
            trainingCourse!.semesterStart.schoolYear.startDate.getFullYear()) *
            2 +
        semesterOrder

    return {
        ...cls,
        semesterOffset: offset,
    }
})

// 4. Gom nhóm theo (curriculumVersionId, semesterOffset)
type Key = `${string}_${number}`
const classGroups = Object.groupBy(
    classWithOffset,
    (c) => `${c.curriculumVersionId}_${c.semesterOffset}` as Key
)

// 5. Lấy toàn bộ môn học cho các nhóm đã xác định
const allSubjects = await prisma.trainingBlockSubject.findMany({
    where: {
        OR: Object.entries(classGroups).map(([key, group]) => {
            const [curriculumVersionId, semester] = key.split('_')
            return {
                trainingBlockOnCurriculumVersion: { curriculumVersionId },
                semester: Number(semester),
            }
        }),
    },
    include: {
        trainingBlockOnCurriculumVersion: {
            include: { curriculumVersion: true },
        },
        subject: true,
    },
})

// 6. Gom nhóm theo môn học
// type GroupedSubject = {
//     subjectId: string
//     subjectName: string
//     classes: typeof classWithOffset
// }

const subjectMap = new Map<
    string,
    (typeof allSubjects)[number] & { classes: typeof classWithOffset }
>()

for (const sub of allSubjects) {
    const key = sub.subjectId

    if (!subjectMap.has(key)) {
        subjectMap.set(key, {
            ...sub,
            classes: [],
        })
    }

    // Tìm các lớp liên quan đến subject đó
    const relatedClasses =
        classGroups[
            `${sub.trainingBlockOnCurriculumVersion.curriculumVersion.id}_${sub.semester}` as Key
        ] || []

    subjectMap.get(key)?.classes.push(...relatedClasses)
}

// Kết quả
const groupedBySubject = Array.from(subjectMap.values())
console.log('groupedBySubject', groupedBySubject)
