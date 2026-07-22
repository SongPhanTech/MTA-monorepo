import {
  CouncilRole,
  type DefaultCouncilRolePayAmount,
  type DefaultSupervisorPayAmount,
  type SupervisorRole,
  TrainingObjectTypes,
} from "@workspace/db/client"
import "@workspace/libs/utils"

const THESIS_PAY_DESCRIPTION = "THESIS"

export function readDecimalAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || 0
  if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value) || 0
}

export function formatAmountWithComma(amount: number) {
  if (!amount) return "0"
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function getCouncilDefaultPayAmount(
  amounts: DefaultCouncilRolePayAmount[] | undefined,
  role: CouncilRole,
  inAcademy: boolean
): number {
  if (!amounts?.length) return 0
  const row =
    amounts.find(
      (x) =>
        x.role === role &&
        x.inAcademy === inAcademy &&
        (x.description === THESIS_PAY_DESCRIPTION || !x.description)
    ) ?? amounts.find((x) => x.role === role && x.inAcademy === inAcademy)
  return row ? readDecimalAmount(row.amount) : 0
}

export function getSupervisorDefaultPayAmount(
  amounts: DefaultSupervisorPayAmount[] | undefined,
  role: SupervisorRole,
  inAcademy: boolean
): number {
  if (!amounts?.length) return 0
  const row =
    amounts.find(
      (x) =>
        x.role === role &&
        x.inAcademy === inAcademy &&
        (x.description === THESIS_PAY_DESCRIPTION || !x.description)
    ) ?? amounts.find((x) => x.role === role && x.inAcademy === inAcademy)
  return row ? readDecimalAmount(row.amount) : 0
}

export function resolveCouncilMemberPayAmount(
  member: { role: CouncilRole; payment?: { amount?: unknown } | null },
  expert: { lecturerId?: string | null; lecturer?: unknown } | null | undefined,
  councilDefaults: DefaultCouncilRolePayAmount[]
): number {
  const recorded = readDecimalAmount(member.payment?.amount)
  if (recorded > 0) return recorded
  const inAcademy = !!(expert?.lecturerId || expert?.lecturer)
  return getCouncilDefaultPayAmount(councilDefaults, member.role, inAcademy)
}

export function getSupervisorName(
  expert:
    | {
        name?: string | null
        workplace?: string | null
        lecturerId?: string | null
        academicRankType?: { sMa?: string | null } | null
        academicDegreeType?: { sMa?: string | null } | null
        lecturer?: {
          userProfile?: {
            fullname?: string | null
            academicRankType?: { sMa?: string | null } | null
            academicDegreeType?: { sMa?: string | null } | null
          } | null
        } | null
      }
    | null
    | undefined,
  showWorkplace = false
) {
  if (!expert) return ""
  const profile = expert.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert.name || profile?.fullname || ""
  const workplace = expert.workplace || ""
  const text = [title, fullname].filter(Boolean).join(" ").trim()
  return [text, showWorkplace ? workplace : ""].filter(Boolean).join(", ")
}

export const tenDoiTuong: Record<string, { fullname: string; shortname: string }> = {
  [TrainingObjectTypes.MILITARY]: { fullname: "Quân sự", shortname: "QS" },
  [TrainingObjectTypes.CIVILIAN]: { fullname: "Dân sự", shortname: "DS" },
  [TrainingObjectTypes.INTERNATIONAL_MILITARY]: {
    fullname: "Quân sự quốc tế",
    shortname: "QSQT",
  },
}

export const councilRoleOrder: Partial<Record<CouncilRole, number>> = {
  [CouncilRole.CHAIRMAN]: 1,
  [CouncilRole.SECRETARY]: 2,
  [CouncilRole.REVIEWER_1]: 3,
  [CouncilRole.REVIEWER_2]: 4,
  [CouncilRole.MEMBER]: 5,
}
