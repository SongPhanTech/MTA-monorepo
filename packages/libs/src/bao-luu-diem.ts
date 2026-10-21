export const ScoreConvertSource = {
  TRANSFER: "TRANSFER",
  EXTERNAL: "EXTERNAL",
  ABROAD: "ABROAD",
} as const

export type ScoreConvertSource = (typeof ScoreConvertSource)[keyof typeof ScoreConvertSource]

export const SCORE_CONVERT_SOURCE_OPTIONS: { value: ScoreConvertSource; label: string }[] = [
  { value: ScoreConvertSource.TRANSFER, label: "Chuyển trường" },
  { value: ScoreConvertSource.EXTERNAL, label: "Học ngoài học viện" },
  { value: ScoreConvertSource.ABROAD, label: "Học nước ngoài" },
]

const SCORE_DESCRIPTION: Record<ScoreConvertSource, string> = {
  TRANSFER: "Điểm sinh viên chuyển trường",
  EXTERNAL: "Điểm bảo lưu học ngoài học viện",
  ABROAD: "Điểm bảo lưu học nước ngoài",
}

export const BAO_LUU_SCORE_DESCRIPTIONS = [
  SCORE_DESCRIPTION.EXTERNAL,
  SCORE_DESCRIPTION.ABROAD,
] as const

export const BAO_LUU_TEXT_COLOR = "#15803d"
export const BAO_LUU_EXCEL_COLOR = "FF15803D"

const SOURCE_PREFIX = /^\[nguon:(TRANSFER|EXTERNAL|ABROAD)\]\n?/

export function isBaoLuuScoreDescription(description?: string | null): boolean {
  if (description === SCORE_DESCRIPTION.EXTERNAL || description === SCORE_DESCRIPTION.ABROAD) {
    return true
  }
  if (!description?.startsWith("[nguon:")) return false
  const source = decodeScoreConvertNote(description).source
  return source === ScoreConvertSource.EXTERNAL || source === ScoreConvertSource.ABROAD
}

export function visibleScoreNote(description?: string | null): string {
  return decodeScoreConvertNote(description).note
}

export function baoLuuScoreDescriptionWhere() {
  return {
    OR: [
      { description: { startsWith: "[nguon:EXTERNAL]" } },
      { description: { startsWith: "[nguon:ABROAD]" } },
      { description: { in: [...BAO_LUU_SCORE_DESCRIPTIONS] } },
    ],
  }
}

export function encodeScoreConvertNote(source: ScoreConvertSource, note?: string | null): string {
  const body = (note ?? "").replace(SOURCE_PREFIX, "").trim()
  return body ? `[nguon:${source}]\n${body}` : `[nguon:${source}]`
}

export function decodeScoreConvertNote(description?: string | null): {
  source: ScoreConvertSource
  note: string
} {
  const match = description?.match(/^\[nguon:(TRANSFER|EXTERNAL|ABROAD)\]\n?([\s\S]*)$/)
  if (!match) {
    return { source: ScoreConvertSource.TRANSFER, note: description ?? "" }
  }
  return { source: match[1] as ScoreConvertSource, note: match[2] ?? "" }
}

export function baoLuuRowProps(baoLuu: boolean): {
  className?: string
  style?: { color: string }
} {
  if (!baoLuu) return {}
  return {
    className: "[&>td]:!text-[#15803d]",
    style: { color: BAO_LUU_TEXT_COLOR },
  }
}
