import { useTrainingObjectTypeStore } from "@workspace/ui"
import { useFindUniqueTrainingObjectType } from "@workspace/db/hooks"

export type ThesisTrack = "kltn" | "luan-van" | "both"

/** Seed TrainingLevel.code: ĐH → khóa luận; ThS/TS → luận văn/luận án */
const UNDERGRAD_CODES = new Set(["ĐH", "DH"])
const GRADUATE_CODES = new Set(["THS", "TS"])

function normalizeCode(code?: string | null) {
  return (code ?? "").trim().toUpperCase().normalize("NFC")
}

export function resolveThesisTrack(opts: {
  trainingLevelCode?: string | null
  trainingLevelName?: string | null
}): ThesisTrack {
  const code = normalizeCode(opts.trainingLevelCode)

  if (GRADUATE_CODES.has(code)) return "luan-van"
  if (UNDERGRAD_CODES.has(code)) return "kltn"

  // Fallback khi thiếu/sai code: chỉ đọc bậc đào tạo, không đọc tên đối tượng
  const levelName = (opts.trainingLevelName ?? "").toLowerCase().normalize("NFC")
  if (levelName.includes("thạc") || levelName.includes("tiến")) return "luan-van"
  if (levelName.includes("đại học") || levelName.includes("dai hoc")) return "kltn"

  return "both"
}

export function useThesisTrack(): ThesisTrack {
  const { id } = useTrainingObjectTypeStore()
  const { data } = useFindUniqueTrainingObjectType(
    {
      where: { id: id! },
      include: { trainingLevel: true },
    },
    { enabled: Boolean(id) }
  )

  return resolveThesisTrack({
    trainingLevelCode: data?.trainingLevel?.code,
    trainingLevelName: data?.trainingLevel?.name,
  })
}
