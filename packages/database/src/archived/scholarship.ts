import {
    type Prisma,
    PrismaClient,
    type ScholarshipCriteria,
    type StudentTrainingType,
} from '@prisma/client'

const prisma = new PrismaClient()

// seed học bổng Lê Quý Đôn
const trainingCourses = await prisma.trainingCourse.findMany()
for (const course of trainingCourses) {
    // Tạo học bổng Lê Quý Đôn
    const leQuyDon = await prisma.scholarship.create({
        data: {
            trainingCourseId: course.id,
            name: 'Học bổng Lê Quý Đôn',
            description: 'Áp dụng cho học viên quân sự có TBHK >= 9.0',
            baseAmount: 2000000,
            multiplier: 1,
            effectiveFrom: new Date('2025-01-01'),
        },
    })

    await prisma.scholarshipCriteria.createMany({
        data: [
            {
                scholarshipId: leQuyDon.id,
                field: 'TOTAL_CREDITS',
                operator: 'GTE',
                value: 10,
            },
            {
                scholarshipId: leQuyDon.id,
                field: 'COURSE_GRADE_MIN',
                operator: 'GTE',
                value: 7.0,
            },
            {
                scholarshipId: leQuyDon.id,
                field: 'SEMESTER_GPA',
                operator: 'GTE',
                value: 9.0,
            },
            {
                scholarshipId: leQuyDon.id,
                field: 'CONDUCT',
                operator: 'GTE',
                value: 3, // giả sử: 0=WEAK, 1=AVERAGE, ..., 4=EXCELLENT
            },
            {
                scholarshipId: leQuyDon.id,
                field: 'FOREIGN_LANGUAGE',
                operator: 'EQ',
                value: 1,
            },
        ],
    })

    // Học bổng dân sự loại Xuất sắc
    const civilExcellent = await prisma.scholarship.create({
        data: {
            trainingCourseId: course.id,
            name: 'Học bổng Khuyến khích Xuất sắc',
            code: 'HB_CIVIL_EXCELLENT',
            description: 'Sinh viên dân sự đạt loại Xuất sắc',
            baseAmount: 1000000,
            multiplier: 1.4,
            effectiveFrom: new Date('2025-01-01'),
        },
    })

    await prisma.scholarshipCriteria.createMany({
        data: [
            {
                scholarshipId: civilExcellent.id,
                field: 'COURSE_GRADE_MIN',
                operator: 'GTE',
                value: 4.0, // điểm D trở lên
            },
            {
                scholarshipId: civilExcellent.id,
                field: 'SEMESTER_GPA',
                operator: 'GTE',
                value: 9.0,
            },
            {
                scholarshipId: civilExcellent.id,
                field: 'CONDUCT',
                operator: 'EQ',
                value: 4, // EXCELLENT
            },
            {
                scholarshipId: civilExcellent.id,
                field: 'ACCUMULATED_CREDITS_PERCENT',
                operator: 'GTE',
                value: 90,
            },
        ],
    })

    // Cộng điểm ưu tiên cho học viên quốc tế quân sự
    await prisma.scholarshipCriteria.create({
        data: {
            scholarshipId: leQuyDon.id,
            field: 'SEMESTER_GPA',
            operator: 'GTE',
            value: 9.0,
            bonusValue: 0.1,
            description: 'Cộng 0.1 GPA cho học viên quốc tế quân sự',
        },
    })
}
// end seed

export async function evaluateScholarships(
    semesterId: string,
    trainingCourseId: string,
    trainingMajorIds: string[]
) {
    const scholarships = await prisma.scholarship.findMany({
        where: {
            trainingCourseId,
            effectiveFrom: { lte: new Date() },
            effectiveTo: { gte: new Date() },
        },
        include: { criteria: true },
    })

    const results = await prisma.studentSemesterResult.findMany({
        where: {
            semesterId,
            student: {
                fixedClass: { trainingCourseId },
                ...(trainingMajorIds
                    ? {
                          curriculumVersion: {
                              curriculum: { trainingMajorId: { in: trainingMajorIds } },
                          },
                      }
                    : {}),
            },
        },
        include: {
            student: {
                include: {
                    studentTrainingSemester: { where: { semesterId } },
                    trainingObjectType: true,
                    fixedClass: {
                        select: {
                            curriculumVersion: {
                                select: {
                                    curriculum: {
                                        select: {
                                            trainingMajor: {
                                                select: {
                                                    trainingField: {
                                                        select: {
                                                            trainingObjectTypes: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    for (const scholarship of scholarships) {
        const candidates: { result: (typeof results)[number]; calculatedGPA: number }[] = []

        for (const result of results) {
            let isEligible = true
            let calculatedGPA = result.gpa

            for (const criterion of scholarship.criteria) {
                const satisfied = checkCriterion(result, criterion)
                if (!satisfied && criterion.bonusValue == null) {
                    isEligible = false
                    break
                }

                // Nếu thoả mãn điều kiện bonus, cộng điểm
                if (satisfied && criterion.bonusValue) {
                    calculatedGPA += criterion.bonusValue
                }
            }

            if (isEligible) {
                candidates.push({ result, calculatedGPA })
            }
        }

        // Xếp hạng theo GPA giảm dần
        const sorted = candidates.sort((a, b) => b.calculatedGPA - a.calculatedGPA)

        // Ghi lại kết quả
        let priorityRank = 1
        for (const award of sorted) {
            const amount = scholarship.baseAmount.mul(scholarship.multiplier).round().toNumber()

            await prisma.scholarshipAward.upsert({
                where: {
                    studentId_scholarshipId_semesterId: {
                        studentId: award.result.studentId,
                        scholarshipId: scholarship.id,
                        semesterId,
                    },
                },
                update: {
                    amount,
                    gpaAtAward: award.calculatedGPA,
                    priorityRank,
                },
                create: {
                    studentId: award.result.studentId,
                    scholarshipId: scholarship.id,
                    semesterId,
                    amount,
                    gpaAtAward: award.calculatedGPA,
                    priorityRank,
                },
            })
            priorityRank += 1
        }
    }
}

type StudentSemesterResult = Prisma.StudentSemesterResultGetPayload<{
    include: {
        student: {
            include: {
                studentTrainingSemester: true
            }
        }
    }
}>

function checkCriterion(result: StudentSemesterResult, criterion: ScholarshipCriteria): boolean {
    const val = (() => {
        switch (criterion.field) {
            case 'TOTAL_CREDITS':
                return result.totalCredits
            case 'REGISTERED_CREDITS':
                return result.registeredCredits
            case 'ACCUMULATED_CREDITS_PERCENT':
                return result.accumulatedCredits // giả định đã % sẵn
            case 'COURSE_GRADE_MIN':
                return 7.0 // chưa có dữ liệu chi tiết học phần, tạm mock
            case 'SEMESTER_GPA':
                return result.gpa
            case 'ENTRY_SCORE':
                return result.entryScore ?? 0
            case 'CONDUCT':
                return conductLevelToNumeric(
                    result.student.studentTrainingSemester[0]?.trainingType
                )
            case 'FOREIGN_LANGUAGE':
                return result.foreignLangPass ? 1 : 0
        }
    })()

    switch (criterion.operator) {
        case 'GTE':
            return val >= criterion.value
        case 'LTE':
            return val <= criterion.value
        case 'EQ':
            return val === criterion.value
    }
}

function conductLevelToNumeric(level: StudentTrainingType | undefined): number {
    switch (level) {
        case 'VERY_POOR':
            return 0
        case 'POOR':
            return 1
        case 'AVERAGE':
            return 2
        case 'MEDIUM':
            return 3
        case 'FAIR':
            return 4
        case 'GOOD':
            return 5
        default:
            return -1
    }
}
