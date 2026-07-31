import type { Prisma } from "@workspace/db"
import { AlreadyRegisteredError } from "./errors"

/** Thông tin tối thiểu của một lớp trong lượt đăng ký. */
export type RegisterClassInfo = {
  /** SubjectVersion id — dùng ghi StudentSubjectScore.subjectVersionId */
  subjectVersionId: string
  subjectName: string
  maxStudent: number
}

export type RegisterParams = {
  sessionId: string
  studentId: string
  /** Đã sort + dedupe — thứ tự khóa nhất quán để tránh deadlock chéo */
  classIds: string[]
  classLookup: Map<string, RegisterClassInfo>
}

/** Chống đăng ký trùng: đã có bản ghi điểm cho lớp này thì từ chối. */
export async function assertNotAlreadyRegistered(
  tx: Prisma.TransactionClient,
  params: RegisterParams
): Promise<void> {
  const existing = await tx.studentSubjectScore.findMany({
    where: { studentId: params.studentId, subjectClassId: { in: params.classIds } },
    select: { subjectClassId: true },
  })
  if (existing.length > 0) {
    const subjectName = params.classLookup.get(existing[0]!.subjectClassId!)?.subjectName
    throw new AlreadyRegisteredError(subjectName)
  }
}

/** Ghi danh: tạo bản ghi điểm + log đăng ký (batch, không N+1). */
export async function insertRegistrations(
  tx: Prisma.TransactionClient,
  params: RegisterParams
): Promise<void> {
  await tx.studentSubjectScore.createMany({
    data: params.classIds.map((subjectClassId) => ({
      subjectClassId,
      studentId: params.studentId,
      subjectVersionId: params.classLookup.get(subjectClassId)!.subjectVersionId,
    })),
  })

  await tx.classRegisterLogs.createMany({
    data: params.classIds.map((subjectClassId) => ({
      classRegisterSessionId: params.sessionId,
      studentId: params.studentId,
      subjectClassId,
    })),
  })
}
