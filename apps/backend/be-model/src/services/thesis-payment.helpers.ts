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
  expert:
    | {
        inAcademy?: boolean | null
        lecturerId?: string | null
        lecturer?: unknown
        expert?: { lecturerId?: string | null; lecturer?: unknown } | null
      }
    | null
    | undefined,
  councilDefaults: DefaultCouncilRolePayAmount[]
): number {
  const recorded = readDecimalAmount(member.payment?.amount)
  if (recorded > 0) return recorded
  const inAcademy = resolveInAcademy(expert)
  return getCouncilDefaultPayAmount(councilDefaults, member.role, inAcademy)
}

export function resolveInAcademy(
  person?: {
    inAcademy?: boolean | null
    lecturerId?: string | null
    lecturer?: unknown
    expert?: { lecturerId?: string | null; lecturer?: unknown } | null
  } | null
): boolean {
  if (!person) return true
  if (typeof person.inAcademy === "boolean") return person.inAcademy
  return !!(
    person.expert?.lecturerId ||
    person.expert?.lecturer ||
    person.lecturerId ||
    person.lecturer
  )
}

/** Prefer assigned version snapshot for council member. */
export function councilMemberProfile(
  member:
    | {
        expertProfileVersion?: unknown
        expert?: { currentVersion?: unknown } | unknown
      }
    | null
    | undefined
) {
  const expert = member?.expert as { currentVersion?: unknown } | undefined
  return (member?.expertProfileVersion ?? expert?.currentVersion ?? member?.expert ?? null) as any
}

/** workplace ưu tiên; fallback organization (nhiều bản ngoài HV chỉ có organization). */
export function resolveExpertWorkplace(
  expert?: {
    workplace?: string | null
    organization?: string | null
    lecturer?: { userProfile?: { donVi?: { sTen?: string | null } | null } | null } | null
    expert?: {
      lecturer?: { userProfile?: { donVi?: { sTen?: string | null } | null } | null } | null
    } | null
  } | null
): string {
  if (!expert) return ""
  const organization = typeof expert.organization === "string" ? expert.organization.trim() : ""
  const lecturerOrganization =
    expert.lecturer?.userProfile?.donVi?.sTen?.trim() ||
    expert.expert?.lecturer?.userProfile?.donVi?.sTen?.trim() ||
    ""
  return expert.workplace?.trim() || organization || lecturerOrganization || ""
}

export function getSupervisorName(
  expert:
    | {
        name?: string | null
        workplace?: string | null
        organization?: string | null
        lecturerId?: string | null
        expert?: {
          lecturer?: {
            organization?: { sTen?: string | null } | null
            userProfile?: {
              fullname?: string | null
              academicRankType?: { sMa?: string | null } | null
              academicDegreeType?: { sMa?: string | null } | null
            } | null
          } | null
        } | null
        academicRankType?: { sMa?: string | null } | null
        academicDegreeType?: { sMa?: string | null } | null
        lecturer?: {
          organization?: { sTen?: string | null } | null
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
  const profile = expert.expert?.lecturer?.userProfile || expert.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert.name || profile?.fullname || ""
  const workplace = resolveExpertWorkplace(expert)
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
