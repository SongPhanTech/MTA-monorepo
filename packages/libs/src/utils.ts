import type { Prisma, ScoreConvert, StudentSubjectScore } from '@workspace/db'
import Decimal from 'decimal.js'

type StudentSubjectScoreRelation = StudentSubjectScore & {
    finalScore: Decimal | null
    student?: {
        fixedClass?: {
            trainingCourse?: {
                scoreConverts: ScoreConvert[] | null
            } | null
        } | null
    }
}

type ScoreStats = { count: number; percentage: number }

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
): Decimal | null => {
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
        return new Decimal(rawFinalScore)
    }

    const bonusScore = subjectScore.awards.reduce(
        (prev, curr) => prev + curr.archivedAward.bonusScore,
        0
    )

    return Decimal.min(Math.max(rawFinalScore || 0, maxCertFinalScore || 0) + bonusScore, 10)
}

function getScoreClassification(finalScore: Decimal | null, scoreConverts: ScoreConvert[]) {
    if (!finalScore) {
        return { classification: 'Vắng', base10Max: null }
    }

    const rank = scoreConverts.find(
        (item) => finalScore.gte(item.base10Min) && finalScore.lte(item.base10Max)
    )

    const classification = rank
        ? `${rank.classification}${rank.pass ? '' : '(Không đạt)'}`
        : 'Không xác định'

    const base10Max = rank ? rank.base10Max : null

    return { classification, base10Max }
}

export function getScoreStatistics(
    dataTable: StudentSubjectScoreRelation[]
): Record<string, ScoreStats> {
    if (!dataTable.length) {
        return {}
    }

    const stats = new Map<string, { count: number; base10Max: number | null }>()

    dataTable.forEach((row) => {
        const finalScore = row.finalScore
        const scoreConverts = row.student?.fixedClass?.trainingCourse?.scoreConverts ?? []

        const { classification, base10Max } = getScoreClassification(finalScore, scoreConverts)

        const entry = stats.get(classification)
        if (entry) {
            entry.count += 1
        } else {
            stats.set(classification, { count: 1, base10Max })
        }
    })

    const total = dataTable.length
    const result: Record<string, ScoreStats> = {}
    let accumulatedPercentage = 0

    const entries = Array.from(stats.entries()).sort(
        (a, b) => Number(a[1].base10Max) - Number(b[1].base10Max)
    )

    entries.forEach(([classification, { count }], index) => {
        let percentage: number

        if (index === entries.length - 1) {
            percentage = Number.parseFloat((100 - accumulatedPercentage).toFixed(2))
        } else {
            percentage = Number.parseFloat(((count / total) * 100).toFixed(2))
            accumulatedPercentage += percentage
        }

        result[classification] = { count, percentage }
    })

    return result
}

export type ItemProps = {
    value: string
    label: string
}
export function diffArrays(a: ItemProps[], b: ItemProps[]) {
    const onlyInA = a.filter((itemA) => !b.some((itemB) => itemA.value === itemB.value))

    const onlyInB = b.filter((itemB) => !a.some((itemA) => itemA.value === itemB.value))

    const both = a.filter((itemA) => b.some((itemB) => itemA.value === itemB.value))

    return { onlyInA, onlyInB, both }
}
