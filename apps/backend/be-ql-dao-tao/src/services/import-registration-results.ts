import { createHash } from "node:crypto"
import { Prisma } from "@workspace/db"
import { prisma } from ".."
import { isMtaSyncBinary, unpackSyncPayload } from "./data-sync-pack"

export const SUPPORTED_REGISTRATION_RESULTS_VERSIONS = ["1.0.0"] as const

export const IMPORT_REGISTRATION_MAX_MB = Math.max(
  1,
  Number(process.env.IMPORT_REGISTRATION_MAX_MB || 32) || 32
)

type JsonRecord = Record<string, unknown>

type ExportPayload = {
  version?: string
  type?: string
  filters?: {
    classRegisterSessionId?: string
    semesterId?: string
  }
  meta?: {
    sessionName?: string
    registrationCount?: number
  }
  data?: Record<string, unknown>
}

export type ImportRegistrationDetails = {
  classRegisterLogs: number
  studentSubjectScore: number
  removedLogs: number
  removedScores: number
  createdLogs?: number
  updatedLogs?: number
  createdScores?: number
  updatedScores?: number
  skippedScoresWithGrade?: number
}

export type ImportRegistrationResultsResult = {
  message: string
  imported: number
  failed: number
  details: ImportRegistrationDetails
  warnings: string[]
}

export type ImportRegistrationPreview = {
  fileHash: string
  sessionName: string
  fileSessionId: string | null
  stats: {
    createLogs: number
    updateLogs: number
    createScores: number
    updateScores: number
    skipScoresWithGrade: number
    removeLogs: number
    removeScores: number
    failed: number
  }
  warnings: string[]
}

function asRows(data: Record<string, unknown> | undefined, key: string): JsonRecord[] {
  const value = data?.[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object")
}

function coerceValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return value
}

function getScalarFields(modelName: string): Set<string> {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName)
  if (!model) return new Set()
  return new Set(
    model.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name)
  )
}

function prepareRow(modelName: string, row: JsonRecord, overrides?: JsonRecord): JsonRecord {
  const allowed = getScalarFields(modelName)
  const out: JsonRecord = {}
  for (const [key, value] of Object.entries(row)) {
    if (!allowed.has(key)) continue
    out[key] = coerceValue(value)
  }
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (allowed.has(key)) out[key] = value
    }
  }
  return out
}

function hasGradeData(score: {
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  finalScore: Prisma.Decimal | null
  manualFinalScore: number | null
}): boolean {
  return (
    score.attendanceScore != null ||
    score.midtermScore != null ||
    score.examScore != null ||
    score.finalScore != null ||
    score.manualFinalScore != null
  )
}

export function hashImportFileBytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex")
}

/** Chỉ chấp nhận gói .dat (Gzip + AES-256-GCM). Từ chối JSON plaintext. */
export function decodeRegistrationResultsFile(bytes: Buffer): unknown {
  if (bytes.byteLength > IMPORT_REGISTRATION_MAX_MB * 1024 * 1024) {
    throw new Error(
      `File vượt giới hạn ${IMPORT_REGISTRATION_MAX_MB} MB. Tăng IMPORT_REGISTRATION_MAX_MB nếu cần.`
    )
  }
  if (!isMtaSyncBinary(bytes)) {
    throw new Error("Không nhập được dữ liệu")
  }
  try {
    return JSON.parse(unpackSyncPayload(bytes))
  } catch (error) {
    if (error instanceof Error && error.message === "Không nhập được dữ liệu") throw error
    throw new Error("Không nhập được dữ liệu")
  }
}

function parsePayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Nội dung gói không hợp lệ")
  }
  const payload = raw as ExportPayload
  if (payload.type !== "registration-results") {
    throw new Error(
      `File không phải kết quả đăng ký (type=${payload.type ?? "thiếu"}). Cần type "registration-results".`
    )
  }
  return payload
}

type PreparedContext = {
  session: { id: string; name: string; semesterId: string }
  payload: ExportPayload
  logs: JsonRecord[]
  scores: JsonRecord[]
  studentSet: Set<string>
  subjectClassMap: Map<string, string>
  warnings: string[]
}

async function prepareContext(
  classRegisterSessionId: string,
  raw: unknown
): Promise<PreparedContext> {
  const warnings: string[] = []
  const payload = parsePayload(raw)

  if (
    payload.version &&
    !SUPPORTED_REGISTRATION_RESULTS_VERSIONS.includes(
      payload.version as (typeof SUPPORTED_REGISTRATION_RESULTS_VERSIONS)[number]
    )
  ) {
    warnings.push(`Phiên bản file ${payload.version} chưa được hỗ trợ chính thức, vẫn thử import`)
  }

  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học trên hệ thống nội bộ")
  }

  const fileSessionId = payload.filters?.classRegisterSessionId
  if (!fileSessionId) {
    throw new Error("Gói thiếu filters.classRegisterSessionId — không thể xác minh đợt đăng ký")
  }
  if (fileSessionId !== classRegisterSessionId) {
    throw new Error(
      `ID đợt trong file (${fileSessionId}) khác đợt đang chọn (${classRegisterSessionId}). Từ chối import để tránh xóa nhầm dữ liệu.`
    )
  }

  const logs = asRows(payload.data, "ClassRegisterLogs")
  const scores = asRows(payload.data, "StudentSubjectScore")

  const studentIds = [
    ...new Set(
      [...logs, ...scores]
        .map((r) => r.studentId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ]
  const subjectClassIds = [
    ...new Set(
      [...logs, ...scores]
        .map((r) => r.subjectClassId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ]

  const [existingStudents, existingSubjectClasses] = await Promise.all([
    studentIds.length
      ? prisma.student.findMany({
          where: { id: { in: studentIds }, deletedAt: null },
          select: { id: true },
        })
      : Promise.resolve([]),
    subjectClassIds.length
      ? prisma.subjectClass.findMany({
          where: { id: { in: subjectClassIds }, deletedAt: null },
          select: { id: true, subjectId: true },
        })
      : Promise.resolve([]),
  ])

  return {
    session: { id: session.id, name: session.name, semesterId: session.semesterId },
    payload,
    logs,
    scores,
    studentSet: new Set(existingStudents.map((s) => s.id)),
    subjectClassMap: new Map(existingSubjectClasses.map((sc) => [sc.id, sc.subjectId])),
    warnings,
  }
}

export async function previewRegistrationResultsImport(
  classRegisterSessionId: string,
  raw: unknown,
  fileHash: string
): Promise<ImportRegistrationPreview> {
  const ctx = await prepareContext(classRegisterSessionId, raw)
  const { logs, scores, studentSet, subjectClassMap, session, warnings, payload } = ctx

  let createLogs = 0
  let updateLogs = 0
  let createScores = 0
  let updateScores = 0
  let skipScoresWithGrade = 0
  let failed = 0

  const validLogIds = new Set<string>()
  const importedPairs = new Set<string>()

  for (const rawLog of logs) {
    const logId = typeof rawLog.id === "string" ? rawLog.id : null
    const studentId = typeof rawLog.studentId === "string" ? rawLog.studentId : null
    const subjectClassId =
      typeof rawLog.subjectClassId === "string" ? rawLog.subjectClassId : null

    if (!logId || !studentId || !subjectClassId) {
      failed += 1
      warnings.push(`ClassRegisterLogs: bỏ qua bản ghi thiếu id/studentId/subjectClassId`)
      continue
    }
    if (!studentSet.has(studentId)) {
      failed += 1
      warnings.push(`ClassRegisterLogs/${logId}: không tìm thấy sinh viên ${studentId}`)
      continue
    }
    if (!subjectClassMap.has(subjectClassId)) {
      failed += 1
      warnings.push(`ClassRegisterLogs/${logId}: không tìm thấy lớp HP ${subjectClassId}`)
      continue
    }

    const existingByPair = await prisma.classRegisterLogs.findFirst({
      where: { classRegisterSessionId, studentId, subjectClassId },
      select: { id: true, deletedAt: true },
    })

    if (existingByPair) {
      updateLogs += 1
      validLogIds.add(existingByPair.id)
    } else {
      const existingById = await prisma.classRegisterLogs.findFirst({
        where: { id: logId },
        select: { id: true },
      })
      if (existingById) updateLogs += 1
      else createLogs += 1
      validLogIds.add(logId)
    }
    importedPairs.add(`${studentId}::${subjectClassId}`)
  }

  for (const rawScore of scores) {
    const studentId = typeof rawScore.studentId === "string" ? rawScore.studentId : null
    const subjectClassId =
      typeof rawScore.subjectClassId === "string" ? rawScore.subjectClassId : null
    const scoreId = typeof rawScore.id === "string" ? rawScore.id : null

    if (!studentId || !subjectClassId) {
      failed += 1
      warnings.push(`StudentSubjectScore: bỏ qua bản ghi thiếu studentId/subjectClassId`)
      continue
    }
    if (!studentSet.has(studentId)) {
      failed += 1
      warnings.push(`StudentSubjectScore/${scoreId ?? "?"}: không tìm thấy sinh viên ${studentId}`)
      continue
    }
    const subjectVersionId =
      subjectClassMap.get(subjectClassId) ??
      (typeof rawScore.subjectVersionId === "string" ? rawScore.subjectVersionId : null)
    if (!subjectClassMap.has(subjectClassId) || !subjectVersionId) {
      failed += 1
      warnings.push(
        `StudentSubjectScore/${scoreId ?? "?"}: không tìm thấy lớp HP ${subjectClassId}`
      )
      continue
    }

    importedPairs.add(`${studentId}::${subjectClassId}`)

    const existing = await prisma.studentSubjectScore.findFirst({
      where: { studentId, subjectClassId },
      select: {
        id: true,
        deletedAt: true,
        attendanceScore: true,
        midtermScore: true,
        examScore: true,
        finalScore: true,
        manualFinalScore: true,
      },
    })

    if (existing && !existing.deletedAt && hasGradeData(existing)) {
      skipScoresWithGrade += 1
      continue
    }
    if (existing) updateScores += 1
    else createScores += 1
  }

  let removeLogs = 0
  let removeScores = 0
  const canReconcile = logs.length === 0 || validLogIds.size > 0

  if (canReconcile) {
    const logsToRemove = await prisma.classRegisterLogs.findMany({
      where: {
        classRegisterSessionId,
        deletedAt: null,
        ...(validLogIds.size > 0 ? { id: { notIn: [...validLogIds] } } : {}),
      },
      select: { id: true, studentId: true, subjectClassId: true },
    })
    removeLogs = logsToRemove.length

    for (const log of logsToRemove) {
      const pairKey = `${log.studentId}::${log.subjectClassId}`
      if (importedPairs.has(pairKey)) continue

      const score = await prisma.studentSubjectScore.findFirst({
        where: {
          studentId: log.studentId,
          subjectClassId: log.subjectClassId,
          deletedAt: null,
        },
        include: {
          examPaper: { select: { id: true } },
          studentResearchTopic: { select: { id: true } },
          studentInternship: { select: { id: true } },
        },
      })
      if (!score) continue
      if (
        hasGradeData(score) ||
        score.examPaper ||
        score.studentResearchTopic ||
        score.studentInternship
      ) {
        warnings.push(
          `StudentSubjectScore/${score.id}: sẽ giữ nguyên vì đã phát sinh điểm/dữ liệu liên quan`
        )
        continue
      }
      removeScores += 1
    }
  } else {
    warnings.push("Sẽ bỏ qua bước gỡ đăng ký cũ vì không có nhật ký hợp lệ trong file")
  }

  return {
    fileHash,
    sessionName: session.name || classRegisterSessionId,
    fileSessionId: payload.filters?.classRegisterSessionId ?? null,
    stats: {
      createLogs,
      updateLogs,
      createScores,
      updateScores,
      skipScoresWithGrade,
      removeLogs,
      removeScores,
      failed,
    },
    warnings: warnings.slice(0, 50),
  }
}

export async function importRegistrationResultsFromJson(
  classRegisterSessionId: string,
  raw: unknown
): Promise<ImportRegistrationResultsResult> {
  const ctx = await prepareContext(classRegisterSessionId, raw)
  const { logs, scores, studentSet, subjectClassMap, session, warnings } = ctx

  let logsImported = 0
  let scoresImported = 0
  let createdLogs = 0
  let updatedLogs = 0
  let createdScores = 0
  let updatedScores = 0
  let skippedScoresWithGrade = 0
  let failed = 0
  let removedLogs = 0
  let removedScores = 0

  const importedLogIds = new Set<string>()
  const importedPairs = new Set<string>()
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    for (const rawLog of logs) {
      const logId = typeof rawLog.id === "string" ? rawLog.id : null
      const studentId = typeof rawLog.studentId === "string" ? rawLog.studentId : null
      const subjectClassId =
        typeof rawLog.subjectClassId === "string" ? rawLog.subjectClassId : null

      if (!logId || !studentId || !subjectClassId) {
        failed += 1
        warnings.push(`ClassRegisterLogs: bỏ qua bản ghi thiếu id/studentId/subjectClassId`)
        continue
      }

      if (!studentSet.has(studentId)) {
        failed += 1
        warnings.push(`ClassRegisterLogs/${logId}: không tìm thấy sinh viên ${studentId}`)
        continue
      }

      if (!subjectClassMap.has(subjectClassId)) {
        failed += 1
        warnings.push(`ClassRegisterLogs/${logId}: không tìm thấy lớp HP ${subjectClassId}`)
        continue
      }

      const prepared = prepareRow("ClassRegisterLogs", rawLog, {
        classRegisterSessionId,
        studentId,
        subjectClassId,
        deletedAt: null,
      })

      try {
        // Gồm cả bản ghi soft-deleted để khôi phục nếu SV đăng ký lại
        const existingByPair = await tx.classRegisterLogs.findFirst({
          where: {
            classRegisterSessionId,
            studentId,
            subjectClassId,
          },
        })

        if (existingByPair) {
          const { id: _id, ...updateData } = prepared
          await tx.classRegisterLogs.update({
            where: { id: existingByPair.id },
            data: {
              ...(updateData as Prisma.ClassRegisterLogsUncheckedUpdateInput),
              deletedAt: null,
            },
          })
          importedLogIds.add(existingByPair.id)
          updatedLogs += 1
        } else {
          const existingById = await tx.classRegisterLogs.findFirst({
            where: { id: logId },
            select: { id: true },
          })
          const { id: _id, ...updateData } = prepared
          await tx.classRegisterLogs.upsert({
            where: { id: logId },
            create: prepared as Prisma.ClassRegisterLogsUncheckedCreateInput,
            update: {
              ...(updateData as Prisma.ClassRegisterLogsUncheckedUpdateInput),
              deletedAt: null,
            },
          })
          importedLogIds.add(logId)
          if (existingById) updatedLogs += 1
          else createdLogs += 1
        }

        logsImported += 1
        importedPairs.add(`${studentId}::${subjectClassId}`)
      } catch (error) {
        failed += 1
        warnings.push(
          `ClassRegisterLogs/${logId}: ${error instanceof Error ? error.message : "upsert thất bại"}`
        )
      }
    }

    for (const rawScore of scores) {
      const studentId = typeof rawScore.studentId === "string" ? rawScore.studentId : null
      const subjectClassId =
        typeof rawScore.subjectClassId === "string" ? rawScore.subjectClassId : null
      const scoreId = typeof rawScore.id === "string" ? rawScore.id : null

      if (!studentId || !subjectClassId) {
        failed += 1
        warnings.push(`StudentSubjectScore: bỏ qua bản ghi thiếu studentId/subjectClassId`)
        continue
      }

      if (!studentSet.has(studentId)) {
        failed += 1
        warnings.push(
          `StudentSubjectScore/${scoreId ?? "?"}: không tìm thấy sinh viên ${studentId}`
        )
        continue
      }

      const subjectVersionId =
        subjectClassMap.get(subjectClassId) ??
        (typeof rawScore.subjectVersionId === "string" ? rawScore.subjectVersionId : null)

      if (!subjectClassMap.has(subjectClassId) || !subjectVersionId) {
        failed += 1
        warnings.push(
          `StudentSubjectScore/${scoreId ?? "?"}: không tìm thấy lớp HP ${subjectClassId}`
        )
        continue
      }

      importedPairs.add(`${studentId}::${subjectClassId}`)

      try {
        const existing = await tx.studentSubjectScore.findFirst({
          where: { studentId, subjectClassId },
        })

        if (existing && !existing.deletedAt && hasGradeData(existing)) {
          warnings.push(`StudentSubjectScore/${existing.id}: đã có điểm, giữ nguyên không ghi đè`)
          scoresImported += 1
          skippedScoresWithGrade += 1
          continue
        }

        if (existing) {
          await tx.studentSubjectScore.update({
            where: { id: existing.id },
            data: {
              subjectVersionId,
              semesterId:
                typeof rawScore.semesterId === "string" ? rawScore.semesterId : existing.semesterId,
              active: typeof rawScore.active === "boolean" ? rawScore.active : existing.active,
              deletedAt: null,
            },
          })
          scoresImported += 1
          updatedScores += 1
          continue
        }

        const prepared = prepareRow("StudentSubjectScore", rawScore, {
          studentId,
          subjectClassId,
          subjectVersionId,
          semesterId:
            typeof rawScore.semesterId === "string" ? rawScore.semesterId : session.semesterId,
          deletedAt: null,
        })

        await tx.studentSubjectScore.create({
          data: prepared as Prisma.StudentSubjectScoreUncheckedCreateInput,
        })
        scoresImported += 1
        createdScores += 1
      } catch (error) {
        failed += 1
        warnings.push(
          `StudentSubjectScore/${scoreId ?? "?"}: ${
            error instanceof Error ? error.message : "import thất bại"
          }`
        )
      }
    }

    const canReconcileDeletes = logs.length === 0 || logsImported > 0

    if (canReconcileDeletes) {
      const logsToRemove = await tx.classRegisterLogs.findMany({
        where: {
          classRegisterSessionId,
          deletedAt: null,
          ...(importedLogIds.size > 0 ? { id: { notIn: [...importedLogIds] } } : {}),
        },
        select: { id: true, studentId: true, subjectClassId: true },
      })

      if (logsToRemove.length > 0) {
        const removeIds = logsToRemove.map((l) => l.id)
        const soft = await tx.classRegisterLogs.updateMany({
          where: { id: { in: removeIds } },
          data: { deletedAt: now },
        })
        removedLogs = soft.count

        for (const log of logsToRemove) {
          const pairKey = `${log.studentId}::${log.subjectClassId}`
          if (importedPairs.has(pairKey)) continue

          const score = await tx.studentSubjectScore.findFirst({
            where: {
              studentId: log.studentId,
              subjectClassId: log.subjectClassId,
              deletedAt: null,
            },
            include: {
              examPaper: { select: { id: true } },
              studentResearchTopic: { select: { id: true } },
              studentInternship: { select: { id: true } },
            },
          })

          if (!score) continue
          if (
            hasGradeData(score) ||
            score.examPaper ||
            score.studentResearchTopic ||
            score.studentInternship
          ) {
            warnings.push(
              `StudentSubjectScore/${score.id}: không gỡ vì đã phát sinh điểm/dữ liệu liên quan`
            )
            continue
          }

          await tx.studentSubjectScore.update({
            where: { id: score.id },
            data: { deletedAt: now },
          })
          removedScores += 1
        }
      }
    } else {
      warnings.push("Bỏ qua bước gỡ đăng ký cũ vì không import được nhật ký nào từ file")
    }
  })

  const imported = logsImported + scoresImported
  const sessionLabel = session.name || classRegisterSessionId

  return {
    message: `Đã nhập kết quả đăng ký vào đợt "${sessionLabel}": ${logsImported} nhật ký, ${scoresImported} điểm môn${
      removedLogs > 0 ? `, đã ẩn (soft-delete) ${removedLogs} đăng ký cũ` : ""
    }`,
    imported,
    failed,
    details: {
      classRegisterLogs: logsImported,
      studentSubjectScore: scoresImported,
      removedLogs,
      removedScores,
      createdLogs,
      updatedLogs,
      createdScores,
      updatedScores,
      skippedScoresWithGrade,
    },
    warnings,
  }
}
