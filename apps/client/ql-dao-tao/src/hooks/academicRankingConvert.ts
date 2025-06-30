import type { AcademicRankingConvert } from '@workspace/db'
import { useMemo } from 'react'

export function useAcademicRankingConverter(scoreRanges: AcademicRankingConvert[] = []) {
    const filteredAndSortedRanges = useMemo(() => {
        return [...scoreRanges]
            .filter((range) => range?.base4Min !== null && range?.base4Min !== undefined && range.base4Min >= 2.0)
            .sort((a, b) => (b.base4Min ?? 0) - (a.base4Min ?? 0))
    }, [scoreRanges])

    const convertAcademicRanking = (finalScore: number) => {
        const matched = filteredAndSortedRanges.find(
            (range) =>
                range.base4Min !== null &&
                range.base4Min !== undefined &&
                range.base4Max !== null &&
                range.base4Max !== undefined &&
                finalScore >= range.base4Min &&
                finalScore < range.base4Max
        )

        return {
            classification: matched?.classification || '',
            graduated: matched?.graduated || false,
        }
    }

    return { convertAcademicRanking }
}
