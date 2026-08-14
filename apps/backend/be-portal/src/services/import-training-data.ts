import { Prisma, type PrismaClient } from "@workspace/db"
import { prisma } from "../prisma"
import { markDataSyncHistoryFailed, markDataSyncHistorySuccess } from "./data-sync-history"

export const SUPPORTED_IMPORT_VERSIONS = ["1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"] as const

type JsonRecord = Record<string, unknown>
type ExportPayload = {
  version?: string
  exportedAt?: string
  data?: Record<string, unknown>
}

type ImportStepResult = {
  table: string
  count: number
}

export type ImportTrainingDataResult = {
  sessionId: string
  sessionName: string
  steps: ImportStepResult[]
  warnings: string[]
}

const FIXED_CLASS_ROLE_FIELDS = [
  "classMonitorId",
  "unionLeaderId",
  "deputyUnionSecretaryId",
  "unionSecretaryId",
] as const

/** Optional FKs that may be missing on internet DB — null before upsert if target not present */
const NULLABLE_RISKY_FIELDS: Record<string, string[]> = {
  UserProfile: ["groupId", "sQuanlyTrucTiepId", "positionId"],
  SubjectClass: [
    "scoreLinkSubjectVersionId",
    "examId",
    "planTrainingSubjectId",
    "lecturerId",
    "extraLecturerId",
    "enterGradeLecturerId",
    "roomId",
    "trainingLocationId",
  ],
  FixedClass: ["staffManagementId", "lecturerManagementId", ...FIXED_CLASS_ROLE_FIELDS],
  Student: ["trainingFieldId", "curriculumVersionParallelId"],
  ClassSchedule: ["originalScheduleId"],
  StudentSubjectScore: ["examId"],
  Staff: [],
  Lecturer: [],
}

/** FK không được ghi đè thành null khi update — chỉ insert/gán khi giá trị hợp lệ */
const PRESERVE_ON_UPDATE_FIELDS: Record<string, string[]> = {
  StudentSubjectScore: ["subjectClassId"],
}

const PRESERVE_FK_MODEL: Record<string, string> = {
  subjectClassId: "SubjectClass",
}

const DM_IMPORT_ORDER = [
  "DM_QuocGia",
  "DM_Tinh",
  "DM_Tinh_New",
  "DM_QuanHuyen",
  "DM_XaPhuong",
  "DM_XaPhuong_New",
  "DM_DonVi",
  "DM_DonViHanhChinh",
  "DM_CapBac",
  "DM_ChucDanh",
  "DM_ChucVu",
  "DM_HocHam",
  "DM_HocVi",
  "DM_ChungChiTinHoc",
  "DM_DanToc",
  "DM_KhuVuc_DiaLy",
  "DM_NgoaiNgu",
  "DM_TonGiao",
  "DM_TrinhDoNgoaiNgu",
  "DM_TrinhDoTinHoc",
  "DM_GioiTinh",
  "DM_NhanVien",
  "DM_PhanCap_ChatLuong_TrangThietBi",
  "DM_PhanLoai_CSKT",
  "DM_NhomNguoiDung",
  "DM_NhomUngDung",
  "DM_ViTriCongViec",
  "DM_TrinhDoHocVan",
  "DM_TrinhDoLyLuanChinhTri",
  "DM_TrinhDoQuanLyNhaNuoc",
  "DM_TinhTrangHonNhan",
  "DM_QuanHeThanNhan",
  "DM_TrangThaiLamViec",
  "DM_HinhThucKhenThuongChinhQuyen",
  "DM_HinhThucKhenThuongDang",
  "DM_XepLoaiDanhGiaCanBo",
  "DM_XepLoaiDanhGiaChatLuongDangVien",
  "DM_LoaiHinhCongTac",
  "DM_TinhTrangCongTac",
  "DM_LoaiTinhTrangCongTac",
  "DM_LoaiHinhDiHocTap",
  "DM_TinhTrangDiHocTap",
  "DM_NuocCuDiHocTap",
  "DM_ChucDanhCMNVGiangVien",
  "DM_ChucDanhCMNVNghienCuuVien",
  "DM_ChucDanhCMNVKySu",
  "DM_TruongDaoTaoBacDH",
  "DM_ChuyenNganhDaoTaoBacDH",
  "DM_ChiHuyQuanLy",
  "DM_ChuyenMonKyThuat",
  "DM_SucKhoe",
  "DM_NhomMau",
  "DM_LoaiThuongTat",
  "DM_NganhHoc",
  "DM_ToChucXaHoi",
  "DM_Ngach",
  "DM_BacLuong",
] as const

const TRAINING_CATALOG_ORDER = [
  "LecturerType",
  "StaffType",
  "StaffPosition",
  "TrainingLanguage",
  "TrainingType",
  "TrainingLevel",
  "TrainingForm",
  "TrainingTime",
  "DiplomaType",
  "PriorityObject",
  "TrainingField",
  "AcademicRankingConvert",
  "SubjectVersionCategory",
  "LoadCategory",
  "TemplateFile",
] as const

const BUSINESS_UPSERT_ORDER = [
  "TrainingObjectType",
  "SchoolYear",
  "Semester",
  "TrainingCourse",
  "TrainingCourseRegulation",
  "TrainingLocation",
  "Building",
  "Room",
  "TrainingMajor",
  "Curriculum",
  "CurriculumVersion",
  "TrainingBlock",
  "TrainingBlockOnCurriculumVersion",
  "Subject",
  "SubjectVersion",
  "TrainingBlockSubject",
  "EquivalencyGroup",
  "SubjectInGroup",
  "UserProfile",
  "Lecturer",
  "Staff",
  "FixedClass",
  "Student",
  "Exam",
  "SubjectClass",
  "SubjectClassTime",
  "ClassSchedule",
  "ClassRegisterSession",
  "ClassRegisterSessionCredit",
  "StudentSubjectScore",
  "StudentSemesterResult",
] as const

function toDelegateName(modelName: string): string {
  if (modelName.startsWith("DM_")) {
    return `dM_${modelName.slice(3)}`
  }
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

function pkField(modelName: string): "id" | "Id" {
  return modelName.startsWith("DM_") ? "Id" : "id"
}

function getModelMeta(modelName: string) {
  return Prisma.dmmf.datamodel.models.find((m) => m.name === modelName)
}

function getScalarFields(modelName: string): Set<string> {
  const model = getModelMeta(modelName)
  if (!model) return new Set()
  return new Set(
    model.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name)
  )
}

function coerceValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return value
}

function prepareRow(
  modelName: string,
  row: JsonRecord,
  options?: { nullFields?: string[] }
): JsonRecord {
  const allowed = getScalarFields(modelName)
  const risky = NULLABLE_RISKY_FIELDS[modelName] ?? []
  const preserve = new Set(PRESERVE_ON_UPDATE_FIELDS[modelName] ?? [])
  const nullSet = new Set([
    ...(options?.nullFields ?? []),
    ...risky.filter((f) => !preserve.has(f) && (!(f in row) || row[f] == null)),
  ])

  const out: JsonRecord = {}
  for (const [key, value] of Object.entries(row)) {
    if (!allowed.has(key)) continue
    if (nullSet.has(key) && key !== pkField(modelName)) {
      out[key] = null
      continue
    }
    out[key] = coerceValue(value)
  }
  return out
}

function omitNullPreserveFields(modelName: string, data: JsonRecord): JsonRecord {
  const preserve = new Set(PRESERVE_ON_UPDATE_FIELDS[modelName] ?? [])
  if (preserve.size === 0) return data
  const out: JsonRecord = {}
  for (const [key, value] of Object.entries(data)) {
    if (preserve.has(key) && value == null) continue
    out[key] = value
  }
  return out
}

function omitPreserveFields(modelName: string, data: JsonRecord): JsonRecord {
  const preserve = new Set(PRESERVE_ON_UPDATE_FIELDS[modelName] ?? [])
  if (preserve.size === 0) return data
  const out: JsonRecord = {}
  for (const [key, value] of Object.entries(data)) {
    if (preserve.has(key)) continue
    out[key] = value
  }
  return out
}

async function existingIdsOf(modelName: string, ids: string[]): Promise<Set<string>> {
  const unique = [...new Set(ids.filter((id) => id.length > 0))]
  if (unique.length === 0) return new Set()
  const pk = pkField(modelName)
  const rows = await getDelegate(modelName).findMany({
    where: { [pk]: { in: unique } },
    select: { [pk]: true },
  })
  return new Set(rows.map((row) => String(row[pk])))
}

function asRows(data: Record<string, unknown> | undefined, key: string): JsonRecord[] {
  const value = data?.[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object")
}

function getDelegate(modelName: string) {
  const name = toDelegateName(modelName)
  const delegate = (prisma as unknown as Record<string, unknown>)[name]
  if (!delegate || typeof delegate !== "object") {
    throw new Error(`Không tìm thấy Prisma model: ${modelName} (${name})`)
  }
  return delegate as {
    createMany: (args: {
      data: JsonRecord[]
      skipDuplicates?: boolean
    }) => Promise<{ count: number }>
    upsert: (args: {
      where: Record<string, unknown>
      create: JsonRecord
      update: JsonRecord
    }) => Promise<unknown>
    findMany: (args: {
      where: Record<string, unknown>
      select: Record<string, boolean>
    }) => Promise<JsonRecord[]>
    update: (args: { where: Record<string, unknown>; data: JsonRecord }) => Promise<unknown>
  }
}

async function importCreateMany(
  modelName: string,
  rows: JsonRecord[],
  warnings: string[]
): Promise<number> {
  if (rows.length === 0) return 0
  const prepared = rows.map((row) => prepareRow(modelName, row))
  const delegate = getDelegate(modelName)
  const chunkSize = 500
  let imported = 0

  for (let i = 0; i < prepared.length; i += chunkSize) {
    const chunk = prepared.slice(i, i + chunkSize)
    try {
      const result = await delegate.createMany({ data: chunk, skipDuplicates: true })
      imported += result.count
    } catch (error) {
      // fallback row-by-row for partial failures
      for (const row of chunk) {
        try {
          await delegate.createMany({ data: [row], skipDuplicates: true })
          imported += 1
        } catch (rowError) {
          warnings.push(
            `${modelName}/${String(row[pkField(modelName)])}: ${
              rowError instanceof Error ? rowError.message : "import thất bại"
            }`
          )
        }
      }
    }
  }

  return imported
}

async function importUpsert(
  modelName: string,
  rows: JsonRecord[],
  warnings: string[],
  options?: { nullFields?: string[] }
): Promise<number> {
  if (rows.length === 0) return 0
  const pk = pkField(modelName)
  const delegate = getDelegate(modelName)
  const preserveFields = PRESERVE_ON_UPDATE_FIELDS[modelName] ?? []
  const existingPreserveFks: Record<string, Set<string>> = {}

  for (const field of preserveFields) {
    const fkModel = PRESERVE_FK_MODEL[field]
    if (!fkModel) continue
    const ids = rows
      .map((row) => row[field])
      .filter((id): id is string => typeof id === "string" && id.length > 0)
    existingPreserveFks[field] = await existingIdsOf(fkModel, ids)
  }

  let imported = 0

  for (const raw of rows) {
    let prepared = prepareRow(modelName, raw, options)
    const id = prepared[pk]
    if (!id) {
      warnings.push(`${modelName}: bỏ qua bản ghi thiếu ${pk}`)
      continue
    }

    for (const field of preserveFields) {
      const existing = existingPreserveFks[field]
      const fk = prepared[field]
      if (typeof fk === "string" && existing && !existing.has(fk)) {
        prepared = { ...prepared, [field]: null }
      }
    }

    const { [pk]: _id, ...updateRaw } = prepared
    const updateData = omitNullPreserveFields(modelName, updateRaw)
    try {
      await delegate.upsert({
        where: { [pk]: id },
        create: prepared,
        update: updateData,
      })
      imported += 1
    } catch (error) {
      // Retry: null FK tùy chọn; không xoá FK cần giữ (chỉ bỏ khỏi update, null khi create)
      try {
        const retry = prepareRow(modelName, raw, {
          nullFields: [...(options?.nullFields ?? []), ...(NULLABLE_RISKY_FIELDS[modelName] ?? [])],
        })
        const retryCreate = { ...retry }
        for (const field of preserveFields) {
          retryCreate[field] = null
        }
        const { [pk]: __id, ...retryUpdateRaw } = retryCreate
        const retryUpdate = omitPreserveFields(modelName, retryUpdateRaw)
        await delegate.upsert({
          where: { [pk]: id },
          create: retryCreate,
          update: retryUpdate,
        })
        imported += 1
        warnings.push(
          `${modelName}/${String(id)}: upsert lại sau khi null FK tùy chọn (${
            error instanceof Error ? error.message : "lỗi"
          })`
        )
      } catch (retryError) {
        warnings.push(
          `${modelName}/${String(id)}: ${
            retryError instanceof Error ? retryError.message : "upsert thất bại"
          }`
        )
      }
    }
  }

  return imported
}

async function ensureMissingTrainingFields(
  data: Record<string, unknown>,
  warnings: string[]
): Promise<number> {
  const majors = asRows(data, "TrainingMajor")
  const fields = asRows(data, "TrainingField")
  const existingIds = new Set(fields.map((f) => String(f.id)))
  const needed = [
    ...new Set(
      majors
        .map((m) => m.trainingFieldId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ].filter((id) => !existingIds.has(id))

  if (needed.length === 0) return 0

  let created = 0
  for (const id of needed) {
    const major = majors.find((m) => m.trainingFieldId === id)
    const organizationId =
      (typeof major?.organizationId === "string" && major.organizationId) ||
      (asRows(data, "DM_DonVi")[0]?.Id as string | undefined)

    if (!organizationId) {
      warnings.push(`TrainingField/${id}: không tạo được stub vì thiếu organizationId`)
      continue
    }

    try {
      await prisma.trainingField.upsert({
        where: { id },
        create: {
          id,
          name: `Ngành đồng bộ ${id}`,
          englishName: `Synced field ${id}`,
          publishDate: new Date(),
          organizationId,
          description: "Tự tạo khi import thiếu TrainingField trong file JSON",
        },
        update: {},
      })
      created += 1
      warnings.push(`TrainingField/${id}: đã tạo stub vì file JSON thiếu danh mục ngành`)
    } catch (error) {
      warnings.push(
        `TrainingField/${id}: ${error instanceof Error ? error.message : "không tạo được stub"}`
      )
    }
  }

  return created
}

async function patchFixedClassRoles(rows: JsonRecord[], warnings: string[]): Promise<number> {
  let updated = 0
  for (const raw of rows) {
    const id = raw.id
    if (typeof id !== "string") continue
    const data: JsonRecord = {}
    for (const field of FIXED_CLASS_ROLE_FIELDS) {
      if (raw[field] != null) data[field] = raw[field]
    }
    if (Object.keys(data).length === 0) continue
    try {
      await prisma.fixedClass.update({ where: { id }, data })
      updated += 1
    } catch (error) {
      warnings.push(
        `FixedClass/${id} roles: ${error instanceof Error ? error.message : "update thất bại"}`
      )
    }
  }
  return updated
}

async function importJoinTable(
  table:
    | "_ClassRegisterSessionToTrainingCourse"
    | "_FixedClassToSubjectClass"
    | "_PrerequisiteSubject"
    | "_CoRequisiteSubject",
  rows: Array<{ A?: string; B?: string }>,
  warnings: string[]
): Promise<number> {
  if (rows.length === 0) return 0
  let imported = 0
  for (const row of rows) {
    if (!row.A || !row.B) continue
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ql-dao-tao"."${table}" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        row.A,
        row.B
      )
      imported += 1
    } catch (error) {
      warnings.push(
        `${table}/${row.A}-${row.B}: ${error instanceof Error ? error.message : "import thất bại"}`
      )
    }
  }
  return imported
}

export async function importTrainingDataFromJson(
  payload: unknown,
  _db: PrismaClient = prisma
): Promise<ImportTrainingDataResult> {
  const json = payload as ExportPayload
  if (!json?.data || typeof json.data !== "object") {
    throw new Error("File JSON thiếu khối data")
  }
  if (
    json.version &&
    !SUPPORTED_IMPORT_VERSIONS.includes(json.version as (typeof SUPPORTED_IMPORT_VERSIONS)[number])
  ) {
    throw new Error(
      `Phiên bản file không hỗ trợ: ${json.version}. Hỗ trợ: ${SUPPORTED_IMPORT_VERSIONS.join(", ")}`
    )
  }

  const data = json.data as Record<string, unknown>
  const sessions = asRows(data, "ClassRegisterSession")
  const session = sessions[0]
  if (!session?.id || !session?.name) {
    throw new Error("Không tìm thấy ClassRegisterSession trong file")
  }

  const warnings: string[] = []
  const steps: ImportStepResult[] = []

  // 1) DM catalogs (Đơn vị: insert không cha trước, rồi cập nhật sParentId)
  for (const table of DM_IMPORT_ORDER) {
    const rows = asRows(data, table)
    if (table === "DM_DonVi" && rows.length > 0) {
      const withoutParent = rows.map((row) => ({ ...row, sParentId: null, sTruongDonVi: null }))
      const count1 = await importCreateMany(table, withoutParent, warnings)
      const count2 = await importUpsert(table, rows, warnings)
      steps.push({ table, count: Math.max(count1, count2) })
      continue
    }
    const count = await importCreateMany(table, rows, warnings)
    if (count > 0 || rows.length > 0) {
      steps.push({ table, count })
    }
  }

  // 2) Training catalogs
  for (const table of TRAINING_CATALOG_ORDER) {
    const count = await importUpsert(table, asRows(data, table), warnings)
    if (count > 0 || asRows(data, table).length > 0) {
      steps.push({ table, count })
    }
  }

  // 3) Stub missing TrainingField before majors
  const stubCount = await ensureMissingTrainingFields(data, warnings)
  if (stubCount > 0) {
    steps.push({ table: "TrainingField(stub)", count: stubCount })
  }

  // 4) Business tables (FixedClass with null roles first)
  for (const table of BUSINESS_UPSERT_ORDER) {
    const rows = asRows(data, table)
    const nullFields =
      table === "FixedClass"
        ? [...FIXED_CLASS_ROLE_FIELDS]
        : table === "ClassSchedule"
          ? ["originalScheduleId"]
          : []
    const count = await importUpsert(table, rows, warnings, { nullFields })
    if (count > 0 || rows.length > 0) {
      steps.push({ table, count })
    }
  }

  // 5) Patch FixedClass roles after students exist
  const roleCount = await patchFixedClassRoles(asRows(data, "FixedClass"), warnings)
  if (roleCount > 0) {
    steps.push({ table: "FixedClass(roles)", count: roleCount })
  }

  // 6) Patch ClassSchedule self-FK
  const schedules = asRows(data, "ClassSchedule").filter((s) => s.originalScheduleId)
  let scheduleLinks = 0
  for (const row of schedules) {
    if (typeof row.id !== "string" || typeof row.originalScheduleId !== "string") continue
    try {
      await prisma.classSchedule.update({
        where: { id: row.id },
        data: { originalScheduleId: row.originalScheduleId },
      })
      scheduleLinks += 1
    } catch (error) {
      warnings.push(
        `ClassSchedule/${row.id} original: ${
          error instanceof Error ? error.message : "update thất bại"
        }`
      )
    }
  }
  if (scheduleLinks > 0) {
    steps.push({ table: "ClassSchedule(links)", count: scheduleLinks })
  }

  // 7) M2M joins
  const sessionJoin = await importJoinTable(
    "_ClassRegisterSessionToTrainingCourse",
    asRows(data, "_ClassRegisterSessionToTrainingCourse") as Array<{ A?: string; B?: string }>,
    warnings
  )
  steps.push({ table: "_ClassRegisterSessionToTrainingCourse", count: sessionJoin })

  const fixedJoin = await importJoinTable(
    "_FixedClassToSubjectClass",
    asRows(data, "_FixedClassToSubjectClass") as Array<{ A?: string; B?: string }>,
    warnings
  )
  if (fixedJoin > 0 || asRows(data, "_FixedClassToSubjectClass").length > 0) {
    steps.push({ table: "_FixedClassToSubjectClass", count: fixedJoin })
  }

  const prereqJoin = await importJoinTable(
    "_PrerequisiteSubject",
    asRows(data, "_PrerequisiteSubject") as Array<{ A?: string; B?: string }>,
    warnings
  )
  if (prereqJoin > 0 || asRows(data, "_PrerequisiteSubject").length > 0) {
    steps.push({ table: "_PrerequisiteSubject", count: prereqJoin })
  }

  const coreqJoin = await importJoinTable(
    "_CoRequisiteSubject",
    asRows(data, "_CoRequisiteSubject") as Array<{ A?: string; B?: string }>,
    warnings
  )
  if (coreqJoin > 0 || asRows(data, "_CoRequisiteSubject").length > 0) {
    steps.push({ table: "_CoRequisiteSubject", count: coreqJoin })
  }

  return {
    sessionId: String(session.id),
    sessionName: String(session.name),
    steps,
    warnings,
  }
}

/** Parse file JSON (không xóa file — caller tự cleanup). */
export async function processImportFromFile(filePath: string): Promise<ImportTrainingDataResult> {
  const { readImportJson } = await import("./data-sync/import-file-store")
  const payload = await readImportJson(filePath)
  return importTrainingDataFromJson(payload)
}

async function finishImportJob(syncHistoryId: string, result: ImportTrainingDataResult) {
  const description =
    result.warnings.length > 0
      ? result.warnings.slice(0, 80).join("\n")
      : result.steps.map((s) => `${s.table}: ${s.count}`).join(", ")
  await markDataSyncHistorySuccess(syncHistoryId, {
    classRegisterSessionId: result.sessionId,
    description,
  })
  console.log(
    `[data-sync] import xong history=${syncHistoryId} session=${result.sessionName} warnings=${result.warnings.length}`
  )
}

/** Chạy import nền từ payload đã parse — fallback khi không dùng file/Kafka. */
export function runImportTrainingDataJob(syncHistoryId: string, payload: unknown) {
  void (async () => {
    try {
      const result = await importTrainingDataFromJson(payload)
      await finishImportJob(syncHistoryId, result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nhập dữ liệu thất bại"
      console.error(`[data-sync] import lỗi history=${syncHistoryId}`, error)
      await markDataSyncHistoryFailed(syncHistoryId, message).catch((e) => {
        console.error("[data-sync] không ghi được FAILED", e)
      })
    }
  })()
}

/** Fallback in-process: parse file tạm + import + xóa file. */
export function runImportTrainingDataJobFromFile(syncHistoryId: string, filePath: string) {
  void (async () => {
    try {
      const result = await processImportFromFile(filePath)
      await finishImportJob(syncHistoryId, result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nhập dữ liệu thất bại"
      console.error(`[data-sync] import lỗi history=${syncHistoryId}`, error)
      await markDataSyncHistoryFailed(syncHistoryId, message).catch((e) => {
        console.error("[data-sync] không ghi được FAILED", e)
      })
    } finally {
      const { removeImportFile } = await import("./data-sync/import-file-store")
      await removeImportFile(filePath)
    }
  })()
}
