import type { ScoreConvert } from "@workspace/db/client"
import { useMemo } from "react"

export function useScoreConverter(scoreRanges: ScoreConvert[] = []) {
  const sortedRanges = useMemo(() => {
    return [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)
  }, [scoreRanges])

  const convertScore = (finalScore: number) => {
    const matched = sortedRanges.find(
      (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
    )

    if (!matched) {
      return {
        base4: null,
        letter: "-",
        classification: "Không xác định",
        pass: false,
        improvementRegister: false,
      }
    }

    return {
      base4: matched.base4,
      letter: matched.letter,
      classification: matched.classification,
      pass: matched.pass,
      improvementRegister: matched.improvementRegister,
    }
  }

  return { convertScore }
}

export function scoreConvert(finalScore: number, scoreRanges: ScoreConvert[] = []) {
  const sortedRanges = [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)

  const matched = sortedRanges.find(
    (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
  )

  if (!matched) {
    return {
      base4: null,
      letter: "-",
      classification: "Không xác định",
      pass: false,
      improvementRegister: false,
    }
  }

  return {
    base4: matched.base4,
    letter: matched.letter,
    classification: matched.classification,
    pass: matched.pass,
    improvementRegister: matched.improvementRegister,
  }
}
