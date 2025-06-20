import { $Enums, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Query tìm các môn học cần mở lớp theo học kỳ
async function getSubjectsNeedToOpenClass(
    prisma: PrismaClient,
    semesterId: string,
    schoolYearId?: string
) {
    // 1. Lấy thông tin học kỳ và năm học
    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })

    if (!semester) {
        throw new Error('Không tìm thấy học kỳ')
    }

    const currentSchoolYear = new Date(
        semester.schoolYear.startDate
    ).getFullYear()

    // 2. Tìm các môn học đã có lớp học trong học kỳ này
    const existingSubjectClasses = await prisma.subjectClass.findMany({
        where: {
            semesterId: semesterId,
            active: true,
            deletedAt: null,
        },
        select: {
            subjectId: true,
        },
    })

    const existingSubjectIds = existingSubjectClasses.map((sc) => sc.subjectId)

    // 3. Tìm các lớp biên chế có khóa học bắt đầu phù hợp với học kỳ
    const fixedClasses = await prisma.fixedClass.findMany({
        where: {
            active: true,
            deletedAt: null,
            graduated: { not: true },
            students: { some: { active: true, deletedAt: null } },
            trainingCourse: {
                active: true,
                deletedAt: null,
                semesterStart: {
                    schoolYearId: schoolYearId || semester.schoolYearId,
                },
            },
            curriculumVersion: {
                active: true,
                deletedAt: null,
            },
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
            curriculumVersion: {
                include: {
                    trainingBlocks: {
                        where: {
                            active: true,
                            deletedAt: null,
                        },
                        include: {
                            trainingBlock: true,
                            subjects: {
                                where: {
                                    active: true,
                                    deletedAt: null,
                                    graduation: true, // Chỉ lấy môn học tính vào tốt nghiệp
                                },
                                include: {
                                    subject: {
                                        include: {
                                            subject: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            students: {
                where: {
                    active: true,
                    deletedAt: null,
                    status: 'ENROLLED',
                },
            },
        },
    })

    // 4. Tổng hợp các môn học cần mở lớp
    const subjectMap = new Map()

    for (const fixedClass of fixedClasses) {
        if (
            !fixedClass.curriculumVersion ||
            !fixedClass.trainingCourse ||
            !fixedClass.students.length
        ) {
            continue
        }

        // Tính toán học kỳ hiện tại dựa trên năm bắt đầu khóa học và năm hiện tại
        const trainingStartYear = new Date(
            fixedClass.trainingCourse.semesterStart.schoolYear.startDate
        ).getFullYear()
        const yearsSinceStart = currentSchoolYear - trainingStartYear
        const semesterOrder =
            semester.semesterType === $Enums.SemesterType.FIRST
                ? 1
                : semester.semesterType === $Enums.SemesterType.SECOND
                  ? 2
                  : semester.order
        const currentSemesterInCourse = yearsSinceStart * 2 + semesterOrder

        for (const trainingBlock of fixedClass.curriculumVersion
            .trainingBlocks) {
            for (const trainingBlockSubject of trainingBlock.subjects) {
                const subjectVersionId = trainingBlockSubject.subjectId

                // Bỏ qua nếu môn học đã có lớp
                if (existingSubjectIds.includes(subjectVersionId)) {
                    continue
                }

                // Chỉ lấy môn học của học kỳ hiện tại
                if (trainingBlockSubject.semester !== currentSemesterInCourse) {
                    continue
                }

                const key = `${subjectVersionId}_${trainingBlockSubject.semester}`

                if (!subjectMap.has(key)) {
                    subjectMap.set(key, {
                        subjectVersion: trainingBlockSubject.subject,
                        subject: trainingBlockSubject.subject.subject,
                        trainingBlock: trainingBlock.trainingBlock.name,
                        fixedClasses: [],
                        totalStudents: 0,
                        semesterOrder: trainingBlockSubject.semester,
                        subjectType: trainingBlockSubject.type,
                        useForFinalScore: trainingBlockSubject.useForFinalScore,
                        graduation: trainingBlockSubject.graduation,
                        project: trainingBlockSubject.project,
                    })
                }

                const subjectData = subjectMap.get(key)
                subjectData.fixedClasses.push({
                    id: fixedClass.id,
                    name: fixedClass.name,
                    studentCount: fixedClass.students.length,
                    trainingCourse: fixedClass.trainingCourse?.name || '',
                    trainingStartYear: trainingStartYear,
                    currentSemesterInCourse: currentSemesterInCourse,
                })
                subjectData.totalStudents += fixedClass.students.length
            }
        }
    }

    return Array.from(subjectMap.values()).sort((a, b) => {
        // Sắp xếp theo thứ tự ưu tiên: học kỳ, tên môn học
        if (a.semesterOrder !== b.semesterOrder) {
            return a.semesterOrder - b.semesterOrder
        }
        return a.subject.name.localeCompare(b.subject.name)
    })
}

// Query với điều kiện lọc nâng cao
async function getSubjectsNeedToOpenClassAdvanced(
    prisma: PrismaClient,
    filters: {
        semesterId: string
        schoolYearId?: string
        trainingObjectTypeId?: string
        trainingCourseId?: string
        curriculumVersionId?: string
        minStudents?: number
    }
) {
    const {
        semesterId,
        schoolYearId,
        trainingObjectTypeId,
        trainingCourseId,
        curriculumVersionId,
        minStudents = 1,
    } = filters

    // Lấy thông tin học kỳ
    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: { schoolYear: true },
    })

    if (!semester) {
        throw new Error('Không tìm thấy học kỳ')
    }

    const currentSchoolYear = new Date(
        semester.schoolYear.startDate
    ).getFullYear()

    // Tìm các môn học đã có lớp
    const existingSubjectClasses = await prisma.subjectClass.findMany({
        where: {
            semesterId: semesterId,
            active: true,
            deletedAt: null,
        },
        select: { subjectId: true },
    })

    const existingSubjectIds = existingSubjectClasses.map((sc) => sc.subjectId)

    // Build điều kiện lọc cho lớp biên chế
    const fixedClassWhere = {
        active: true,
        deletedAt: null,
        graduated: { not: true },
        trainingCourse: {
            active: true,
            deletedAt: null,
            ...(trainingCourseId && { id: trainingCourseId }),
            ...(trainingObjectTypeId && { trainingObjectTypeId }),
            semesterStart: {
                schoolYearId: schoolYearId || semester.schoolYearId,
            },
        },
        curriculumVersion: {
            active: true,
            deletedAt: null,
            ...(curriculumVersionId && { id: curriculumVersionId }),
        },
    }

    // Thực hiện query
    const result = await prisma.fixedClass.findMany({
        where: fixedClassWhere,
        include: {
            trainingCourse: {
                include: {
                    semesterStart: {
                        include: {
                            schoolYear: true,
                        },
                    },
                    trainingObjectType: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: true,
                    trainingBlocks: {
                        where: { active: true, deletedAt: null },
                        include: {
                            trainingBlock: true,
                            subjects: {
                                where: {
                                    active: true,
                                    deletedAt: null,
                                    subjectId: { notIn: existingSubjectIds },
                                },
                                include: {
                                    subject: {
                                        include: { subject: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            students: {
                where: {
                    active: true,
                    deletedAt: null,
                    status: 'ENROLLED',
                },
            },
        },
    })

    // Xử lý kết quả
    const subjectMap = new Map()

    for (const fixedClass of result) {
        if (
            !fixedClass.curriculumVersion ||
            !fixedClass.trainingCourse ||
            fixedClass.students.length < minStudents
        ) {
            continue
        }

        // Tính toán học kỳ hiện tại dựa trên năm bắt đầu khóa học và năm hiện tại
        const trainingStartYear = new Date(
            fixedClass.trainingCourse.semesterStart.schoolYear.startDate
        ).getFullYear()
        const yearsSinceStart = currentSchoolYear - trainingStartYear
        const currentSemesterInCourse = yearsSinceStart * 2 + semester.order // Giả sử mỗi năm có 2 học kỳ

        for (const trainingBlock of fixedClass.curriculumVersion
            .trainingBlocks) {
            for (const subject of trainingBlock.subjects) {
                // Chỉ lấy môn học của học kỳ hiện tại
                if (subject.semester !== currentSemesterInCourse) {
                    continue
                }

                const key = `${subject.subjectId}_${subject.semester}`

                if (!subjectMap.has(key)) {
                    subjectMap.set(key, {
                        subjectVersion: subject.subject,
                        subject: subject.subject.subject,
                        trainingBlock: trainingBlock.trainingBlock.name,
                        curriculum:
                            fixedClass.curriculumVersion.curriculum.name,
                        fixedClasses: [],
                        totalStudents: 0,
                        semesterOrder: subject.semester,
                        subjectType: subject.type,
                        credit: subject.subject.credit,
                        period: subject.subject.period,
                        examType: subject.subject.examType,
                        useForFinalScore: subject.useForFinalScore,
                        graduation: subject.graduation,
                        project: subject.project,
                    })
                }

                const subjectData = subjectMap.get(key)
                subjectData.fixedClasses.push({
                    id: fixedClass.id,
                    name: fixedClass.name,
                    studentCount: fixedClass.students.length,
                    trainingCourse: fixedClass.trainingCourse?.name || '',
                    trainingObjectType:
                        fixedClass.trainingCourse?.trainingObjectType?.name ||
                        '',
                    trainingStartYear: trainingStartYear,
                    currentSemesterInCourse: currentSemesterInCourse,
                })
                subjectData.totalStudents += fixedClass.students.length
            }
        }
    }

    return {
        semester: semester,
        subjects: Array.from(subjectMap.values())
            .filter((subject) => subject.totalStudents >= minStudents)
            .sort((a, b) => {
                if (a.semesterOrder !== b.semesterOrder) {
                    return a.semesterOrder - b.semesterOrder
                }
                return a.subject.name.localeCompare(b.subject.name)
            }),
    }
}

const result = await getSubjectsNeedToOpenClass(prisma, 'HK1_2526')
// const result = await getSubjectsNeedToOpenClassAdvanced(prisma, {
//     semesterId: 'HK1_2526',
//     minStudents: 10,
// })

console.log(result)
