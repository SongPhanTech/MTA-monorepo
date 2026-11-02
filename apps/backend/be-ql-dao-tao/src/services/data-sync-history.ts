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
  description?: string | null
}

async function existingUserProfileId(id?: string | null): Promise<string | undefined> {
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

async function existingClassRegisterSessionId(id?: string | null): Promise<string | undefined> {
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
      description: input.description ?? undefined,
    },
  })
}

export async function createDataSyncHistoryFailedDirect(input: CreateDataSyncHistoryInput & { errorMessage: string }) {
  const [performedById, classRegisterSessionId] = await Promise.all([
    existingUserProfileId(input.performedById),
    existingClassRegisterSessionId(input.classRegisterSessionId),
  ])

  return prisma.dataSyncHistory.create({
    data: {
      type: input.type,
      status: $Enums.DataSyncStatus.FAILED,
      sessionName: input.sessionName,
      classRegisterSessionId,
      fileName: input.fileName ?? undefined,
      fileVersion: input.fileVersion ?? undefined,
      sourceExportedAt: input.sourceExportedAt ?? undefined,
      recordCounts: input.recordCounts ?? undefined,
      errorMessage: input.errorMessage,
      performedById,
      createdBy: input.performedById ?? undefined,
      description: input.description ?? undefined,
    },
  })
}

export async function markDataSyncHistorySuccess(
  id: string,
  extra?: {
    classRegisterSessionId?: string | null
    description?: string | null
    recordCounts?: Prisma.InputJsonValue
    fileName?: string | null
  }
) {
  const classRegisterSessionId = extra?.classRegisterSessionId
    ? await existingClassRegisterSessionId(extra.classRegisterSessionId)
    : undefined

  return prisma.dataSyncHistory.update({
    where: { id },
    data: {
      status: $Enums.DataSyncStatus.SUCCESS,
      errorMessage: null,
      updatedAt: new Date(),
      ...(classRegisterSessionId ? { classRegisterSessionId } : {}),
      ...(extra?.fileName ? { fileName: extra.fileName } : {}),
      ...(extra?.recordCounts !== undefined ? { recordCounts: extra.recordCounts } : {}),
      ...(extra?.description != null ? { description: extra.description } : {}),
    },
  })
}

export async function markDataSyncHistoryFailed(
  id: string,
  errorMessage: string,
  extra?: {
    description?: string | null
    recordCounts?: Prisma.InputJsonValue
  }
) {
  return prisma.dataSyncHistory.update({
    where: { id },
    data: {
      status: $Enums.DataSyncStatus.FAILED,
      errorMessage,
      updatedAt: new Date(),
      ...(extra?.description != null ? { description: extra.description } : {}),
      ...(extra?.recordCounts !== undefined ? { recordCounts: extra.recordCounts } : {}),
    },
  })
}

