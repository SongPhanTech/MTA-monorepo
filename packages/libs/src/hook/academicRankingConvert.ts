import { $Enums, type AcademicRankingConvert } from "@workspace/db"
import { useMemo } from "react"

export function useAcademicRankingConverter(
  scoreRanges: AcademicRankingConvert[] = [],
  baseScore: $Enums.AcademicRankingBaseType = $Enums.AcademicRankingBaseType.Base4
) {
  const filteredAndSortedRanges = useMemo(() => {
    return [...scoreRanges]
      .filter((range) => range.graduated)
      .sort((a, b) =>
        baseScore === $Enums.AcademicRankingBaseType.Base4
          ? (b.base4Min ?? 0) - (a.base4Min ?? 0)
          : (b.base10Min ?? 0) - (a.base10Min ?? 0)
      )
  }, [scoreRanges, baseScore])

  const convertAcademicRanking = (finalScore: number) => {
    const matched = filteredAndSortedRanges.find((range) =>
      baseScore === $Enums.AcademicRankingBaseType.Base4
        ? !!range.base4Min &&
          !!range.base4Max &&
          finalScore >= range.base4Min &&
          finalScore < range.base4Max
        : !!range.base10Min &&
          !!range.base10Max &&
          finalScore >= range.base10Min &&
          finalScore < range.base10Max
    )

    return {
      classification: matched?.classification || "",
      graduated: !!matched?.graduated,
    }
  }

  return { convertAcademicRanking }
}
