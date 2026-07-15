import { Prisma } from "@workspace/db"
import { prisma } from ".."

export const SUPPORTED_REGISTRATION_RESULTS_VERSIONS = ["1.0.0"] as const

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

export type ImportRegistrationResultsResult = {
  message: string
  imported: number
  failed: number
  details: {
    classRegisterLogs: number
    studentSubjectScore: number
    removedLogs: number
    removedScores: number
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

export async function importRegistrationResultsFromJson(
  classRegisterSessionId: string,
  raw: unknown
): Promise<ImportRegistrationResultsResult> {
  const warnings: string[] = []
  const payload = raw as ExportPayload

  if (!payload || typeof payload !== "object") {
    throw new Error("File JSON không hợp lệ")
  }

  if (payload.type !== "registration-results") {
    throw new Error(
      `File không phải kết quả đăng ký (type=${payload.type ?? "thiếu"}). Cần type "registration-results".`
    )
  }

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
  if (fileSessionId && fileSessionId !== classRegisterSessionId) {
    warnings.push(
      `ID đợt trong file (${fileSessionId}) khác đợt đang chọn (${classRegisterSessionId}). Dữ liệu sẽ gắn vào đợt đang chọn.`
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

  const studentSet = new Set(existingStudents.map((s) => s.id))
  const subjectClassMap = new Map(existingSubjectClasses.map((sc) => [sc.id, sc.subjectId]))

  let logsImported = 0
  let scoresImported = 0
  let failed = 0
  let removedLogs = 0
  let removedScores = 0

  const importedLogIds = new Set<string>()
  const importedPairs = new Set<string>()

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
      })

      try {
        const existingByPair = await tx.classRegisterLogs.findFirst({
          where: {
            classRegisterSessionId,
            studentId,
            subjectClassId,
            deletedAt: null,
          },
        })

        if (existingByPair) {
          const { id: _id, ...updateData } = prepared
          await tx.classRegisterLogs.update({
            where: { id: existingByPair.id },
            data: updateData as Prisma.ClassRegisterLogsUncheckedUpdateInput,
          })
          importedLogIds.add(existingByPair.id)
        } else {
          const { id: _id, ...updateData } = prepared
          await tx.classRegisterLogs.upsert({
            where: { id: logId },
            create: prepared as Prisma.ClassRegisterLogsUncheckedCreateInput,
            update: updateData as Prisma.ClassRegisterLogsUncheckedUpdateInput,
          })
          importedLogIds.add(logId)
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
          where: { studentId, subjectClassId, deletedAt: null },
        })

        if (existing) {
          if (hasGradeData(existing)) {
            warnings.push(
              `StudentSubjectScore/${existing.id}: đã có điểm, giữ nguyên không ghi đè`
            )
            scoresImported += 1
            continue
          }

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
          continue
        }

        const prepared = prepareRow("StudentSubjectScore", rawScore, {
          studentId,
          subjectClassId,
          subjectVersionId,
          semesterId:
            typeof rawScore.semesterId === "string" ? rawScore.semesterId : session.semesterId,
        })

        await tx.studentSubjectScore.create({
          data: prepared as Prisma.StudentSubjectScoreUncheckedCreateInput,
        })
        scoresImported += 1
      } catch (error) {
        failed += 1
        warnings.push(
          `StudentSubjectScore/${scoreId ?? "?"}: ${
            error instanceof Error ? error.message : "import thất bại"
          }`
        )
      }
    }

    // Chỉ đồng bộ hủy đăng ký khi import logs thành công (tránh xóa nhầm nếu mọi dòng đều lỗi)
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
        const deleteResult = await tx.classRegisterLogs.deleteMany({
          where: { id: { in: removeIds } },
        })
        removedLogs = deleteResult.count

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
              `StudentSubjectScore/${score.id}: không xóa vì đã phát sinh điểm/dữ liệu liên quan`
            )
            continue
          }

          await tx.studentSubjectScoreHistory.deleteMany({
            where: { studentSubjectScoreId: score.id },
          })
          await tx.studentSubjectScore.delete({ where: { id: score.id } })
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
      removedLogs > 0 ? `, đã gỡ ${removedLogs} đăng ký cũ` : ""
    }`,
    imported,
    failed,
    details: {
      classRegisterLogs: logsImported,
      studentSubjectScore: scoresImported,
      removedLogs,
      removedScores,
    },
    warnings,
  }
}
