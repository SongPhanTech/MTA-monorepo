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
        expert?: { lecturer?: PersonLike["lecturer"] | null; lecturerId?: string | null } | null
        inAcademy?: boolean | null
      })
    | null
): PersonLike | null {
  if (!version) return null
  return {
    ...version,
    lecturer: version.expert?.lecturer ?? version.lecturer,
    lecturerId: version.expert?.lecturerId ?? (version as { lecturerId?: string | null }).lecturerId,
  }
}

/** inAcademy từ version đã gán (ưu tiên field tường minh). */
export function versionInAcademy(
  version?:
    | {
        inAcademy?: boolean | null
        expert?: { lecturerId?: string | null; lecturer?: unknown } | null
        lecturerId?: string | null
        lecturer?: unknown
      }
    | null
): boolean {
  if (!version) return true
  if (typeof version.inAcademy === "boolean") return version.inAcademy
  return !!(
    version.expert?.lecturerId ||
    version.expert?.lecturer ||
    version.lecturerId ||
    version.lecturer
  )
}

/**
 * Prefer hồ sơ đã gán trên quan hệ (version snapshot).
 * Dùng cho in/thanh toán — không nhảy theo Expert.currentVersion.
 *
 * Regression: sau khi reviseExpertVersion (đổi current),
 * councilMember.expertProfileVersion / thesis.supervisor vẫn trỏ version cũ.
 */
export function assignedExpertProfile(
  memberOrRelation:
    | {
        expertProfileVersion?: unknown
        expert?: unknown
        supervisor?: unknown
      }
    | null
    | undefined
) {
  if (!memberOrRelation) return null
  if ("expertProfileVersion" in memberOrRelation && memberOrRelation.expertProfileVersion) {
    return (
      versionToPersonLike(memberOrRelation.expertProfileVersion as any) ??
      memberOrRelation.expertProfileVersion
    )
  }
  if ("supervisor" in memberOrRelation && memberOrRelation.supervisor) {
    return (
      versionToPersonLike(memberOrRelation.supervisor as any) ?? memberOrRelation.supervisor
    )
  }
  return memberOrRelation.expert ?? null
}
