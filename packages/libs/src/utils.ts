import type { Prisma } from '@workspace/db'

export function splitFullName(fullName?: string): {
    firstName: string
    lastName: string
} {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: '', lastName: '' }
    }
    const parts = fullName.trim().split(/\s+/)

    const firstName = parts.pop() || '' // Lấy phần cuối cùng làm tên
    const lastName = parts.join(' ') // Phần còn lại là họ + tên đệm

    return { firstName, lastName }
}

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

    if (rawFinalScore === null && maxCertFinalScore === null) {
        return null
    }

    if (rawFinalScore && rawFinalScore < coef.scoreToPass) {
        return rawFinalScore
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
