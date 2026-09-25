/** Mã người (MSSV/MSHV/mã GV/CB): chỉ UserProfile.code. */

export type ProfileCodeSource = {
  code?: string | null
  userProfile?: { code?: string | null } | null
}

export function profileCode(entity?: ProfileCodeSource | null): string {
  return entity?.userProfile?.code?.trim() || entity?.code?.trim() || ""
}

/** Prisma where: tìm Lecturer/Student/Staff theo UserProfile.code */
export function whereByProfileCode(code: string | string[]) {
  return {
    userProfile: Array.isArray(code) ? { code: { in: code } } : { code },
  }
}
