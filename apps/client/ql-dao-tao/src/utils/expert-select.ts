import type { PersonLike } from "./thesis-profile"

/** Flatten Expert + currentVersion for select options (value = Expert.id). */
export function flattenExpertForSelect<
  T extends {
    id: string
    lecturerId?: string | null
    currentVersionId?: string | null
    lecturer?: PersonLike["lecturer"] | null
    currentVersion?: (PersonLike & {
      eligiblePresident?: boolean | null
      eligibleSecretary?: boolean | null
      inAcademy?: boolean | null
      phone?: string | null
      email?: string | null
      bankAccountNumber?: string | null
      bankName?: string | null
      position?: string | null
    }) | null
  },
>(expert: T) {
  const v = expert.currentVersion
  return {
    id: expert.id,
    currentVersionId: expert.currentVersionId ?? v?.id ?? null,
    lecturerId: expert.lecturerId,
    lecturer: expert.lecturer,
    name: v?.name,
    workplace: v?.workplace,
    position: v?.position,
    phone: v?.phone,
    email: v?.email,
    bankAccountNumber: v?.bankAccountNumber,
    bankName: v?.bankName,
    academicRankType: v?.academicRankType,
    academicDegreeType: v?.academicDegreeType,
    eligiblePresident: v?.eligiblePresident,
    eligibleSecretary: v?.eligibleSecretary,
    inAcademy: v?.inAcademy ?? !!expert.lecturerId,
  }
}

/** PersonLike từ ExpertProfileVersion đã gán (có thể kèm expert.lecturer). */
export function versionToPersonLike(
  version?:
    | (PersonLike & {
        expert?: { lecturer?: PersonLike["lecturer"] | null } | null
        inAcademy?: boolean | null
      })
    | null
): PersonLike | null {
  if (!version) return null
  return {
    ...version,
    lecturer: version.expert?.lecturer ?? version.lecturer,
  }
}
