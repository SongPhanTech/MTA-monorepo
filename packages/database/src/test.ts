import { type Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const student = await prisma.student.findFirstOrThrow({
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
})

const score = await prisma.studentSubjectScore.findFirstOrThrow({
    include: {
        certificates: { include: { archivedCertificate: true } },
        awards: { include: { archivedAward: true } },
    },
})
console.log(JSON.stringify(score, null, 2))

export const calcFinalScore = (
    coef: Prisma.TrainingCourseGetPayload<{
        select: {
            coef_1: true
            coef_2: true
            coef_3: true
            scoreToPass: true
        }
    }>,
    subjectScore: Prisma.StudentSubjectScoreGetPayload<{
        include: {
            certificates: { include: { archivedCertificate: true } }
            awards: { include: { archivedAward: true } }
        }
    }>
) => {
    const rawFinalScore = !subjectScore.examScore
        ? null
        : subjectScore.examScore < coef.scoreToPass
          ? subjectScore.examScore
          : Math.min(
                (subjectScore.attendanceScore || 0) * coef.coef_1 +
                    (subjectScore.midtermScore || 0) * coef.coef_2 +
                    subjectScore.examScore * coef.coef_3,
                10
            )

    const maxCertFinalScore = subjectScore.certificates?.length
        ? Math.max(
              ...subjectScore.certificates.map(
                  (cert) => cert.archivedCertificate.finalScore
              )
          )
        : null

    if (rawFinalScore === null || maxCertFinalScore === null) {
        return null
    }

    const bonusScore = subjectScore.awards.reduce(
        (prev, curr) => prev + curr.archivedAward.bonusScore,
        0
    )

    return Math.min(
        Math.max(rawFinalScore || 0, maxCertFinalScore || 0) + bonusScore,
        10
    )
}

if (!student.fixedClass?.trainingCourse)
    throw new Error('fixed class not found')
const final = calcFinalScore(student.fixedClass.trainingCourse, score)
console.log(final)
