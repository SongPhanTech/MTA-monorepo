import { $Enums, type Prisma } from "@workspace/db"
import { prisma } from ".."

export type CreateDataSyncHistoryInput = {
  type: $Enums.DataSyncType
  sessionName: string
  classRegisterSessionId?: string | null
  fileName?: string | null
  fileVersion?: string | null
  sourceExportedAt?: Date | null
  recordCounts?: Prisma.InputJsonValue
  performedById?: string | null
}

export async function createDataSyncHistoryPending(input: CreateDataSyncHistoryInput) {
  return prisma.dataSyncHistory.create({
    data: {
      type: input.type,
      status: $Enums.DataSyncStatus.PENDING,
      sessionName: input.sessionName,
      classRegisterSessionId: input.classRegisterSessionId ?? undefined,
      fileName: input.fileName ?? undefined,
      fileVersion: input.fileVersion ?? undefined,
      sourceExportedAt: input.sourceExportedAt ?? undefined,
      recordCounts: input.recordCounts ?? undefined,
      performedById: input.performedById ?? undefined,
      createdBy: input.performedById ?? undefined,
    },
  })
}

export async function markDataSyncHistorySuccess(id: string) {
  return prisma.dataSyncHistory.update({
    where: { id },
    data: { status: $Enums.DataSyncStatus.SUCCESS },
  })
}

export async function markDataSyncHistoryFailed(id: string, errorMessage: string) {
  return prisma.dataSyncHistory.update({
    where: { id },
    data: {
      status: $Enums.DataSyncStatus.FAILED,
      errorMessage,
    },
  })
}

export async function listDataSyncHistory(limit = 50) {
  return prisma.dataSyncHistory.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      status: true,
      sessionName: true,
      fileName: true,
      fileVersion: true,
      errorMessage: true,
      createdAt: true,
      classRegisterSessionId: true,
    },
  })
}
