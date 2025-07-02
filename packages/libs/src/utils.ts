import type { Prisma, ScoreConvert, StudentSubjectScore } from '@workspace/db'

interface StudentSubjectScoreRelation extends StudentSubjectScore {
    finalScore: number | null
    student?: {
        fixedClass?: {
            trainingCourse?: {
                scoreConverts: ScoreConvert[] | null
            } | null
        } | null
    }
}

interface ScoreStats {
    count: number
    percentage: number
}

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
        ? Math.max(...subjectScore.certificates.map((cert) => cert.archivedCertificate.finalScore))
        : null

    if (rawFinalScore === null && maxCertFinalScore === null) {
        return null
    }

    if (rawFinalScore && maxCertFinalScore === null && rawFinalScore < coef.scoreToPass) {
        return rawFinalScore
    }

    const bonusScore = subjectScore.awards.reduce(
        (prev, curr) => prev + curr.archivedAward.bonusScore,
        0
    )

    return Math.min(Math.max(rawFinalScore || 0, maxCertFinalScore || 0) + bonusScore, 10)
}

function getScoreClassification(finalScore: number, scoreConverts: ScoreConvert[]): string {
    const match = scoreConverts.find(
        (item) => finalScore >= item.base10Min && finalScore <= item.base10Max
    )

    const raw = match?.classification ?? 'Không xác định'

    if (raw === 'Kém') return 'Kém(Không đạt)'
    return raw
}

export function getScoreStatistics(
    dataTable: StudentSubjectScoreRelation[]
): Record<string, ScoreStats> {
    const stats = new Map<string, number>()

    dataTable.forEach((row) => {
        const finalScore = row.finalScore
        const scoreConverts = row.student?.fixedClass?.trainingCourse?.scoreConverts ?? []

        let classification: string

        if (finalScore == null) {
            classification = 'Vắng'
        } else {
            classification = getScoreClassification(finalScore, scoreConverts)
        }

        stats.set(classification, (stats.get(classification) || 0) + 1)
    })

    const total = dataTable.length
    const result: Record<string, ScoreStats> = {}
    let accumulatedPercentage = 0

    const entries = Array.from(stats.entries())

    entries.forEach(([type, count], index) => {
        let percentage: number

        if (index === entries.length - 1) {
            percentage = Number.parseFloat((100 - accumulatedPercentage).toFixed(2))
        } else {
            percentage = total > 0 ? Number.parseFloat(((count / total) * 100).toFixed(2)) : 0
            accumulatedPercentage += percentage
        }

        result[type] = { count, percentage }
    })

    return result
}
