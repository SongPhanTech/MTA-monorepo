import type { Prisma, ScoreConvert, StudentSubjectScore } from '@workspace/db'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'

export { fastIsEqual } from './fast-is-equal'

export function range(start: number, end: number): number[] {
    const result: number[] = []
    for (let i = start; i < end; i++) {
        result.push(i)
    }
    return result
}

export function parseDate(date?: string): dayjs.Dayjs {
    const dateFormats = [
        // Year = 4 digits
        'D/M/YYYY',
        'DD/M/YYYY',
        'D/MM/YYYY',
        'DD/MM/YYYY',

        // Year = 2 digits
        'D/M/YY',
        'DD/M/YY',
        'D/MM/YY',
        'DD/MM/YY',
    ]

    const trimmed = date?.replace(/^[']+|[']+$/g, '')
    return dayjs(trimmed, dateFormats, true)
}

type StudentSubjectScoreRelation = StudentSubjectScore & {
    finalScore: Decimal | null
    student?: {
        fixedClass?: {
            trainingCourse?: {
                scoreConverts?: ScoreConvert[] | null
                scoreToPass?: number | null
            } | null
        } | null
    }
}
declare global {
    interface Number {
        toFixedSmart(fractionDigits: number): string
        formatVND(): string
    }
    interface String {
        titleCase(): string
        firstCase(): string
    }
    interface Array<T> {
        compare(otherArray: T[], cb: (a: T, b: T) => boolean): boolean
    }
}

type ScoreStats = { count: number; percentage: number }

Number.prototype.toFixedSmart = function (fractionDigits: number): string {
    const fixed = this.toFixed(fractionDigits)
    return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}
Number.prototype.formatVND = function (): string {
    return this.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
        .replace('₫', 'VNĐ')
        .trim()
}
String.prototype.titleCase = function (): string {
    return this.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
}
String.prototype.firstCase = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase()
}

Array.prototype.compare = function <T>(
    this: T[],
    otherArray: T[],
    cb: (a: T, b: T) => boolean
): boolean {
    if (this.length !== otherArray.length) {
        return false
    }
    for (let i = 0; i < this.length; i++) {
        const otherItem = otherArray[i]
        const thisItem = this[i]
        if (!thisItem || !otherItem) {
            return false
        }
        if (!cb(thisItem, otherItem)) {
            return false
        }
    }
    return true
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
        select: {
            certificates: {
                select: {
                    archivedCertificate: {
                        select: {
                            finalScore: true
                        }
                    }
                }
            }
            awards: {
                select: {
                    archivedAward: {
                        select: {
                            bonusScore: true
                        }
                    }
                }
            }
            attendanceScore: true
            midtermScore: true
            examScore: true
        }
    }>
): Decimal | null => {
    // 1. Find max certificate final score
    const maxCertFinalScore = subjectScore.certificates?.length
        ? Decimal.max(
              ...subjectScore.certificates.map((cert) => cert?.archivedCertificate?.finalScore)
          ).toDecimalPlaces(1)
        : null

    // 2. Check if all score is 0
    if (
        (subjectScore.attendanceScore ?? subjectScore.midtermScore ?? subjectScore.examScore) === 0
    ) {
        return maxCertFinalScore || new Decimal(0)
    }

    // 3. Check if any score is null
    if (!subjectScore.attendanceScore || !subjectScore.midtermScore || !subjectScore.examScore) {
        return maxCertFinalScore || null
    }

    // 4. Calculate final score
    const finalScore =
        subjectScore.examScore < coef?.scoreToPass
            ? subjectScore.examScore
            : Math.min(
                  subjectScore.attendanceScore * coef?.coef_1 +
                      subjectScore.midtermScore * coef?.coef_2 +
                      subjectScore.examScore * coef?.coef_3,
                  10
              )

    if (maxCertFinalScore === null && finalScore < coef?.scoreToPass) {
        return new Decimal(finalScore).toDecimalPlaces(1)
    }

    const bonusScore = subjectScore.awards.reduce(
        (prev, curr) => prev + curr?.archivedAward?.bonusScore,
        0
    )

    return Decimal.min(
        Decimal.max(finalScore, maxCertFinalScore || 0).add(bonusScore),
        10
    ).toDecimalPlaces(1)
}

function getScoreClassification(
    finalScore: Decimal | null,
    examScore: Decimal | number | null,
    scoreConverts: ScoreConvert[],
    scoreToPass?: Decimal | number | null
) {
    // Nếu không có điểm thi ⇒ coi là Vắng
    if (
        examScore === null ||
        examScore === undefined ||
        (scoreToPass !== null && scoreToPass !== undefined && examScore < scoreToPass)
    ) {
        return { classification: 'Không đạt', base10Max: null }
    }

    // Nếu có điểm cuối cùng (finalScore), tìm classification
    const rank = scoreConverts.find(
        (item) => finalScore?.gte(item.base10Min) && finalScore?.lte(item.base10Max)
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
        const examScore = row?.examScore ?? null
        const scoreConverts = row?.student?.fixedClass?.trainingCourse?.scoreConverts ?? []
        const scoreToPass = row?.student?.fixedClass?.trainingCourse?.scoreToPass ?? null

        const { classification, base10Max } = getScoreClassification(
            finalScore,
            examScore,
            scoreConverts,
            scoreToPass
        )

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
    title?: string
    isParent?: boolean
}
export function diffArrays<T, K extends keyof T>(a: T[], b: T[], key: K) {
    const onlyInA = a.filter((itemA) => !b.some((itemB) => itemA[key] === itemB[key]))

    const onlyInB = b.filter((itemB) => !a.some((itemA) => itemA[key] === itemB[key]))

    const both = a.filter((itemA) => b.some((itemB) => itemA[key] === itemB[key]))

    return { onlyInA, onlyInB, both }
}

export function diffArraysKey<T>(a: T[], b: T[], keys: (keyof T)[]) {
    const getKey = (item: T) => keys.map((k) => String(item[k])).join('|')

    const bKeys = new Set(b.map(getKey))
    const aKeys = new Set(a.map(getKey))

    const onlyInA = a.filter((itemA) => !bKeys.has(getKey(itemA)))
    const onlyInB = b.filter((itemB) => !aKeys.has(getKey(itemB)))
    const both = a.filter((itemA) => bKeys.has(getKey(itemA)))

    return { onlyInA, onlyInB, both }
}

export function getFilenameFromContentDisposition(contentDispositionHeader: string): string | null {
    if (!contentDispositionHeader) {
        return null
    }

    // Regex to match filename or filename*
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%-.]+)(?:; ?|$)/i
    const asciiFilenameRegex = /filename=(["]?)(.*?)\1(?:; ?|$)/i

    let filename = null

    // Try to match UTF-8 encoded filename first
    let match = contentDispositionHeader.match(utf8FilenameRegex)
    if (match?.[1]) {
        filename = decodeURIComponent(match[1])
    } else {
        // If no UTF-8, try ASCII filename
        match = contentDispositionHeader.match(asciiFilenameRegex)
        if (match?.[2]) {
            filename = match[2].replace(/"/g, '') // Remove quotes
        }
    }

    return filename
}

export function genOriginalDiplomaNumber({
    prefix,
    suffix,
    currentNumber,
    maxLength,
}: {
    prefix?: string | null
    suffix?: string | null
    currentNumber?: number | null
    maxLength?: number | null
}): string {
    const serial =
        currentNumber && maxLength
            ? currentNumber.toString().padStart(maxLength, '0')
            : (currentNumber ?? '')
    return `${prefix || ''}${serial}${suffix || ''}`
}

export function* chunk<T>(arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) {
        yield arr.slice(i, i + size)
    }
}
