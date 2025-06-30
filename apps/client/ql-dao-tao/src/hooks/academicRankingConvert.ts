import type { AcademicRankingConvert } from '@workspace/db'
import { useMemo } from 'react'

export function useAcademicRankingConverter(scoreRanges: AcademicRankingConvert[] = []) {
    const filteredAndSortedRanges = useMemo(() => {
        return [...scoreRanges]
            .filter((range) => range.base4Min >= 2.0)
            .sort((a, b) => b.base4Min - a.base4Min)
    }, [scoreRanges])

    const convertAcademicRanking = (finalScore: number) => {
        const matched = filteredAndSortedRanges.find(
            (range) => finalScore >= range.base4Min && finalScore < range.base4Max
        )

        return {
            classification: matched?.classification || '',
            graduated: matched?.graduated || false,
        }
    }

    return { convertAcademicRanking }
}
