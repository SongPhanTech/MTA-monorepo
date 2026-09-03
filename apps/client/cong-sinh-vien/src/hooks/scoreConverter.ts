import type { ScoreConvert } from "@workspace/db/client"
import {
  convertScoreWithCourseConfig,
  type CourseScoreConfig,
} from "@workspace/libs/utils"
import { useCallback, useMemo } from "react"

export function useScoreConverter(scoreRanges: ScoreConvert[] = []) {
  const sortedRanges = useMemo(() => {
    return [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)
  }, [scoreRanges])

  const convertScore = useCallback(
    (finalScore: number, config?: CourseScoreConfig) =>
      convertScoreWithCourseConfig(finalScore, sortedRanges, config),
    [sortedRanges]
  )

  return { convertScore }
}
