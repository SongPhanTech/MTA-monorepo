import { calcFinalScore } from '@workspace/libs/utils'
import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

const subjectScores = await prisma.studentSubjectScore.findMany({
    select: {
        id: true,
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
            select: {
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
                                scoreToPass: true,
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
    scoreToPass: 4,
}

const updates = subjectScores.map((s) => {
    const finalScore = calcFinalScore(s.student.fixedClass?.trainingCourse || defaultCoef, s)

    return { id: s.id, finalScore }
})

await prisma.$executeRawUnsafe(`
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
