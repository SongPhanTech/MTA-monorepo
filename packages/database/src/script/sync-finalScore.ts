import { calcFinalScore } from '../../../libs/src/utils'
import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

// const scores = await prisma.studentSubjectScore.findMany({
//     where: {
//         attendanceScore: null,
//         midtermScore: null,
//         examScore: { not: null },
//     },
// })

// for (const sc of scores) {
//     await prisma.studentSubjectScore.update({
//         where: { id: sc.id },
//         data: {
//             attendanceScore: sc.examScore,
//             midtermScore: sc.examScore,
//         },
//     })
// }

const subjectScores = await prisma.studentSubjectScore.findMany({
    where: { finalScore: null },
    select: {
        id: true,
        subjectClass: {
            select: {
                type: true,
            },
        },
        certificates: {
            select: {
                archivedCertificate: {
                    select: {
                        finalScore: true,
                    },
                },
            },
        },
        awards: {
            where: {
                status: 'APPROVED',
            },
            select: {
                status: true,
                archivedAward: {
                    select: {
                        bonusScore: true,
                    },
                },
            },
        },
        attendanceScore: true,
        midtermScore: true,
        examScore: true,
        student: {
            select: {
                fixedClass: {
                    select: {
                        trainingCourse: {
                            select: {
                                coef_1: true,
                                coef_2: true,
                                coef_3: true,
                                scoreToTakeExam: true,
                                scoreToPass: true,
                                maxReExamScore: true,
                                reduceReExamScore: true,
                                examScoreToPass: true,
                            },
                        },
                    },
                },
            },
        },
    },
})

const defaultCoef = {
    coef_1: 0.1,
    coef_2: 0.3,
    coef_3: 0.6,
    scoreToTakeExam: 1,
    scoreToPass: 4,
    maxReExamScore: 10,
    reduceReExamScore: 0,
    examScoreToPass: 5,
}

const updates = subjectScores.map((s) => {
    const finalScore = calcFinalScore(
        s.student.fixedClass?.trainingCourse || defaultCoef,
        s,
        s.subjectClass?.type || 'NORMAL'
    )

    return { id: s.id, finalScore }
})

const result = await prisma.$executeRawUnsafe(`
        UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
        SET
            "finalScore" = data."finalScore",
            "updatedAt" = NOW()
        FROM (
            VALUES
            ${updates
                .map(
                    (u) => `(
                        '${u.id}',
                        ${u.finalScore === null ? 'NULL::double precision' : u.finalScore}
                    )`
                )
                .join(',\n')}
        ) AS data("id", "finalScore")
        WHERE sss.id = data.id;
        `)

console.log(result)
