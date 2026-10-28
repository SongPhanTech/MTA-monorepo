import { Prisma, type PrismaClient } from "@workspace/db"
import { prisma } from "../prisma"
import {
  markDataSyncHistoryFailed,
  markDataSyncHistoryProcessing,
  markDataSyncHistorySuccess,
} from "./data-sync-history"
import { requiresExportSignature, verifyExportSignature } from "./data-sync-signature"

export const SUPPORTED_IMPORT_VERSIONS = [
  "1.3.0",
  "1.3.1",
  "1.3.2",
  "1.3.3",
  "1.4.0",
  "1.5.0",
  "1.5.1",
  "1.5.2",
  "1.6.0",
] as const

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
  /** Các bản ghi không thể nhập; dùng để quyết định trạng thái lịch sử đồng bộ. */
  errors: string[]
}

const MODEL_LABELS: Record<string, string> = {
  AcademicRankingConvert: "quy đổi xếp loại",
  TrainingCourse: "khóa đào tạo",
  TrainingField: "ngành đào tạo",
  TrainingMajor: "chuyên ngành",
  Student: "sinh viên",
  SubjectClass: "lớp học phần",
  ClassRegisterSession: "đợt đăng ký học",
}

function fieldLabel(field: string) {
  return field
    .replace(/Id$/, "")
    .replace(/([A-Z])/g, " $1")
    .trim()
}

/** Không đưa lỗi Prisma ra màn hình: nêu bản ghi, dữ liệu tham chiếu và cách xử lý. */
function importRowError(modelName: string, row: JsonRecord, error: unknown): string {
  const id = row[pkField(modelName)]
  const location = `${MODEL_LABELS[modelName] ?? modelName}${id ? ` (mã: ${String(id)})` : ""}`
  const technical = error instanceof Error ? error.message : String(error)
  const constraintField = technical.match(
    /constraint:\s*`?[^`"\s]*?_([A-Za-z][A-Za-z0-9]*Id)_fkey/i
  )?.[1]
  const references = Object.entries(row)
    .filter(
      ([key, value]) =>
        key !== pkField(modelName) &&
        key.endsWith("Id") &&
        value != null &&
        value !== "" &&
        (!constraintField || key === constraintField)
    )
    .map(([key, value]) => `${fieldLabel(key)} = ${String(value)}`)

  if (/foreign key|P2003|constraint/i.test(technical)) {
    const referenceText =
      references.length > 0 ? ` Giá trị cần đối chiếu: ${references.join("; ")}.` : ""
    return `Bản ghi ${location} không thể nhập vì thiếu hoặc sai dữ liệu tham chiếu.${referenceText} Kiểm tra danh mục/bản ghi liên quan tại nguồn hoặc bổ sung danh mục đó vào hệ thống đích, sau đó xuất file và đồng bộ lại.`
  }
  if (/unique|P2002/i.test(technical)) {
    return `Bản ghi ${location} bị trùng với dữ liệu hiện có. Kiểm tra mã định danh của bản ghi ở dữ liệu nguồn rồi đồng bộ lại.`
  }
  return `Bản ghi ${location} có dữ liệu không hợp lệ hoặc thiếu trường bắt buộc. Kiểm tra lại dữ liệu nguồn của bản ghi này rồi đồng bộ lại.`
}

export function getImportFailureMessage(result: ImportTrainingDataResult): string | undefined {
  if (result.errors.length === 0) return undefined
  const displayed = result.errors.slice(0, 20)
  const remaining = result.errors.length - displayed.length
  return [
    `Không hoàn tất đồng bộ: có ${result.errors.length} bản ghi cần xử lý.`,
    ...displayed.map((error, index) => `${index + 1}. ${error}`),
    ...(remaining > 0
      ? [
          `Còn ${remaining} lỗi khác. Vui lòng chỉnh dữ liệu nguồn/danh mục tham chiếu trước khi đồng bộ lại.`,
        ]
      : []),
  ].join("\n")
}

export function getImportSuccessDescription(result: ImportTrainingDataResult): string {
  const imported = result.steps.reduce((total, step) => total + step.count, 0)
  const detail = result.steps
    .filter((step) => step.count > 0)
    .map((step) => `${step.table}: ${step.count}`)
    .join(", ")
  const warningCount = result.warnings.length
  return `Đã nhập/cập nhật thành công ${imported} bản ghi${detail ? ` (${detail})` : ""}.${warningCount ? ` Có ${warningCount} lưu ý đã được hệ thống xử lý.` : ""}`
}

export function getImportExceptionMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ""
  if (/phiên bản file|version/i.test(message))
    return `${message}. Hãy xuất lại file từ phiên bản hệ thống được hỗ trợ rồi đồng bộ lại.`
  if (/ClassRegisterSession|đợt đăng ký/i.test(message))
    return "File đồng bộ thiếu thông tin đợt đăng ký học. Kiểm tra dữ liệu nguồn và xuất lại file trước khi đồng bộ."
  if (/khối data|parse|decrypt|signature/i.test(message))
    return "File đồng bộ không hợp lệ hoặc đã bị thay đổi. Hãy xuất lại file từ hệ thống nguồn rồi thử lại."
  return "Không thể nhập dữ liệu do file hoặc dữ liệu nguồn không hợp lệ. Kiểm tra lại file xuất và các danh mục tham chiếu trước khi đồng bộ lại."
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
  StudentSubjectScore: ["examId", "subjectClassId", "semesterId"],
  StudentSemesterResult: ["rankId"],
  Staff: [],
  Lecturer: [],
}

/** FK không được ghi đè thành null khi update — chỉ insert/gán khi giá trị hợp lệ */
const PRESERVE_ON_UPDATE_FIELDS: Record<string, string[]> = {
  StudentSubjectScore: ["subjectClassId", "semesterId"],
}

const PRESERVE_FK_MODEL: Record<string, string> = {
  subjectClassId: "SubjectClass",
  semesterId: "Semester",
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
  "AcademicWarningRule",
  "DisciplinaryWarningReason",
  "Scholarship",
  "ScholarshipCriteria",
  "AcademicWarning",
  "DisciplinaryWarning",
  "ScholarshipAward",
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
          warnings.push(`LỖI: ${importRowError(modelName, row, rowError)}`)
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
  options?: {
    nullFields?: string[]
    onProgress?: (message: string) => Promise<void> | void
  }
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

  const preparedRows: JsonRecord[] = []
  const rawMap = new Map<string, JsonRecord>()

  for (const raw of rows) {
    let prepared = prepareRow(modelName, raw, options)
    const id = prepared[pk]
    if (!id) {
      warnings.push(
        `LỖI: Bản ghi ${MODEL_LABELS[modelName] ?? modelName} không có mã ${pk}. Bổ sung mã định danh ở dữ liệu nguồn rồi đồng bộ lại.`
      )
      continue
    }

    for (const field of preserveFields) {
      const existing = existingPreserveFks[field]
      const fk = prepared[field]
      if (typeof fk === "string" && existing && !existing.has(fk)) {
        prepared = { ...prepared, [field]: null }
      }
    }

    preparedRows.push(prepared)
    rawMap.set(String(id), raw)
  }

  const CHUNK_SIZE = 500
  const CONCURRENCY = 4
  let imported = 0

  for (let c = 0; c < preparedRows.length; c += CHUNK_SIZE) {
    // Nhường event loop để các request HTTP và Kafka heartbeat không bị nghẽn
    if (c > 0 && c % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    if (options?.onProgress && c > 0 && c % 2500 === 0) {
      await options.onProgress(`Đang nhập ${modelName} (${c}/${preparedRows.length} dòng)...`)
    }
    const chunk = preparedRows.slice(c, c + CHUNK_SIZE)
    const chunkIds = chunk.map((r) => String(r[pk]))

    let existingSet = new Set<string>()
    try {
      existingSet = await existingIdsOf(modelName, chunkIds)
    } catch {
      existingSet = new Set()
    }

    const toInsert = chunk.filter((r) => !existingSet.has(String(r[pk])))
    const toUpdate = chunk.filter((r) => existingSet.has(String(r[pk])))

    // 1. Chèn hàng loạt các bản ghi mới bằng createMany (skipDuplicates)
    if (toInsert.length > 0) {
      try {
        const res = await delegate.createMany({
          data: toInsert,
          skipDuplicates: true,
        })
        imported += res.count
      } catch {
        // Fallback: nếu createMany lỗi ràng buộc, chuyển các bản ghi này vào hàng chờ upsert song song
        toUpdate.push(...toInsert)
      }
    }

    // 2. Cập nhật các bản ghi đã tồn tại song song theo nhóm CONCURRENCY
    if (toUpdate.length > 0) {
      for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
        const subChunk = toUpdate.slice(i, i + CONCURRENCY)
        await Promise.all(
          subChunk.map(async (prepared) => {
            const id = prepared[pk]
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
              // Retry: null FK tùy chọn; không xoá FK cần giữ
              try {
                const raw = rawMap.get(String(id))
                if (!raw) return
                const retry = prepareRow(modelName, raw, {
                  nullFields: [
                    ...(options?.nullFields ?? []),
                    ...(NULLABLE_RISKY_FIELDS[modelName] ?? []),
                  ],
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
                  `CẢNH BÁO: Bản ghi ${MODEL_LABELS[modelName] ?? modelName} (mã: ${String(id)}) đã được nhập sau khi bỏ qua một liên kết tùy chọn không còn tồn tại.`
                )
              } catch (retryError) {
                warnings.push(
                  `LỖI: ${importRowError(modelName, rawMap.get(String(id)) ?? prepared, retryError)}`
                )
              }
            }
          })
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
      warnings.push(
        `LỖI: Không thể tạo danh mục ngành đào tạo (mã: ${id}) vì thiếu đơn vị quản lý. Bổ sung đơn vị quản lý hoặc danh mục ngành đào tạo ở dữ liệu nguồn rồi đồng bộ lại.`
      )
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
      warnings.push(`LỖI: ${importRowError("TrainingField", { id }, error)}`)
    }
  }

  return created
}

async function patchFixedClassRoles(rows: JsonRecord[], warnings: string[]): Promise<number> {
  let updated = 0
  const valid = rows.filter((r) => typeof r.id === "string")
  const CONCURRENCY = 15

  for (let i = 0; i < valid.length; i += CONCURRENCY) {
    const chunk = valid.slice(i, i + CONCURRENCY)
    await Promise.all(
      chunk.map(async (raw) => {
        const id = raw.id as string
        const data: JsonRecord = {}
        for (const field of FIXED_CLASS_ROLE_FIELDS) {
          if (raw[field] != null) data[field] = raw[field]
        }
        if (Object.keys(data).length === 0) return
        try {
          await prisma.fixedClass.update({ where: { id }, data })
          updated += 1
        } catch (error) {
          warnings.push(`LỖI: ${importRowError("FixedClass", raw, error)}`)
        }
      })
    )
  }
  return updated
}

async function importJoinTable(
  table:
    | "_ClassRegisterSessionToTrainingCourse"
    | "_FixedClassToSubjectClass"
    | "_PrerequisiteSubject"
    | "_CoRequisiteSubject"
    | "_AcademicWarningToAcademicWarningRule"
    | "_DisciplinaryWarningToDisciplinaryWarningReason",
  rows: Array<{ A?: string; B?: string }>,
  warnings: string[]
): Promise<number> {
  const valid = rows.filter((r): r is { A: string; B: string } => Boolean(r.A && r.B))
  if (valid.length === 0) return 0

  const CHUNK_SIZE = 500
  let imported = 0

  for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
    const chunk = valid.slice(i, i + CHUNK_SIZE)
    const valuesPlaceholders: string[] = []
    const params: unknown[] = []

    chunk.forEach((row, idx) => {
      valuesPlaceholders.push(`($${idx * 2 + 1}, $${idx * 2 + 2})`)
      params.push(row.A, row.B)
    })

    const sql = `INSERT INTO "ql-dao-tao"."${table}" ("A", "B") VALUES ${valuesPlaceholders.join(
      ", "
    )} ON CONFLICT DO NOTHING`

    try {
      const count = (await prisma.$executeRawUnsafe(sql, ...params)) as number
      imported += count
    } catch {
      // Fallback chèn từng dòng nếu batch gặp lỗi
      for (const row of chunk) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "ql-dao-tao"."${table}" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            row.A,
            row.B
          )
          imported += 1
        } catch (rowError) {
          warnings.push(
            `LỖI: Không thể liên kết dữ liệu ${table} (${row.A} – ${row.B}) vì một bản ghi tham chiếu chưa có. Bổ sung các bản ghi liên quan từ dữ liệu nguồn rồi đồng bộ lại.`
          )
        }
      }
    }
  }

  return imported
}

export type ProgressCallback = (message: string) => Promise<void> | void

export async function importTrainingDataFromJson(
  payload: unknown,
  onProgressOrDb?: ProgressCallback | PrismaClient,
  onProgress?: ProgressCallback
): Promise<ImportTrainingDataResult> {
  const progressCb: ProgressCallback | undefined =
    typeof onProgressOrDb === "function" ? onProgressOrDb : onProgress

  const json = payload as ExportPayload & { signature?: string }
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

  // Legacy JSON 1.5.2 có HMAC trong body. Gói 1.6.0+ đi qua .dat (AES-GCM) — đã verify lúc giải mã.
  if (
    json.version !== "1.6.0" &&
    (requiresExportSignature(json.version) || typeof json.signature === "string")
  ) {
    verifyExportSignature(json as Record<string, unknown>)
  }

  const data = json.data as Record<string, unknown>
  const sessions = asRows(data, "ClassRegisterSession")
  const session = sessions[0]
  if (!session?.id || !session?.name) {
    throw new Error("Không tìm thấy ClassRegisterSession trong file")
  }

  const warnings: string[] = []
  const steps: ImportStepResult[] = []

  const totalTables =
    DM_IMPORT_ORDER.length + TRAINING_CATALOG_ORDER.length + BUSINESS_UPSERT_ORDER.length + 5
  let currentTableIndex = 0

  // 1) DM catalogs (Đơn vị: insert không cha trước, rồi cập nhật sParentId)
  for (const table of DM_IMPORT_ORDER) {
    currentTableIndex++
    const rows = asRows(data, table)
    if (rows.length > 0 && progressCb) {
      await progressCb(
        `Đang nhập ${table} (${rows.length} dòng)... [${currentTableIndex}/${totalTables}]`
      )
    }
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
    currentTableIndex++
    const rows = asRows(data, table)
    if (rows.length > 0 && progressCb) {
      await progressCb(
        `Đang nhập ${table} (${rows.length} dòng)... [${currentTableIndex}/${totalTables}]`
      )
    }
    const count = await importUpsert(table, rows, warnings)
    if (count > 0 || rows.length > 0) {
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
    currentTableIndex++
    const rows = asRows(data, table)
    if (rows.length > 0) {
      console.log(
        `[data-sync] bắt đầu ${table} (${rows.length} dòng) [${currentTableIndex}/${totalTables}]...`
      )
      if (progressCb) {
        await progressCb(
          `Đang nhập ${table} (${rows.length} dòng)... [${currentTableIndex}/${totalTables}]`
        )
      }
    }
    const nullFields =
      table === "FixedClass"
        ? [...FIXED_CLASS_ROLE_FIELDS]
        : table === "ClassSchedule"
          ? ["originalScheduleId"]
          : []
    const count = await importUpsert(table, rows, warnings, {
      nullFields,
      onProgress: progressCb
        ? async (subMsg) => {
            await progressCb(`${subMsg} [${currentTableIndex}/${totalTables}]`)
          }
        : undefined,
    })
    if (count > 0 || rows.length > 0) {
      steps.push({ table, count })
      console.log(`[data-sync] xong ${table}: ${count} bản ghi`)
    }
  }

  // 5) Patch FixedClass roles after students exist
  if (progressCb) await progressCb("Đang đồng bộ vai trò lớp cố định...")
  const roleCount = await patchFixedClassRoles(asRows(data, "FixedClass"), warnings)
  if (roleCount > 0) {
    steps.push({ table: "FixedClass(roles)", count: roleCount })
  }

  // 6) Patch ClassSchedule self-FK
  if (progressCb) await progressCb("Đang liên kết thời khóa biểu...")
  const schedules = asRows(data, "ClassSchedule").filter(
    (s) =>
      s.originalScheduleId && typeof s.id === "string" && typeof s.originalScheduleId === "string"
  )
  let scheduleLinks = 0
  const CONCURRENCY = 15
  for (let i = 0; i < schedules.length; i += CONCURRENCY) {
    const chunk = schedules.slice(i, i + CONCURRENCY)
    await Promise.all(
      chunk.map(async (row) => {
        try {
          await prisma.classSchedule.update({
            where: { id: row.id as string },
            data: { originalScheduleId: row.originalScheduleId as string },
          })
          scheduleLinks += 1
        } catch (error) {
          warnings.push(`LỖI: ${importRowError("ClassSchedule", row, error)}`)
        }
      })
    )
  }
  if (scheduleLinks > 0) {
    steps.push({ table: "ClassSchedule(links)", count: scheduleLinks })
  }

  // 7) M2M joins
  if (progressCb) await progressCb("Đang đồng bộ quan hệ liên kết bảng (M2M)...")
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

  const academicWarningJoin = await importJoinTable(
    "_AcademicWarningToAcademicWarningRule",
    asRows(data, "_AcademicWarningToAcademicWarningRule") as Array<{ A?: string; B?: string }>,
    warnings
  )
  if (academicWarningJoin > 0 || asRows(data, "_AcademicWarningToAcademicWarningRule").length > 0) {
    steps.push({ table: "_AcademicWarningToAcademicWarningRule", count: academicWarningJoin })
  }

  const disciplinaryWarningJoin = await importJoinTable(
    "_DisciplinaryWarningToDisciplinaryWarningReason",
    asRows(data, "_DisciplinaryWarningToDisciplinaryWarningReason") as Array<{
      A?: string
      B?: string
    }>,
    warnings
  )
  if (
    disciplinaryWarningJoin > 0 ||
    asRows(data, "_DisciplinaryWarningToDisciplinaryWarningReason").length > 0
  ) {
    steps.push({
      table: "_DisciplinaryWarningToDisciplinaryWarningReason",
      count: disciplinaryWarningJoin,
    })
  }

  return {
    sessionId: String(session.id),
    sessionName: String(session.name),
    steps,
    warnings,
    errors: warnings.filter((warning) => warning.startsWith("LỖI:")),
  }
}

/** Đọc JSON từ Redis theo syncHistoryId (caller tự xóa key). */
export async function processImportFromRedis(
  syncHistoryId: string,
  onProgress?: ProgressCallback
): Promise<ImportTrainingDataResult> {
  const { readImportPayload } = await import("./data-sync/import-file-store")
  if (onProgress) await onProgress("Đang đọc và phân tích file JSON...")
  const payload = await readImportPayload(syncHistoryId)
  return importTrainingDataFromJson(payload, onProgress)
}

/** @deprecated Alias — tham số là syncHistoryId (hoặc redis key), không còn path disk. */
export async function processImportFromFile(
  syncHistoryIdOrPath: string,
  onProgress?: ProgressCallback
): Promise<ImportTrainingDataResult> {
  const { readImportJson } = await import("./data-sync/import-file-store")
  if (onProgress) await onProgress("Đang đọc và phân tích file JSON...")
  const payload = await readImportJson(syncHistoryIdOrPath)
  return importTrainingDataFromJson(payload, onProgress)
}

async function finishImportJob(syncHistoryId: string, result: ImportTrainingDataResult) {
  const failureMessage = getImportFailureMessage(result)
  if (failureMessage) {
    await markDataSyncHistoryFailed(syncHistoryId, failureMessage)
    return
  }
  await markDataSyncHistorySuccess(syncHistoryId, {
    classRegisterSessionId: result.sessionId,
    description: getImportSuccessDescription(result),
  })
  console.log(
    `[data-sync] import xong history=${syncHistoryId} session=${result.sessionName} warnings=${result.warnings.length}`
  )
}

/** Đánh dấu bản ghi DataSyncHistory khi file bắt đầu được tiếp nhận để xử lý. */
export async function markImportJobProcessing(syncHistoryId: string, fileName?: string | null) {
  return markDataSyncHistoryProcessing(
    syncHistoryId,
    `Đã nhận file${fileName ? ` ${fileName}` : ""}, đang chờ xử lý...`
  )
}

/** Chạy import nền từ payload đã parse — fallback khi không dùng file/Kafka. */
export function runImportTrainingDataJob(syncHistoryId: string, payload: unknown) {
  void (async () => {
    try {
      const result = await importTrainingDataFromJson(payload, async (msg) => {
        await markDataSyncHistoryProcessing(syncHistoryId, msg).catch(() => undefined)
      })
      await finishImportJob(syncHistoryId, result)
    } catch (error) {
      const message = getImportExceptionMessage(error)
      console.error(`[data-sync] import lỗi history=${syncHistoryId}`, error)
      await markDataSyncHistoryFailed(syncHistoryId, message).catch((e) => {
        console.error("[data-sync] không ghi được FAILED", e)
      })
    }
  })()
}

/** Fallback in-process: đọc Redis + import + xóa key. */
export function runImportTrainingDataJobFromRedis(syncHistoryId: string) {
  void (async () => {
    try {
      console.log(`[data-sync] fallback đang xử lý history=${syncHistoryId}`)
      await markDataSyncHistoryProcessing(syncHistoryId, "Đang nhập dữ liệu")
      const result = await processImportFromRedis(syncHistoryId, async (msg) => {
        await markDataSyncHistoryProcessing(syncHistoryId, msg).catch(() => undefined)
      })
      await finishImportJob(syncHistoryId, result)
    } catch (error) {
      const message = getImportExceptionMessage(error)
      console.error(`[data-sync] import lỗi history=${syncHistoryId}`, error)
      await markDataSyncHistoryFailed(syncHistoryId, message).catch((e) => {
        console.error("[data-sync] không ghi được FAILED", e)
      })
    } finally {
      const { removeImportPayload } = await import("./data-sync/import-file-store")
      await removeImportPayload(syncHistoryId)
    }
  })()
}

/** @deprecated Dùng runImportTrainingDataJobFromRedis */
export function runImportTrainingDataJobFromFile(syncHistoryId: string, _filePath?: string) {
  runImportTrainingDataJobFromRedis(syncHistoryId)
}
