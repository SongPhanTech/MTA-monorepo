import { $Enums, type Prisma } from "@workspace/db"
import { prisma } from "../prisma"

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

async function existingUserProfileId(id?: string | null) {
  if (!id) return undefined
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id },
      select: { id: true },
    })
    return profile?.id
  } catch {
    return undefined
  }
}

async function existingClassRegisterSessionId(id?: string | null) {
  if (!id) return undefined
  try {
    const session = await prisma.classRegisterSession.findUnique({
      where: { id },
      select: { id: true },
    })
    return session?.id
  } catch {
    return undefined
  }
}

export async function createDataSyncHistoryPending(input: CreateDataSyncHistoryInput) {
  const [performedById, classRegisterSessionId] = await Promise.all([
    existingUserProfileId(input.performedById),
    existingClassRegisterSessionId(input.classRegisterSessionId),
  ])

  return prisma.dataSyncHistory.create({
    data: {
      type: input.type,
      status: $Enums.DataSyncStatus.PENDING,
      sessionName: input.sessionName,
      classRegisterSessionId,
      fileName: input.fileName ?? undefined,
      fileVersion: input.fileVersion ?? undefined,
      sourceExportedAt: input.sourceExportedAt ?? undefined,
      recordCounts: input.recordCounts ?? undefined,
      performedById,
      createdBy: input.performedById ?? undefined,
    },
  })
}

export async function markDataSyncHistorySuccess(
  id: string,
  extra?: { classRegisterSessionId?: string | null; description?: string | null }
) {
  const classRegisterSessionId = extra?.classRegisterSessionId
    ? await existingClassRegisterSessionId(extra.classRegisterSessionId)
    : undefined

  return prisma.dataSyncHistory.update({
    where: { id },
    data: {
      status: $Enums.DataSyncStatus.SUCCESS,
      ...(classRegisterSessionId ? { classRegisterSessionId } : {}),
      ...(extra?.description != null ? { description: extra.description } : {}),
    },
  })
}

export async function markDataSyncHistoryProcessing(id: string, description: string) {
  return prisma.dataSyncHistory.update({
    where: { id },
    data: { description },
  })
}

/** PENDING quá hạn (start rồi không enqueue Kafka / import không xong) không được chặn lần sau. */
const STALE_PENDING_IMPORT_MS = Number(process.env.DATA_SYNC_STALE_PENDING_MS || 5 * 60 * 1000)

export async function expireStalePendingImports() {
  const cutoff = new Date(Date.now() - Math.max(STALE_PENDING_IMPORT_MS, 60_000))
  await prisma.dataSyncHistory.updateMany({
    where: {
      type: $Enums.DataSyncType.IMPORT,
      status: $Enums.DataSyncStatus.PENDING,
      deletedAt: null,
      updatedAt: { lt: cutoff },
    },
    data: {
      status: $Enums.DataSyncStatus.FAILED,
      errorMessage: "Hết hạn chờ nhập (không nhận job Kafka / import không hoàn tất).",
    },
  })
}

export async function cleanupPendingImportsOnBoot() {
  await prisma.dataSyncHistory.updateMany({
    where: {
      type: $Enums.DataSyncType.IMPORT,
      status: $Enums.DataSyncStatus.PENDING,
      deletedAt: null,
    },
    data: {
      status: $Enums.DataSyncStatus.FAILED,
      errorMessage: "Tiến trình bị gián đoạn do khởi động lại backend.",
    },
  })
}

export async function findOtherPendingImport(excludeId?: string) {
  await expireStalePendingImports()
  return prisma.dataSyncHistory.findFirst({
    where: {
      type: $Enums.DataSyncType.IMPORT,
      status: $Enums.DataSyncStatus.PENDING,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, sessionName: true, fileName: true },
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
  await expireStalePendingImports()

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
      description: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
      classRegisterSessionId: true,
    },
  })
}
