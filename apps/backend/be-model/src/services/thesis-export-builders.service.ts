import { CouncilRole, SupervisorRole, TrainingObjectTypes } from "@workspace/db/client"
import { fetchMinio } from "@workspace/libs"
import { formatDateInSlash } from "@workspace/libs/timezone"
import { buildExcelFromTemplate, type TableRow } from "@workspace/libs/template-excel-core"
import { resolveCouncilMemberUnitName, type OrgUnitNode } from "@workspace/libs/utils"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { buildExcelWorkbookBuffer } from "../api/excel-template"
import type { ThesisExportFilter } from "../dto/thesis-export.dto"
import { renderThesisPaymentXlsx } from "./thesis-excel-render.service"
import {
  findThesisExportStudentIds,
  findThesisExportStudentRows,
} from "./thesis-export-query.service"
import {
  buildCouncilPaymentExportPayload,
  buildSupervisorPaymentExportPayload,
} from "./thesis-payment-export.service"
import {
  councilMemberProfile,
  councilRoleOrder,
  formatAmountWithComma,
  getSupervisorDefaultPayAmount,
  getSupervisorName,
  readDecimalAmount,
  resolveExpertWorkplace,
  resolveInAcademy,
  tenDoiTuong,
} from "./thesis-payment.helpers"
import {
  syncCouncilPaymentsForThesisSession,
  syncSupervisorPaymentsForThesisSession,
} from "./thesis-payment-sync.service"
import { renderDocxTemplate } from "./docx-template-render.service"
import { prisma } from ".."

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const TEMPLATE_PREFIX = "mta/luan-van"

export type ThesisExportResult = {
  buffer: Buffer
  fileName: string
  contentType: string
}

type StudentRow = Awaited<ReturnType<typeof findThesisExportStudentRows>>[number]
type Project = Record<string, any>

function getProject(student: StudentRow): Project | undefined {
  return student.thesisRegistrations?.[0]?.thesisProject as Project | undefined
}

function formatDocDate(date?: Date | string | null) {
  if (!date) return { day: "", month: "", year: "", full: "" }
  const full = formatDateInSlash(date)
  if (!full) return { day: "", month: "", year: "", full: "" }
  const [day = "", month = "", year = ""] = full.split("/")
  return { day, month, year, full }
}

function formatBirthDate(date?: Date | string | null) {
  return formatDocDate(date).full
}

function formatDefenseTime(value?: Date | string | null) {
  if (!value) return ""
  const d = dayjs(value)
  return d.isValid() ? d.format("HH:mm") : ""
}

function studentName(student: StudentRow) {
  return String(student.userProfile?.fullname ?? "")
}

function studentMajor(student: StudentRow) {
  return (
    (student.fixedClass?.curriculumVersion as any)?.curriculum?.trainingMajor ??
    (student.curriculumVersion as any)?.curriculum?.trainingMajor ??
    {}
  )
}

function studentCurriculum(student: StudentRow) {
  return (
    (student.fixedClass as any)?.curriculumVersion?.curriculum ??
    (student.curriculumVersion as any)?.curriculum ??
    null
  )
}

function studentTrainingField(student: StudentRow) {
  const curriculum = studentCurriculum(student)
  const major = curriculum?.trainingMajor ?? studentMajor(student)
  const majorName = String(major?.name || "")
  const majorField = String(major?.trainingField?.name || "")
  const curriculumField = String(curriculum?.trainingField?.name || "")
  if (curriculumField && majorField === majorName && curriculumField !== majorField)
    return curriculumField
  return majorField || curriculumField
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi")
}

/** Hiện "(chuyên ngành ...)" khi tên chuyên ngành khác tên ngành. */
function shouldShowSpecialization(nganh: string, chuyenNganh: string) {
  const specialization = normalizeDisplayName(chuyenNganh)
  if (!specialization) return false
  return specialization !== normalizeDisplayName(nganh)
}

function studentCourse(student: StudentRow) {
  return (student.fixedClass as any)?.trainingCourse ?? {}
}

function trainingObjectShort(student: StudentRow) {
  const trainingObject = studentCourse(student)?.trainingObjectType ?? {}
  const key = trainingObject.type || trainingObject.name
  return key ? (tenDoiTuong[key]?.shortname ?? trainingObject.name ?? "") : ""
}

function trainingObjectFull(student: StudentRow) {
  const trainingObject = studentCourse(student)?.trainingObjectType ?? {}
  const key = trainingObject.type || trainingObject.name
  return key ? (tenDoiTuong[key]?.fullname ?? trainingObject.name ?? "") : ""
}

function getCouncilMember(project: Project | undefined, role: CouncilRole) {
  return project?.council?.members?.find((m: any) => m.role === role)
}

function getMemberProfile(project: Project | undefined, role: CouncilRole) {
  return councilMemberProfile(getCouncilMember(project, role))
}

function splitDecisionMaker(value?: string | null) {
  const raw = value?.trim().replace(/\s+/g, " ") ?? ""
  const roles = [
    { pattern: /^(PGĐ|PHÓ\s+GIÁM\s+ĐỐC)(?=\s|$)/i, text1: "KT. GIÁM ĐỐC", text2: "PHÓ GIÁM ĐỐC" },
    { pattern: /^(GĐ|GIÁM\s+ĐỐC)(?=\s|$)/i, text1: "GIÁM ĐỐC", text2: "" },
  ]
  for (const role of roles) {
    const match = raw.match(role.pattern)
    const matched = match?.[0]
    if (!match || !matched) continue
    return {
      title: match[1] ?? "",
      name: raw.slice(matched.length).trim(),
      text1: role.text1,
      text2: role.text2,
    }
  }
  return {
    title: "",
    name: raw,
    text1: "KT. GIÁM ĐỐC",
    text2: "PHÓ GIÁM ĐỐC",
  }
}

function signer(filters: ThesisExportFilter) {
  return {
    text1: filters.isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
    text2: filters.isChief ? "" : "PHÓ TRƯỞNG PHÒNG",
    name: filters.signerName || "",
  }
}

function assertRows(rows: StudentRow[], message = "Không có dữ liệu để xuất file.") {
  if (!rows.length) throw new Error(message)
}

function firstRow(rows: StudentRow[]) {
  const row = rows[0]
  if (!row) throw new Error("Không có dữ liệu để xuất file.")
  return row
}

async function renderXlsxTemplate(path: string, data: Record<string, unknown>, fileName: string) {
  const buffer = await buildExcelWorkbookBuffer({
    head: { data: null },
    tail: { data: null },
    fileName,
    path,
    prefix: TEMPLATE_PREFIX,
    payload: [{ data }],
    showGridLines: true,
    wrapText: true,
  })
  return { buffer, fileName, contentType: XLSX_CONTENT_TYPE }
}

async function renderXlsxItems(path: string, items: Record<string, unknown>[], fileName: string) {
  const buffer = await buildExcelWorkbookBuffer({
    head: { data: null },
    tail: { data: null },
    fileName,
    path,
    prefix: TEMPLATE_PREFIX,
    payload: items.map((data, idx) => ({
      data: { ...data, "ngắt trang": idx === items.length - 1 ? "" : "ngắt trang" },
    })),
    showGridLines: true,
    wrapText: true,
  })
  return { buffer, fileName, contentType: XLSX_CONTENT_TYPE }
}

async function renderMinioTemplate(
  templatePath: string,
  options: Omit<Parameters<typeof buildExcelFromTemplate>[0], "templateBuffer" | "fileName">,
  fileName: string
) {
  const objectName = templatePath.split("/").pop() || templatePath
  const uploadedPath = `${TEMPLATE_PREFIX}/${objectName}`
  let response = await fetchMinio(uploadedPath)
  if (!response.ok && uploadedPath !== templatePath) {
    response = await fetchMinio(templatePath)
  }
  if (!response.ok) {
    throw new Error(`Không tải được template: ${response.status} ${response.statusText}`)
  }
  const templateBuffer = Buffer.from(await response.arrayBuffer())
  const buffer = await buildExcelFromTemplate({
    ...options,
    templateBuffer,
    fileName,
  })
  const normalizedName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`
  return { buffer, fileName: normalizedName, contentType: XLSX_CONTENT_TYPE }
}

async function renderDocx(
  path: string,
  data: Record<string, unknown>,
  fileName: string,
  patchDocumentXml?: (xml: string) => string,
  patchRenderedXml?: (xml: string) => string
) {
  const buffer = await renderDocxTemplate({
    path,
    prefix: TEMPLATE_PREFIX,
    data,
    patchDocumentXml,
    patchRenderedXml,
  })
  return { buffer, fileName, contentType: DOCX_CONTENT_TYPE }
}

/** Phụ lục danh sách luận văn: đơn vị công tác chỉ hiện với giảng viên ngoài học viện. */
function supervisorNameForPhuLuc(expert: Parameters<typeof getSupervisorName>[0]) {
  return getSupervisorName(expert, !resolveInAcademy(expert))
}

function formatPhuLucSupervisors(project: Project | undefined) {
  const gvhd1 = supervisorNameForPhuLuc(project?.supervisor)
  const gvhd2 = supervisorNameForPhuLuc(project?.coSupervisor)
  if (gvhd1 && gvhd2) return `1. ${gvhd1}\n2. ${gvhd2}`
  return gvhd1 || gvhd2 || ""
}

function commonStudentRows(rows: StudentRow[]) {
  return rows.map((student, index) => {
    const project = getProject(student)
    return {
      stt: index + 1,
      maHv: student.userProfile?.code || "",
      hoTen: studentName(student),
      tenhocvien: studentName(student),
      lastname: String(student.userProfile?.lastName ?? ""),
      firstname: String(student.userProfile?.firstName ?? ""),
      ngaySinh: formatBirthDate(student.userProfile?.dateOfBirth as any),
      ngaysinh: formatBirthDate(student.userProfile?.dateOfBirth as any),
      khoa: studentCourse(student)?.name || "",
      khoaHoc: studentCourse(student)?.name || "",
      chuyennganh: studentMajor(student)?.name || "",
      chuyenNganh: studentMajor(student)?.name || "",
      nganh: studentTrainingField(student),
      dt: trainingObjectShort(student),
      doiTuong: trainingObjectFull(student),
      tendetai: project?.title || "",
      deTai: project?.title || "",
      type: project?.type?.trim().toLowerCase() || "",
      loaiLuanVan: project?.type?.trim().toLowerCase() || "",
      language: project?.language || "",
      gvhd1: getSupervisorName(project?.supervisor, true),
      gvhd2: getSupervisorName(project?.coSupervisor, true),
      gvhd: [
        getSupervisorName(project?.supervisor, true),
        getSupervisorName(project?.coSupervisor, true),
      ]
        .filter(Boolean)
        .map((name, idx, arr) => (arr.length > 1 ? `${idx + 1}. ${name}` : name))
        .join("\n"),
      ngaybaove: formatBirthDate(project?.defenseDate),
      ngayBaoVe: formatBirthDate(project?.defenseDate),
      giobaove: formatDefenseTime(project?.defenseSession?.startTime),
      gioBaoVe: formatDefenseTime(project?.defenseSession?.startTime),
      phongbaove: project?.room?.name || "",
      diaDiem: project?.room?.name || "",
      score: Number(project?.defenseRecord?.finalScore ?? 0),
      project,
      student,
    }
  })
}

async function buildPhuLucDsLuanVan(rows: StudentRow[]) {
  const groups = new Map<
    string,
    {
      majorName: string
      specializationName: string
      thesisProject: ReturnType<typeof commonStudentRows>
    }
  >()
  const firstProject = getProject(firstRow(rows))
  const decisionDate = formatDocDate(firstProject?.thesisSession?.decisionDate)

  for (const item of commonStudentRows(rows)) {
    const key = `${item.nganh}__${item.chuyennganh}`
    if (!groups.has(key)) {
      groups.set(key, {
        majorName: item.nganh || "Chưa có ngành",
        specializationName: item.chuyennganh || "Chưa có chuyên ngành",
        thesisProject: [],
      })
    }
    groups.get(key)?.thesisProject.push(item)
  }

  let count = 1
  const dataRows: TableRow[] = Array.from(groups.values()).flatMap((group, index) => {
    const orgRow: TableRow = {
      height: 24,
      cells: [
        {
          value: `${index + 1}. Ngành ${group.majorName} (chuyên ngành ${group.specializationName}): ${group.thesisProject.length} học viên`,
          border: true,
          align: "center",
          colSpan: 6,
          bold: true,
          fontSize: 12,
        },
      ],
    }
    const thesisRows: TableRow[] = group.thesisProject.map((thesis) => ({
      height: 54,
      cells: [
        { value: `${count++}.`, border: true, align: "center", fontSize: 12 },
        {
          value: `${thesis.hoTen}\nNS: ${thesis.ngaySinh}\n${thesis.dt}-${thesis.khoaHoc}`,
          border: true,
          align: "left",
          wrapText: true,
          fontSize: 12,
        },
        { value: thesis.tendetai, border: true, align: "left", wrapText: true, fontSize: 12 },
        {
          value: formatPhuLucSupervisors(thesis.project),
          border: true,
          align: "left",
          wrapText: true,
          fontSize: 12,
        },
        { value: thesis.project?.type || "", border: true, align: "center", fontSize: 12 },
        {
          value:
            String(thesis.project?.language || "")
              .trim()
              .toLowerCase() === "tiếng việt"
              ? ""
              : String(thesis.project?.language || ""),
          border: true,
          align: "center",
          fontSize: 12,
        },
      ],
    }))
    return [orgRow, ...thesisRows]
  })

  const gapRow: TableRow = { cells: [{ value: "", border: false, colSpan: 6 }] }
  const totalRow: TableRow = {
    cells: [
      {
        value: `(Tổng số: ${count - 1} học viên)`,
        align: "center",
        colSpan: 6,
        border: false,
        italic: true,
        fontSize: 12,
      },
    ],
  }

  return renderMinioTemplate(
    "mta/luan-van/PhuLucDanhSachLuanVan.xlsx",
    {
      sheets: [
        {
          sheet: "PhuLucDanhSachLuanVan",
          rows: [...dataRows, gapRow, totalRow],
          tableStartCell: { row: 7, col: 1 },
          columnWidths: [8, 24, 45, 50, 16, 12],
          data: {
            dotxet: (firstProject?.thesisSession?.name || "").trim().toUpperCase(),
            soQD: firstProject?.thesisSession?.decisionNumber || "",
            ngay: decisionDate.day,
            thang: decisionDate.month,
            nam: decisionDate.year,
            groupTitle: "",
            tongSo: "",
          },
        },
      ],
    },
    "PhuLucDsLuanVan.xlsx"
  )
}

async function buildDanhSachBaoVe(rows: StudentRow[]) {
  const data = commonStudentRows(rows)
  const session = getProject(firstRow(rows))?.thesisSession
  return renderXlsxTemplate(
    "DanhSachBaoVe.xlsx",
    {
      dotxet: (session?.name || "").toUpperCase(),
      soluonghocvien: data.length,
      data: data.map((r) => ({
        stt: r.stt,
        chuyennganh: r.chuyennganh,
        dt: r.dt,
        lastname: r.lastname,
        firstname: r.firstname,
        empty: String(r.student.userProfile?.phoneNumber ?? ""),
        ngaybaove: r.ngaybaove,
        giobaove: r.giobaove,
        phongbaove: r.phongbaove,
      })),
    },
    "DanhSachBaoVe.xlsx"
  )
}

type DanhSachBaoVeDanPhongHall = {
  hoiDong: string
  ctName: string
  tkName: string
  pb1Name: string
  pb2Name: string
  uvNames: string[]
}

type DanhSachBaoVeDanPhongSlot = {
  stt: number
  thoiGianBatDau: string
  ngayBaoVe: string
  hallsByRoom: Map<string, DanhSachBaoVeDanPhongHall>
}

type DanhSachBaoVeDanPhongGroup = {
  khoa: string
  nganh: string
  dotXet: string
  allRooms: string[]
  slots: DanhSachBaoVeDanPhongSlot[]
}

const ROWS_PER_DAN_PHONG_SLOT = 6

function buildDanhSachBaoVeDanPhongHall(
  project: Project | undefined,
  studentNames: string[]
): DanhSachBaoVeDanPhongHall {
  const councilMembers = project?.council?.members || []
  const getMember = (role: CouncilRole) => councilMembers.find((m: any) => m.role === role)
  const uvNames = councilMembers
    .filter((m: any) => m.role === CouncilRole.MEMBER)
    .map((m: any) => getSupervisorName(councilMemberProfile(m), true))
    .filter(Boolean)

  const cbhd1Name = getSupervisorName(project?.supervisor, true)
  const cbhd2Name = getSupervisorName(project?.coSupervisor, true)

  return {
    hoiDong: [
      ...studentNames.filter(Boolean),
      cbhd1Name ? `CBHD1: ${cbhd1Name}` : "",
      cbhd2Name ? `CBHD2: ${cbhd2Name}` : "",
    ]
      .filter((line) => line.trim() !== "")
      .join("\n"),
    ctName: getSupervisorName(councilMemberProfile(getMember(CouncilRole.CHAIRMAN)), true),
    tkName: getSupervisorName(councilMemberProfile(getMember(CouncilRole.SECRETARY)), true),
    pb1Name: getSupervisorName(councilMemberProfile(getMember(CouncilRole.REVIEWER_1)), true),
    pb2Name: getSupervisorName(councilMemberProfile(getMember(CouncilRole.REVIEWER_2)), true),
    uvNames,
  }
}

function buildDanhSachBaoVeDanPhongSlots(entries: { project: Project; studentName: string }[]): {
  allRooms: string[]
  slots: DanhSachBaoVeDanPhongSlot[]
} {
  const allRoomSet = new Set<string>()
  const slotMap = new Map<string, { project: Project; studentName: string }[]>()

  for (const entry of entries) {
    const { project } = entry
    const sortDate = project?.defenseDate ? dayjs(project.defenseDate).format("YYYY-MM-DD") : ""
    const dateLabel = project?.defenseDate ? formatDateInSlash(project.defenseDate) : ""
    const time = project?.defenseSession?.startTime
      ? dayjs(project.defenseSession.startTime).format("HH:mm")
      : ""
    if (!sortDate || !dateLabel || !time) continue
    const roomName = project?.room?.name || ""
    if (roomName) allRoomSet.add(roomName)
    const key = `${sortDate}__${time}__${dateLabel}`
    if (!slotMap.has(key)) slotMap.set(key, [])
    slotMap.get(key)?.push(entry)
  }

  const allRooms = Array.from(allRoomSet).sort()
  const slots = Array.from(slotMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, slotEntries], slotIdx) => {
      const [, thoiGianBatDau, ngayBaoVe] = key.split("__")
      const hallsByRoom = new Map<string, DanhSachBaoVeDanPhongHall>()
      const roomStudentNames = new Map<string, string[]>()

      for (const { project, studentName } of slotEntries) {
        const roomName = project?.room?.name || ""
        if (!roomName) continue
        if (!roomStudentNames.has(roomName)) roomStudentNames.set(roomName, [])
        if (studentName) roomStudentNames.get(roomName)?.push(studentName)
      }

      for (const { project } of slotEntries) {
        const roomName = project?.room?.name || ""
        if (roomName && !hallsByRoom.has(roomName)) {
          hallsByRoom.set(
            roomName,
            buildDanhSachBaoVeDanPhongHall(project, roomStudentNames.get(roomName) || [])
          )
        }
      }

      return {
        stt: slotIdx + 1,
        thoiGianBatDau: thoiGianBatDau || "",
        ngayBaoVe: ngayBaoVe || "",
        hallsByRoom,
      }
    })

  return { allRooms, slots }
}

function convertToDanhSachBaoVeDanPhongData(rows: StudentRow[]): DanhSachBaoVeDanPhongGroup[] {
  const validRows = commonStudentRows(rows).filter(
    (row) =>
      row.project?.defenseDate && row.project?.defenseSession?.startTime && row.project?.room?.name
  )
  if (!validRows.length) return []

  const dotXet = validRows[0]?.project?.thesisSession?.name || ""
  const orgMap = new Map<
    string,
    { orgName: string; nganh: string; entries: { project: Project; studentName: string }[] }
  >()

  for (const row of validRows) {
    const project = row.project
    if (!project) continue
    const orgId = project?.organization?.Id || project?.organizationId || "unknown"
    const orgName = project?.organization?.sTen || "Chưa có đơn vị"
    if (!orgMap.has(orgId)) {
      orgMap.set(orgId, { orgName, nganh: row.chuyennganh, entries: [] })
    }
    orgMap.get(orgId)?.entries.push({ project, studentName: row.hoTen })
  }

  return Array.from(orgMap.values()).flatMap(({ orgName, nganh, entries }) => {
    const { allRooms, slots } = buildDanhSachBaoVeDanPhongSlots(entries)
    return slots.length ? [{ khoa: orgName, nganh, dotXet, allRooms, slots }] : []
  })
}

function safeWorksheetName(name: string, usedNames: Set<string>) {
  const base =
    (name || "Chưa có đơn vị")
      .replace(/[\\/*?:[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Sheet"
  let candidate = base
  let counter = 1
  while (usedNames.has(candidate)) {
    const suffix = ` ${counter++}`
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`
  }
  usedNames.add(candidate)
  return candidate
}

async function buildDanhSachBaoVeDanPhong(rows: StudentRow[]) {
  const results = convertToDanhSachBaoVeDanPhongData(rows)
  if (!results.length) throw new Error("Chưa có dữ liệu để xuất danh sách bảo vệ dán ngoài phòng.")

  const COLS_PER_ROOM = 3
  const FIXED_COLS = 3
  const thin = { style: "thin" as const }
  const dotted = { style: "dotted" as const }
  const allBorders = { top: thin, left: thin, bottom: thin, right: thin }
  const hoiDongBorders = { top: thin, left: thin, bottom: dotted, right: thin }
  const memberCdBorders = (isLast: boolean) => ({
    top: dotted,
    left: thin,
    bottom: isLast ? thin : dotted,
    right: dotted,
  })
  const memberHdBorders = (isLast: boolean) => ({
    top: dotted,
    left: dotted,
    bottom: isLast ? thin : dotted,
    right: dotted,
  })
  const memberPbBorders = (isLast: boolean) => ({
    top: dotted,
    left: dotted,
    bottom: isLast ? thin : dotted,
    right: thin,
  })
  const defaultFont = { name: "Times New Roman", size: 13 }
  const boldFont = { ...defaultFont, bold: true }
  const titleFont = { name: "Times New Roman", size: 14, bold: true }
  const centerAlign = { horizontal: "center" as const, vertical: "middle" as const, wrapText: true }
  const leftAlign = { horizontal: "left" as const, vertical: "middle" as const, wrapText: true }
  const workbook = new ExcelJS.Workbook()
  const usedSheetNames = new Set<string>()

  for (const result of results) {
    const { khoa, nganh, allRooms, slots } = result
    const totalCols = FIXED_COLS + allRooms.length * COLS_PER_ROOM
    const ws = workbook.addWorksheet(safeWorksheetName(khoa, usedSheetNames))

    ws.getColumn(1).width = 3
    ws.getColumn(2).width = 5
    ws.getColumn(3).width = 16
    for (let i = 0; i < allRooms.length; i++) {
      ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 1).width = 6
      ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 2).width = 40
      ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 3).width = 6
    }

    const setCell = (
      row: number,
      col: number,
      value: string | number,
      opts?: { font?: Partial<ExcelJS.Font>; align?: Partial<ExcelJS.Alignment>; border?: boolean }
    ) => {
      const cell = ws.getRow(row).getCell(col)
      cell.value = value
      cell.font = opts?.font ?? defaultFont
      cell.alignment = opts?.align ?? centerAlign
      if (opts?.border !== false) cell.border = allBorders
    }

    let r = 1
    setCell(r, 1, "HỌC VIỆN KỸ THUẬT QUÂN SỰ", { font: boldFont, border: false })
    ws.mergeCells(r, 1, r, 5)
    r++
    setCell(r, 1, "PHÒNG SAU ĐẠI HỌC", { font: boldFont, border: false })
    ws.mergeCells(r, 1, r, 5)
    r++
    setCell(r, 1, "LỊCH BẢO VỆ LUẬN VĂN THẠC SĨ", { font: titleFont, border: false })
    ws.mergeCells(r, 1, r, totalCols)
    r++
    setCell(r, 1, khoa ? khoa.toUpperCase() : "", { font: boldFont, border: false })
    ws.mergeCells(r, 1, r, totalCols)
    r++
    setCell(r, 1, nganh ? `NGÀNH: ${nganh}` : "", { font: boldFont, border: false })
    ws.mergeCells(r, 1, r, totalCols)
    r++

    setCell(r, 1, "")
    ws.mergeCells(r, 1, r + 1, 1)
    setCell(r, 2, "TT", { font: boldFont })
    ws.mergeCells(r, 2, r + 1, 2)
    setCell(r, 3, "Thời gian\nBắt đầu", { font: boldFont })
    ws.mergeCells(r, 3, r + 1, 3)
    for (let i = 0; i < allRooms.length; i++) {
      const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
      setCell(r, startCol, `Hội trường: ${allRooms[i]}`, { font: boldFont })
      ws.mergeCells(r, startCol, r, startCol + COLS_PER_ROOM - 1)
    }
    r++

    for (let i = 0; i < allRooms.length; i++) {
      const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
      setCell(r, startCol, "CD", { font: boldFont })
      setCell(r, startCol + 1, "Hội đồng", { font: boldFont })
      setCell(r, startCol + 2, "PB", { font: boldFont })
    }
    r++

    const setMemberRow = (
      startCol: number,
      cdLabel: string,
      name: string,
      pbLabel: string,
      rowNum: number,
      isLast: boolean
    ) => {
      const cell1 = ws.getRow(rowNum).getCell(startCol)
      cell1.value = cdLabel
      cell1.font = defaultFont
      cell1.alignment = centerAlign
      cell1.border = memberCdBorders(isLast)

      const cell2 = ws.getRow(rowNum).getCell(startCol + 1)
      cell2.value = name
      cell2.font = defaultFont
      cell2.alignment = leftAlign
      cell2.border = memberHdBorders(isLast)

      const cell3 = ws.getRow(rowNum).getCell(startCol + 2)
      cell3.value = pbLabel
      cell3.font = defaultFont
      cell3.alignment = centerAlign
      cell3.border = memberPbBorders(isLast)
    }

    for (const slot of slots) {
      const slotStartRow = r
      setCell(r, 1, "")
      setCell(r, 2, "")
      setCell(r, 3, "")
      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        setCell(r, startCol, "")
        setCell(r, startCol + 1, "")
        setCell(r, startCol + 2, "")
        ws.mergeCells(r, startCol, r, startCol + 2)
        const mergedCell = ws.getRow(r).getCell(startCol)
        mergedCell.value = hall?.hoiDong || ""
        mergedCell.font = defaultFont
        mergedCell.alignment = centerAlign
        mergedCell.border = hoiDongBorders
      }
      const hoiDongLineCount = Math.max(
        3,
        ...allRooms.map((room) => (slot.hallsByRoom.get(room)?.hoiDong || "").split("\n").length)
      )
      ws.getRow(r).height = hoiDongLineCount * 16
      r++

      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        setMemberRow(startCol, hall?.ctName ? "CT" : "", hall?.ctName || "", "", r, false)
      }
      r++

      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        setMemberRow(startCol, hall?.tkName ? "TK" : "", hall?.tkName || "", "", r, false)
      }
      r++

      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        setMemberRow(
          startCol,
          hall?.pb1Name ? "UV" : "",
          hall?.pb1Name || "",
          hall?.pb1Name ? "PB1" : "",
          r,
          false
        )
      }
      r++

      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        setMemberRow(
          startCol,
          hall?.pb2Name ? "UV" : "",
          hall?.pb2Name || "",
          hall?.pb2Name ? "PB2" : "",
          r,
          false
        )
      }
      r++

      for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i] || ""
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        const hall = slot.hallsByRoom.get(room)
        const uvName = hall?.uvNames?.[0] || ""
        setMemberRow(startCol, uvName ? "UV" : "", uvName, "", r, true)
      }
      r++

      setCell(slotStartRow, 2, slot.stt)
      ws.mergeCells(slotStartRow, 2, slotStartRow + ROWS_PER_DAN_PHONG_SLOT - 1, 2)
      setCell(slotStartRow, 3, `${slot.thoiGianBatDau}\n---\n${slot.ngayBaoVe}`)
      ws.mergeCells(slotStartRow, 3, slotStartRow + ROWS_PER_DAN_PHONG_SLOT - 1, 3)
      ws.mergeCells(slotStartRow, 1, slotStartRow + ROWS_PER_DAN_PHONG_SLOT - 1, 1)

      for (let rowNum = slotStartRow; rowNum < slotStartRow + ROWS_PER_DAN_PHONG_SLOT; rowNum++) {
        for (let col = 1; col <= FIXED_COLS; col++) {
          ws.getRow(rowNum).getCell(col).border = allBorders
        }
      }
    }
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  return { buffer, fileName: "DanhSachBaoVeDanNgoaiPhong.xlsx", contentType: XLSX_CONTENT_TYPE }
}

function councilNames(project?: Project) {
  return [...(project?.council?.members ?? [])]
    .sort(
      (a, b) =>
        (councilRoleOrder[a.role as CouncilRole] || 99) -
        (councilRoleOrder[b.role as CouncilRole] || 99)
    )
    .map((m) => {
      const label =
        m.role === CouncilRole.CHAIRMAN
          ? "CT"
          : m.role === CouncilRole.SECRETARY
            ? "TK"
            : m.role === CouncilRole.REVIEWER_1
              ? "PB1"
              : m.role === CouncilRole.REVIEWER_2
                ? "PB2"
                : "UV"
      return `${label}: ${getSupervisorName(councilMemberProfile(m), true)}`
    })
    .filter(Boolean)
}

type OrgNode = {
  Id: string
  sTen: string | null
  sParentId: string | null
  iLoaiDonVi: number | null
  iCapDonVi: number | null
}

function guideDecisionHeader(type?: string | null) {
  if (type === TrainingObjectTypes.CIVILIAN) {
    return { coQuanCapTren: "BỘ GIÁO DỤC VÀ ĐÀO TẠO", heDaoTao: "hệ dân sự" }
  }
  if (type === TrainingObjectTypes.INTERNATIONAL_MILITARY) {
    return { coQuanCapTren: "BỘ QUỐC PHÒNG", heDaoTao: "hệ quốc tế" }
  }
  return { coQuanCapTren: "BỘ QUỐC PHÒNG", heDaoTao: "hệ quân sự" }
}

function formatQuyChe(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/^căn cứ\s+/i, "")
    .trim()
}

function formatManagingUnit(name: string, faculty: boolean) {
  const text = name.trim()
  if (!text) return ""
  if (/^(khoa|viện)\s+/i.test(text)) return text
  if (!faculty) return text
  return `Khoa ${text}`
}

function isFacultyOrg(org: OrgNode) {
  return org.iLoaiDonVi === 5 || org.iLoaiDonVi === 6
}

async function loadOrgChain(ids: string[]) {
  const map = new Map<string, OrgNode>()
  let pending = [...new Set(ids.filter(Boolean))]
  for (let depth = 0; depth < 5 && pending.length; depth++) {
    const rows = await prisma.dM_DonVi.findMany({
      where: { Id: { in: pending } },
      select: { Id: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true },
    })
    pending = []
    for (const row of rows) {
      if (map.has(row.Id)) continue
      map.set(row.Id, row)
      if (row.sParentId && !map.has(row.sParentId)) pending.push(row.sParentId)
    }
  }
  return map
}

function managingUnitName(startId: string | undefined, map: Map<string, OrgNode>) {
  if (!startId) return ""
  const start = map.get(startId)
  if (!start?.sTen?.trim()) return ""
  let current: OrgNode | undefined = start
  for (let i = 0; i < 5 && current; i++) {
    const name = current.sTen?.trim() || ""
    if (isFacultyOrg(current) || /^(khoa|viện)\s+/i.test(name))
      return formatManagingUnit(name, true)
    current = current.sParentId ? map.get(current.sParentId) : undefined
  }
  return formatManagingUnit(start.sTen || "", false)
}

function resolveKhoa(
  student: StudentRow,
  project: Project | undefined,
  orgMap: Map<string, OrgNode>
) {
  const curriculum = studentCurriculum(student)
  const ids = [
    curriculum?.trainingMajor?.organization?.Id,
    curriculum?.managementOrganization?.Id,
    project?.organization?.Id,
  ].filter(Boolean) as string[]
  for (const id of ids) {
    const name = managingUnitName(id, orgMap)
    if (name) return name
  }
  return "Khoa"
}

function guideSupervisorLine(expert: any, index: number) {
  if (!expert) return ""
  const profile = expert.expert?.lecturer?.userProfile || expert.lecturer?.userProfile
  const academicRank = profile?.academicRankType?.sMa || expert.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert.academicDegreeType?.sMa || ""
  const title = [academicRank, degree].filter(Boolean).join(".")
  const fullname = expert.name || profile?.fullname || ""
  const name = [title, fullname].filter(Boolean).join(" ").trim()
  const militaryRank = profile?.rank?.sTen || profile?.rank?.sMa || ""
  const position = String(expert.position || profile?.position?.sTen || "").trim()
  const lecturerId = expert.expert?.lecturerId || expert.lecturerId
  const parts = lecturerId ? [militaryRank, name, position] : [name, resolveExpertWorkplace(expert)]
  const text = parts.filter(Boolean).join(", ")
  return text ? `${index}. ${text}` : ""
}

function patchSaoQdHuongDanTemplate(xml: string) {
  return xml
    .replaceAll("BỘ QUỐC PHÒNG", "{coQuanCapTren}")
    .replaceAll("hệ quân sự", "{heDaoTao}")
    .replaceAll(
      "ăn cứ Quy chế số 923/QC-HV ngày 28/3/2022 của Học viện Kỹ thuật quân sự về tuyển sinh và đào tạo trình độ thạc sĩ tại Học viện;",
      "ăn cứ {quyChe}"
    )
    .replaceAll("{councilReport}", "{proposalReport}")
    .replaceAll("Khoa {khoaquanli}", "{khoaquanli}")
    .replaceAll("ngành {nganh} (", "ngành {nganh}{#hienChuyenNganh} (")
    .replaceAll("{chuyennganh}) về đề tài:", "{chuyennganh}){/hienChuyenNganh} về đề tài:")
}

async function buildSaoQdHuongDan(rows: StudentRow[], filters: ThesisExportFilter) {
  const sign = signer(filters)
  const now = formatDocDate(filters.signingDate)
  const studentRows = commonStudentRows(rows)
  const orgIds = studentRows.flatMap((r) => {
    const curriculum = studentCurriculum(r.student)
    return [
      curriculum?.trainingMajor?.organization?.Id,
      curriculum?.managementOrganization?.Id,
      r.project?.organization?.Id,
    ]
  })
  const orgMap = await loadOrgChain(orgIds)
  const items = studentRows.map((r) => {
    const project = r.project
    const session = project?.thesisSession
    const qd = formatDocDate(session?.decisionDate)
    const maker = splitDecisionMaker(session?.decisionMaker)
    const trainingType =
      studentCourse(r.student)?.trainingObjectType?.type ||
      session?.trainingCourses?.[0]?.trainingObjectType?.type
    const header = guideDecisionHeader(trainingType)
    const courseRegulation =
      studentCourse(r.student)?.regulation ||
      session?.trainingCourses?.find((course: { regulation?: string | null }) => course.regulation)
        ?.regulation
    return {
      soQD: session?.decisionNumber || "",
      councilReport: session?.councilReport || "",
      proposalReport: session?.proposalReport || "",
      quyChe: formatQuyChe(courseRegulation),
      coQuanCapTren: header.coQuanCapTren,
      heDaoTao: header.heDaoTao,
      ngayQD: qd.day,
      thangQD: qd.month,
      namQD: qd.year,
      type: project?.type || "",
      khoa: r.khoa,
      nganh: r.nganh,
      chuyennganh: r.chuyennganh,
      hienChuyenNganh: shouldShowSpecialization(r.nganh, r.chuyennganh),
      detai: r.tendetai,
      hoten: r.hoTen,
      ngaySinh: r.ngaySinh,
      khoaHoc: r.khoaHoc,
      canbohuongdan1: guideSupervisorLine(project?.supervisor, 1),
      canbohuongdan2: guideSupervisorLine(project?.coSupervisor, 2),
      khoaquanli: resolveKhoa(r.student, project, orgMap),
      text1: maker.text1,
      text2: maker.text2,
      nguoiky1: maker.name,
      text3: sign.text1,
      text4: sign.text2,
      nguoiki2: sign.name,
      ngay: now.day,
      thang: now.month,
      nam: now.year,
      data: [],
    }
  })
  return renderDocx(
    "BanSaoQDHuongDanLuanVan.docx",
    {
      items,
      councilReport: items[0]?.councilReport || "",
      proposalReport: items[0]?.proposalReport || "",
    },
    "BanSaoQDHuongDanLuanVan.docx",
    patchSaoQdHuongDanTemplate
  )
}

async function buildGiayMoiHdlv(rows: StudentRow[], filters: ThesisExportFilter) {
  const sign = signer(filters)
  const date = formatDocDate(filters.signingDate)
  const items = commonStudentRows(rows)
    .filter((r) => r.project?.supervisor)
    .map((r) => ({
      ngay: date.day,
      thang: date.month,
      nam: date.year,
      tenhocvien: r.hoTen,
      tenhuongdan: ` ${getSupervisorName(r.project?.supervisor, true)}`,
      khoa: `${r.khoaHoc}${studentCourse(r.student)?.academicYear ? `(${studentCourse(r.student).academicYear})` : ""}`,
      chuyennganh: r.chuyennganh,
      tendetai: r.tendetai ? `Tên đề tài: "${String(r.tendetai).trim()}"` : "",
      type: r.type,
      text1: sign.text1,
      text2: sign.text2,
      nguoiky1: sign.name,
    }))
  return renderDocx("GiayMoiHDLV.docx", { items }, "GiayMoiHDLV.docx")
}

const councilInviteRoleLabel: Partial<Record<CouncilRole, string>> = {
  [CouncilRole.CHAIRMAN]: "Chủ tịch",
  [CouncilRole.SECRETARY]: "Thư ký",
  [CouncilRole.REVIEWER_1]: "Phản biện 1",
  [CouncilRole.REVIEWER_2]: "Phản biện 2",
  [CouncilRole.MEMBER]: "Ủy viên",
}

/** Một giấy mời cho mỗi cán bộ, liệt kê mọi học viên mà cán bộ đó tham gia hội đồng. */
function reviewerInviteItems(
  rows: StudentRow[],
  filters: ThesisExportFilter,
  orgById: Map<string, OrgUnitNode>
) {
  const date = formatDocDate(filters.signingDate)
  const sign = signer(filters)
  const groups = new Map<
    string,
    {
      dotXet: string
      types: Set<string>
      students: Set<string>
      rows: Record<string, string>[]
      tenThanhVien: string
    }
  >()

  for (const r of commonStudentRows(rows)) {
    const members = [...(r.project?.council?.members ?? [])].sort(
      (a, b) =>
        (councilRoleOrder[a.role as CouncilRole] ?? 99) -
        (councilRoleOrder[b.role as CouncilRole] ?? 99)
    )
    for (const member of members) {
      const expert = councilMemberProfile(member)
      if (!expert) continue
      const key = String(member.expertId || expert.expertId || getSupervisorName(expert, false))
      if (!key) continue
      if (!groups.has(key)) {
        const unit = councilDecisionUnit(expert, orgById)
        const name = getSupervisorName(expert, false)
        groups.set(key, {
          dotXet: r.project?.thesisSession?.name || "",
          types: new Set(),
          students: new Set(),
          rows: [],
          tenThanhVien: [name, unit].filter(Boolean).join(", "),
        })
      }
      const group = groups.get(key)!
      const thesisType = r.type || "luận văn"
      group.types.add(thesisType)
      group.students.add(String(r.maHv || r.hoTen))
      group.rows.push({
        ngaybaove: r.ngaybaove,
        giobaove: r.giobaove,
        phongbaove: r.phongbaove,
        tenhocvien: r.hoTen,
        chuyennganh: studentMajor(r.student)?.shortName?.trim() || r.chuyennganh,
        tenchucdanh: councilInviteRoleLabel[member.role as CouncilRole] || "",
      })
    }
  }

  return Array.from(groups.values()).map((group) => ({
    dotXet: group.dotXet,
    ngay: date.day,
    thang: date.month,
    nam: date.year,
    type: group.types.size > 1 ? "luận văn/đề án" : [...group.types][0] || "luận văn",
    tongSoHocVien: group.students.size,
    text1: sign.text1,
    text2: sign.text2,
    nguoiki: sign.name,
    tenThanhVien: group.tenThanhVien,
    data: group.rows.map((row, index) => ({ ...row, stt: index + 1 })),
  }))
}

async function buildGiayMoiChamPb(_rows: StudentRow[], filters: ThesisExportFilter) {
  const sessionRows = await findThesisExportStudentRows({
    thesisSessionId: filters.thesisSessionId,
  })
  assertRows(sessionRows, "Không có học viên trong đợt để xuất giấy mời.")
  const orgById = await loadAcademyOrgById()
  const items = reviewerInviteItems(sessionRows, filters, orgById)
  return renderDocx(
    "GiayMoiChamLuanVan.docx",
    {
      items: items.map((item, idx) => ({
        ...item,
        "ngắt trang": idx === items.length - 1 ? "" : "ngắt trang",
      })),
    },
    "GiayMoiChamLuanVan.docx"
  )
}

async function buildHoSoBaoVe(rows: StudentRow[], filters: ThesisExportFilter) {
  const sign = signer(filters)
  const items = commonStudentRows(rows).map((r) => {
    const project = r.project
    const session = project?.thesisSession
    return {
      tenhocvien: r.hoTen,
      soQD: session?.defenseDecisionNumber || "",
      ngayQD: formatBirthDate(session?.defenseDecisionDate),
      dotxet: session?.name || "",
      ngaysinh: r.ngaySinh,
      type: r.type || "luận văn",
      khoa: r.khoaHoc,
      chuyennganh: r.chuyennganh,
      nganh: r.nganh,
      detai: r.tendetai,
      ngaybaove: r.ngaybaove,
      phanbien1: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_1), true),
      phanbien2: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_2), true),
      chutich: getSupervisorName(getMemberProfile(project, CouncilRole.CHAIRMAN), true),
      thuky: getSupervisorName(getMemberProfile(project, CouncilRole.SECRETARY), true),
      uyvien: getSupervisorName(getMemberProfile(project, CouncilRole.MEMBER), true),
      nguoiki: sign.name,
      text1: sign.text1,
      text2: sign.text2,
    }
  })
  return renderDocx("Hosobvlv.docx", { items }, "Hosobvlv.docx")
}

async function buildBanSaoHd(rows: StudentRow[], filters: ThesisExportFilter) {
  const sign = signer(filters)
  const now = formatDocDate(filters.signingDate)
  const items = commonStudentRows(rows).map((r) => {
    const project = r.project
    const session = project?.thesisSession
    const maker = splitDecisionMaker(session?.defenseDecisionMaker)
    const qd = formatDocDate(session?.defenseDecisionDate)
    return {
      text1: maker.text1,
      text2: maker.text2,
      nguoiki1: maker.name,
      text3: sign.text1,
      text4: sign.text2,
      nguoiki2: sign.name,
      soQd: session?.defenseDecisionNumber || "",
      ngayTl: qd.day,
      thangTl: qd.month,
      namTl: qd.year,
      khoa: session?.trainingCourse?.name || r.khoaHoc,
      dotXet: session?.name || "",
      loaiLuanVan: r.loaiLuanVan,
      councilReport: session?.councilReport || "",
      deTai: r.deTai,
      nganh: r.nganh,
      chuyenNganh: r.chuyennganh,
      tenHocVien: r.hoTen,
      ngaySinh: r.ngaySinh,
      khoaHoc: r.khoaHoc,
      nienkhoahoc: studentCourse(r.student)?.academicYear || "",
      gvhd: [getSupervisorName(project?.supervisor), getSupervisorName(project?.coSupervisor)]
        .filter(Boolean)
        .join(", "),
      tenChuTich: getSupervisorName(getMemberProfile(project, CouncilRole.CHAIRMAN)),
      toChucChuTich:
        resolveExpertWorkplace(getMemberProfile(project, CouncilRole.CHAIRMAN)) || "HVKTQS",
      tenThuKy: getSupervisorName(getMemberProfile(project, CouncilRole.SECRETARY)),
      toChucThuKy:
        resolveExpertWorkplace(getMemberProfile(project, CouncilRole.SECRETARY)) || "HVKTQS",
      tenUyVien: getSupervisorName(getMemberProfile(project, CouncilRole.MEMBER)),
      toChucUyVien:
        resolveExpertWorkplace(getMemberProfile(project, CouncilRole.MEMBER)) || "HVKTQS",
      tenPb1: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_1)),
      toChucPb1:
        resolveExpertWorkplace(getMemberProfile(project, CouncilRole.REVIEWER_1)) || "HVKTQS",
      tenPb2: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_2)),
      toChucPb2:
        resolveExpertWorkplace(getMemberProfile(project, CouncilRole.REVIEWER_2)) || "HVKTQS",
      ngay: now.day,
      thang: now.month,
      nam: now.year,
    }
  })
  return renderDocx(
    "BanSaoHoiDongDanhGiaLuanVan.docx",
    { items },
    "BanSaoHoiDongDanhGiaLuanVan.docx"
  )
}

function toRoman(num: number) {
  const romans: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]
  let result = ""
  let n = num
  for (const [value, symbol] of romans) {
    while (n >= value) {
      result += symbol
      n -= value
    }
  }
  return result
}

async function loadAcademyOrgById() {
  const organizations = await prisma.dM_DonVi.findMany({
    where: { bDeleted: { not: true } },
    select: { Id: true, sTen: true, sParentId: true, iCapDonVi: true },
  })
  return new Map<string, OrgUnitNode>(organizations.map((org) => [org.Id, org]))
}

/** Ngoài học viện: giữ nguyên nơi công tác đã lưu, không suy từ đơn vị giảng viên. */
function storedOutsideUnit(expert: any) {
  const workplace = typeof expert?.workplace === "string" ? expert.workplace.trim() : ""
  const organization = typeof expert?.organization === "string" ? expert.organization.trim() : ""
  return workplace || organization
}

/** Trong học viện: đơn vị cấp nhà trường. Ngoài học viện: nơi công tác giữ nguyên. */
function councilDecisionUnit(expert: any, orgById: Map<string, OrgUnitNode>) {
  if (!expert) return ""
  if (!resolveInAcademy(expert)) return storedOutsideUnit(expert)
  const lecturerOrg =
    expert?.expert?.lecturer?.userProfile?.donVi ?? expert?.lecturer?.userProfile?.donVi
  return resolveCouncilMemberUnitName({
    inAcademy: true,
    lecturerOrg: lecturerOrg?.Id ? lecturerOrg : undefined,
    organization: typeof expert?.organization === "string" ? expert.organization : undefined,
    orgById,
  })
}

function appendixSupervisorLine(expert: any, orgById: Map<string, OrgUnitNode>) {
  const name = getSupervisorName(expert, false)
  if (!name) return ""
  const unit = councilDecisionUnit(expert, orgById)
  return unit ? `${name}, ${unit}` : name
}

/** Câu trong từng hội đồng: Ngành ... (chuyên ngành ...) khi hai tên khác nhau. */
function formatCouncilMajorLine(nganh: string, chuyenNganh: string) {
  const field = nganh.trim()
  const specialization = chuyenNganh.trim()
  if (field && specialization && shouldShowSpecialization(field, specialization)) {
    return `Ngành ${field} (chuyên ngành ${specialization})`
  }
  const label = field || specialization
  return label ? `Ngành ${label}` : ""
}

/** Bỏ đoạn trống sau mỗi hội đồng và khoảng cách trên tiêu đề ngành. */
function patchPhuLucQdHdTemplate(xml: string) {
  if (!xml.includes("{#items}") || xml.includes("{#groups}")) return xml
  let next = xml.replace("{#items}", "{#groups}")
  next = next.replace(/<w:docGrid\b[^>]*\/>/g, "")
  next = next.replace(
    '<w:spacing w:before="200" w:after="100"/>',
    '<w:snapToGrid w:val="100"/><w:spacing w:before="100" w:after="100" w:line="240" w:lineRule="auto"/>'
  )
  next = next.replace(
    "{sttChuyenNganh} {tenChuyenNganh}</w:t></w:r></w:p>",
    '{sttChuyenNganh} {tenChuyenNganh}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t>{#items}</w:t></w:r></w:p>'
  )
  next = next.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>).)*<\/w:p>/g, (paragraph) => {
    if (paragraph.includes("<w:t") || !paragraph.includes('w:after="400"')) return paragraph
    return ""
  })
  next = next.replace(
    "{/items}</w:t></w:r></w:p>",
    '{/items}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t>{/groups}</w:t></w:r></w:p>'
  )
  next = next.replace("Cán bộ hướng dẫn: {gvhd1}; {gvhd2}.", "Cán bộ hướng dẫn: {gvhd}.")
  return next
}

/** Thẻ lặp để lại đoạn văn rỗng sau bảng thành viên. Chỉ xóa khi còn đoạn văn phía sau, để file không mất đoạn kết. */
function stripCouncilAppendixBlankLines(xml: string) {
  return xml
    .replace(/<\/w:tbl>(?:<w:p\/>|<w:p\b[^>]*\/>)+(?=<w:p\b)/g, "</w:tbl>")
    .replace(/<w:p\/>(?=<w:p\b)/g, "")
}

async function buildPhuLucQdHd(rows: StudentRow[]) {
  const orgById = await loadAcademyOrgById()
  const groups = new Map<string, { label: string; items: Record<string, string>[] }>()
  for (const row of commonStudentRows(rows)) {
    if (!row.project?.council) continue
    const field = row.nganh.trim() || row.chuyennganh.trim() || "Chưa xác định"
    const key = normalizeDisplayName(field)
    if (!groups.has(key)) groups.set(key, { label: field, items: [] })
    const group = groups.get(key)!
    const project = row.project
    const unitOf = (role: CouncilRole) =>
      councilDecisionUnit(getMemberProfile(project, role), orgById)
    group.items.push({
      sttHoiDong: String(group.items.length + 1),
      loaiLuanVan: row.loaiLuanVan || "luận văn",
      nganh: formatCouncilMajorLine(group.label, row.chuyennganh),
      tenDeTai: String(row.deTai || "")
        .trim()
        .replace(/\s+/g, " "),
      tenHocVien: row.hoTen,
      ngaySinh: row.ngaySinh,
      khoaHoc: row.khoaHoc,
      gvhd: [
        appendixSupervisorLine(project?.supervisor, orgById),
        appendixSupervisorLine(project?.coSupervisor, orgById),
      ]
        .filter(Boolean)
        .join("; "),
      tenChuTich: getSupervisorName(getMemberProfile(project, CouncilRole.CHAIRMAN)),
      toChucChuTich: unitOf(CouncilRole.CHAIRMAN),
      tenThuKy: getSupervisorName(getMemberProfile(project, CouncilRole.SECRETARY)),
      toChucThuKy: unitOf(CouncilRole.SECRETARY),
      tenUyVien: getSupervisorName(getMemberProfile(project, CouncilRole.MEMBER)),
      toChucUyVien: unitOf(CouncilRole.MEMBER),
      tenPb1: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_1)),
      toChucPb1: unitOf(CouncilRole.REVIEWER_1),
      tenPb2: getSupervisorName(getMemberProfile(project, CouncilRole.REVIEWER_2)),
      toChucPb2: unitOf(CouncilRole.REVIEWER_2),
    })
  }
  const groupList = Array.from(groups.values()).map((group, index) => ({
    sttChuyenNganh: `${toRoman(index + 1)}.`,
    tenChuyenNganh: `NGÀNH ${group.label.toLocaleUpperCase("vi")} (${String(group.items.length).padStart(2, "0")} HỘI ĐỒNG)`,
    items: group.items,
  }))
  const first = firstRow(rows)
  const session = getProject(first)?.thesisSession
  const total = groupList.reduce((sum, group) => sum + group.items.length, 0)
  return renderDocx(
    "PhuLucQDHoiDong.docx",
    {
      khoa: studentCourse(first)?.name || "",
      dotXet: session?.name || "",
      soQd: session?.defenseDecisionNumber || "",
      ngayQd: formatBirthDate(session?.defenseDecisionDate),
      soHoiDong: total.toString(),
      groups: groupList,
    },
    "PhuLucQdhd.docx",
    patchPhuLucQdHdTemplate,
    stripCouncilAppendixBlankLines
  )
}

async function buildDsChuyenGia(rows: StudentRow[], filters: ThesisExportFilter) {
  const amount = filters.moneyAmount || 0
  const now = formatDocDate(filters.signingDate)
  const experts = new Map<string, any>()
  for (const r of commonStudentRows(rows)) {
    for (const member of r.project?.council?.members ?? []) {
      const expert = councilMemberProfile(member)
      const key = expert?.id || member.expertId || getSupervisorName(expert)
      if (key && !experts.has(key)) experts.set(key, expert)
    }
  }
  const data = Array.from(experts.values()).map((expert, index) => ({
    stt: String(index + 1),
    tenChuyenGia: getSupervisorName(expert),
    chucVu: expert?.position || "",
    donViQuanLi: resolveExpertWorkplace(expert),
    soTien: formatAmountWithComma(amount),
    stk:
      expert?.bankAccountNumber || expert?.expert?.lecturer?.userProfile?.bankAccountNumber || "",
    ngangHang: expert?.bankName || expert?.expert?.lecturer?.userProfile?.bankName || "",
    kiNhan: "",
  }))
  return renderXlsxTemplate(
    "DanhSachChuyenGia.xlsx",
    {
      ngay: now.day,
      thang: now.month,
      nam: now.year,
      diaDiem: "",
      thoiGian: "",
      tongTienSo: formatAmountWithComma(amount * data.length),
      soChuyenGia: data.length,
      tongTienChu: Number(amount * data.length).toVndWord("đồng"),
      nguoiki: "",
      data,
    },
    "DsChuyenGia.xlsx"
  )
}

async function buildThongKeGvhd(rows: StudentRow[]) {
  const stats = new Map<string, any>()
  const paymentAmount = (
    project: Project | undefined,
    recorded: unknown,
    role: SupervisorRole,
    expert: any
  ) => {
    const amount = readDecimalAmount(recorded)
    if (amount > 0) return amount
    const defaults = project?.thesisSession?.configPayment?.supervisorPayAmounts ?? []
    return getSupervisorDefaultPayAmount(defaults, role, resolveInAcademy(expert))
  }
  const updateStats = (
    project: Project | undefined,
    expert: any,
    amount: number,
    role: "GVHD1" | "GVHD2" | "SINGLE"
  ) => {
    if (!expert) return
    const key = expert.id || getSupervisorName(expert)
    if (!key) return
    if (!stats.has(key)) {
      stats.set(key, {
        gvhd: getSupervisorName(expert),
        donvi: resolveExpertWorkplace(expert),
        tongsohv: 0,
        doclap: 0,
        gvhd1: 0,
        gvhd2: 0,
        thanhtoan: 0,
        stk: expert.bankAccountNumber || expert.lecturer?.userProfile?.bankAccountNumber || "",
        bank: expert.bankName || expert.lecturer?.userProfile?.bankName || "",
      })
    }
    const row = stats.get(key)
    row.tongsohv += 1
    row.thanhtoan += amount
    if (role === "GVHD1") row.gvhd1 += 1
    else if (role === "GVHD2") row.gvhd2 += 1
    else row.doclap += 1
  }

  for (const r of commonStudentRows(rows)) {
    const project = r.project
    const hasSupervisor = !!project?.supervisor
    const hasCoSupervisor = !!project?.coSupervisor

    if (hasSupervisor && hasCoSupervisor) {
      updateStats(
        project,
        project?.supervisor,
        paymentAmount(
          project,
          project?.supervisorPayment?.amount,
          SupervisorRole.SUPERVISOR,
          project?.supervisor
        ),
        "GVHD1"
      )
      updateStats(
        project,
        project?.coSupervisor,
        paymentAmount(
          project,
          project?.coSupervisorPayment?.amount,
          SupervisorRole.CO_SUPERVISOR,
          project?.coSupervisor
        ),
        "GVHD2"
      )
    } else if (hasSupervisor || hasCoSupervisor) {
      const expert = project?.supervisor || project?.coSupervisor
      const recorded =
        project?.singleSupervisorPayment?.amount ||
        project?.supervisorPayment?.amount ||
        project?.coSupervisorPayment?.amount
      updateStats(
        project,
        expert,
        paymentAmount(project, recorded, SupervisorRole.SINGLE, expert),
        "SINGLE"
      )
    }
  }
  const data = Array.from(stats.values()).map((item, index) => ({
    stt: index + 1,
    ...item,
    thanhtoan: formatAmountWithComma(item.thanhtoan),
  }))
  const now = formatDocDate(new Date())
  return renderXlsxItems(
    "ThongKeCanBoHuongDan.xlsx",
    [
      {
        tendot: (getProject(firstRow(rows))?.thesisSession?.name || "").toUpperCase(),
        tenkhoa: "TẤT CẢ KHOA VIỆN",
        ngay: now.day,
        thang: now.month,
        nam: now.year,
        tongsohocvien: rows.length,
        tongsodoclap: data.reduce((sum, item) => sum + item.doclap, 0),
        tongsohd1: data.reduce((sum, item) => sum + item.gvhd1, 0),
        tongsohd2: data.reduce((sum, item) => sum + item.gvhd2, 0),
        tongsotien: formatAmountWithComma(
          Array.from(stats.values()).reduce((sum, item) => sum + item.thanhtoan, 0)
        ),
        data,
      },
    ],
    "ThongKeCanBoHuongDan.xlsx"
  )
}

async function buildThongKeHd(rows: StudentRow[]) {
  const stats = new Map<string, any>()
  for (const r of commonStudentRows(rows)) {
    for (const member of r.project?.council?.members ?? []) {
      const expert = councilMemberProfile(member)
      const key = expert?.id || member.expertId || getSupervisorName(expert)
      if (!key) continue
      if (!stats.has(key)) {
        stats.set(key, {
          tenThanhVien: getSupervisorName(expert),
          donViQuanLi: resolveExpertWorkplace(expert),
          tongSo: 0,
          chuTich: 0,
          thuKi: 0,
          uyVien: 0,
          phanBien1: 0,
          phanBien2: 0,
          thanhToan: 0,
          stk: expert?.bankAccountNumber || "",
          tennganhang: expert?.bankName || "",
        })
      }
      const row = stats.get(key)
      row.tongSo += 1
      if (member.role === CouncilRole.CHAIRMAN) row.chuTich += 1
      else if (member.role === CouncilRole.SECRETARY) row.thuKi += 1
      else if (member.role === CouncilRole.REVIEWER_1) row.phanBien1 += 1
      else if (member.role === CouncilRole.REVIEWER_2) row.phanBien2 += 1
      else row.uyVien += 1
    }
  }
  const data = Array.from(stats.values()).map((item, index) => ({ stt: index + 1, ...item }))
  return renderXlsxItems(
    "ThongKeCanBoHoiDong.xlsx",
    [
      {
        trainingCourse: studentCourse(firstRow(rows))?.name || "",
        trainingCourseTitle: studentCourse(firstRow(rows))?.name || "",
        chuyenNganh: "",
        dotXet: getProject(firstRow(rows))?.thesisSession?.name || "",
        tong: data.reduce((sum, item) => sum + item.tongSo, 0),
        tongChuTich: data.reduce((sum, item) => sum + item.chuTich, 0),
        tongThuky: data.reduce((sum, item) => sum + item.thuKi, 0),
        tongUyVien: data.reduce((sum, item) => sum + item.uyVien, 0),
        tongPhanBien1: data.reduce((sum, item) => sum + item.phanBien1, 0),
        tongPhanBien2: data.reduce((sum, item) => sum + item.phanBien2, 0),
        tongThanhToan: data.reduce((sum, item) => sum + item.thanhToan, 0),
        data,
      },
    ],
    "ThongKeCbThamGiaHd.xlsx"
  )
}

async function buildThongKeDonViNgoai(rows: StudentRow[]) {
  const stats = new Map<string, { donVi: string; soLuong: number }>()
  for (const r of commonStudentRows(rows)) {
    for (const member of r.project?.council?.members ?? []) {
      const expert = councilMemberProfile(member)
      if (resolveInAcademy(expert)) continue
      const org = resolveExpertWorkplace(expert) || "Chưa có đơn vị"
      stats.set(org, { donVi: org, soLuong: (stats.get(org)?.soLuong || 0) + 1 })
    }
  }
  return renderXlsxTemplate(
    "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx",
    {
      dotXet: getProject(firstRow(rows))?.thesisSession?.name || "",
      data: Array.from(stats.values()).map((item, index) => ({ stt: index + 1, ...item })),
    },
    "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx"
  )
}

async function buildKetQuaBaoVe(rows: StudentRow[]) {
  const byMajor = new Map<string, { xs: number; gioi: number; kha: number; tb: number }>()
  for (const r of commonStudentRows(rows)) {
    if (!r.score) continue
    const key = r.chuyennganh || "Chưa xác định"
    if (!byMajor.has(key)) byMajor.set(key, { xs: 0, gioi: 0, kha: 0, tb: 0 })
    const stats = byMajor.get(key)!
    if (r.score >= 9) stats.xs += 1
    else if (r.score >= 8) stats.gioi += 1
    else if (r.score >= 7) stats.kha += 1
    else stats.tb += 1
  }
  const data = Array.from(byMajor.entries()).map(([chuyenNganh, s], index) => {
    const total = s.xs + s.gioi + s.kha + s.tb
    const pct = (n: number) => (total ? Number(((n / total) * 100).toFixed(2)) : 0)
    return {
      stt: index + 1,
      chuyenNganh,
      tongSo: total,
      soLuongXuatSac: s.xs,
      tyLeXuatSac: pct(s.xs),
      soLuongGioi: s.gioi,
      tyLeGioi: pct(s.gioi),
      soLuongKha: s.kha,
      tyLeKha: pct(s.kha),
      soLuongTB: s.tb,
      tyLeTB: pct(s.tb),
    }
  })
  const total = data.reduce((sum, item) => sum + item.tongSo, 0)
  const totalPart = (field: keyof (typeof data)[number]) =>
    data.reduce((sum, item) => sum + Number(item[field] || 0), 0)
  const rate = (n: number) => (total ? Number(((n / total) * 100).toFixed(2)) : 0)
  const xs = totalPart("soLuongXuatSac")
  const gioi = totalPart("soLuongGioi")
  const kha = totalPart("soLuongKha")
  const tb = totalPart("soLuongTB")
  return renderXlsxTemplate(
    "KetQuaBaoVeLuanVan.xlsx",
    {
      total,
      totalXuatSac: xs,
      totalTyLeXuatSac: rate(xs),
      totalGioi: gioi,
      totalTyLeGioi: rate(gioi),
      totalKha: kha,
      totalTyLeKha: rate(kha),
      totalTB: tb,
      totalTyLeTB: rate(tb),
      data,
    },
    "KetQuaBaoVeLuanVan.xlsx"
  )
}

async function buildNopThuVien(rows: StudentRow[]) {
  const data = commonStudentRows(rows).map((r) => ({
    stt: r.stt,
    thongTinBaoVe: `${r.hoTen}\nNgày sinh: ${r.ngaySinh}\n${r.khoaHoc}`,
    thongTinHuongDan: r.gvhd,
    thongTinDeTai: r.deTai,
    thongTinLuuTru: "",
  }))
  return renderXlsxTemplate(
    "DanhSachNopLuanVanThuVien.xlsx",
    {
      khoa: studentCourse(firstRow(rows))?.name || "",
      dotxet: getProject(firstRow(rows))?.thesisSession?.name || "",
      data,
      tongSo: String(data.length),
      nguoiki: getProject(firstRow(rows))?.thesisSession?.chief || "",
    },
    "DanhSachNopLuanVanThuVien.xlsx"
  )
}

async function buildDeXuatHd(rows: StudentRow[]) {
  const data = commonStudentRows(rows).map((r) => ({
    stt: r.stt,
    maHv: r.maHv,
    ngaySinh: r.ngaySinh,
    hocVienCanBoHuongDan: `${r.hoTen}\n${r.gvhd}`,
    deTai: r.deTai,
    gioBaoVe: r.gioBaoVe,
    ngayBaoVe: r.ngayBaoVe,
    diaDiem: r.diaDiem,
    tenChuTich: getSupervisorName(getMemberProfile(r.project, CouncilRole.CHAIRMAN)),
    tenThuKy: getSupervisorName(getMemberProfile(r.project, CouncilRole.SECRETARY)),
    tenUyVien: getSupervisorName(getMemberProfile(r.project, CouncilRole.MEMBER)),
    tenPb1: getSupervisorName(getMemberProfile(r.project, CouncilRole.REVIEWER_1)),
    tenPb2: getSupervisorName(getMemberProfile(r.project, CouncilRole.REVIEWER_2)),
  }))
  const now = formatDocDate(new Date())
  return renderXlsxTemplate(
    "DeNghiHDDanhGiaLuanVan.xlsx",
    {
      khoa: studentCourse(firstRow(rows))?.name || "",
      tenDonViQuanLi: getProject(firstRow(rows))?.organization?.sTen || "",
      tongSoHocVien: data.length,
      ngay: now.day,
      thang: now.month,
      nam: now.year,
      data,
    },
    "DeNghiHDDanhGiaLuanVan.xlsx"
  )
}

async function buildKiemTraTienDo(rows: StudentRow[]) {
  const organizationMap = new Map<
    string,
    { sTen: string; thesisProject: ReturnType<typeof commonStudentRows> }
  >()
  const firstProject = getProject(firstRow(rows))

  for (const item of commonStudentRows(rows)) {
    const project = item.project
    const organizationId = project?.organization?.Id || project?.organizationId || "unknown"
    if (!organizationMap.has(organizationId)) {
      organizationMap.set(organizationId, {
        sTen: project?.organization?.sTen || "Chưa có đơn vị",
        thesisProject: [],
      })
    }
    organizationMap.get(organizationId)?.thesisProject.push(item)
  }

  let count = 1
  const dataRows: TableRow[] = Array.from(organizationMap.values()).flatMap((item, index) => {
    const tongHocVien = new Set(
      item.thesisProject.map((thesis) => thesis.student.id).filter(Boolean)
    ).size
    const orgRow: TableRow = {
      cells: [
        { value: "" },
        {
          value: `${index + 1}.  ${item.sTen}: ${tongHocVien} học viên`,
          border: true,
          align: "left",
          colSpan: 4,
          bold: true,
        },
      ],
    }
    const thesisRows: TableRow[] = item.thesisProject.map((thesis, rowIndex) => {
      count++
      return {
        cells: [
          { value: rowIndex + 1, border: true, align: "center", fontSize: 12 },
          {
            value:
              `${thesis.hoTen}\nNS:${thesis.ngaySinh} \nĐT:${thesis.dt} - ${thesis.khoaHoc} \n${thesis.gvhd ? `CBHD:\n${thesis.gvhd}` : "CBHD"}`.trim(),
            border: true,
            align: "left",
            fontSize: 12,
          },
          { value: thesis.tendetai, border: true, align: "left" },
          {
            value: thesis.project?.firstCheckProgress || "",
            border: true,
            align: "left",
            fontSize: 12,
          },
          {
            value: thesis.project?.secondCheckProgress || "",
            border: true,
            align: "center",
            fontSize: 12,
          },
        ],
      }
    })
    return [orgRow, ...thesisRows]
  })

  const gapRow: TableRow = { cells: [{ value: null, border: false }] }
  const totalRow: TableRow = {
    cells: [
      {
        value: `Tổng số: ${count - 1} học viên./.`,
        align: "center",
        fontSize: 12,
        colSpan: 5,
        italic: true,
        border: false,
      },
    ],
  }
  const signRow: TableRow = {
    cells: [
      { value: "", border: false, align: "center" },
      { value: "", border: false, align: "center" },
      { value: "", border: false, align: "center" },
      {
        value: "CHỦ NHIỆM KHOA/VIỆN TRƯỞNG",
        colSpan: 2,
        border: false,
        bold: true,
        align: "center",
      },
    ],
  }
  const signRow2: TableRow = {
    cells: [
      { value: "", border: false, align: "center" },
      { value: "", border: false, align: "center" },
      { value: "", border: false, align: "center" },
      {
        value: "(Ký và ghi rõ họ tên)",
        colSpan: 2,
        border: false,
        italic: true,
        align: "center",
      },
    ],
  }

  return renderMinioTemplate(
    "mta/template/KiemTraTienDoLuanVan.xlsx",
    {
      sheets: [
        {
          sheet: "Detai",
          rows: [...dataRows, gapRow, totalRow, gapRow, signRow, signRow2],
          tableStartCell: { row: 8, col: 1 },
          data: { dotxet: (firstProject?.thesisSession?.name || "").toUpperCase() },
        },
      ],
    },
    "KiemTraTienDoLuanVan.xlsx"
  )
}

async function buildPayment(kind: "council" | "supervisor", filters: ThesisExportFilter) {
  const studentIds = await findThesisExportStudentIds(filters)
  if (!studentIds.length) throw new Error("Không có dữ liệu để xuất thanh toán.")
  if (kind === "council") {
    await syncCouncilPaymentsForThesisSession({
      thesisSessionId: filters.thesisSessionId,
      studentIds,
      recreateAll: !!filters.recreateAllPayments,
    })
    const payload = await buildCouncilPaymentExportPayload({
      thesisSessionId: filters.thesisSessionId,
      studentIds,
    })
    if (!payload) throw new Error("Chưa có dữ liệu để tạo thanh toán hội đồng bảo vệ")
    return {
      buffer: await renderThesisPaymentXlsx(payload),
      fileName: payload.downloadName,
      contentType: XLSX_CONTENT_TYPE,
    }
  }

  await syncSupervisorPaymentsForThesisSession({
    thesisSessionId: filters.thesisSessionId,
    studentIds,
    recreateAll: !!filters.recreateAllPayments,
  })
  const payload = await buildSupervisorPaymentExportPayload({
    thesisSessionId: filters.thesisSessionId,
    studentIds,
  })
  if (payload.empty) throw new Error("Chưa có dữ liệu để xuất thanh toán hướng dẫn")
  return {
    buffer: await renderThesisPaymentXlsx(payload),
    fileName: payload.downloadName,
    contentType: XLSX_CONTENT_TYPE,
  }
}

const builders = {
  "phu-luc-ds-luan-van": buildPhuLucDsLuanVan,
  "danh-sach-bao-ve": buildDanhSachBaoVe,
  "ds-bao-ve-dan-phong": buildDanhSachBaoVeDanPhong,
  "sao-qd-huong-dan": buildSaoQdHuongDan,
  "giay-moi-hdlv": buildGiayMoiHdlv,
  "giay-moi-cham-pb": buildGiayMoiChamPb,
  "ho-so-bao-ve": buildHoSoBaoVe,
  "ban-sao-hddglv": buildBanSaoHd,
  "phu-luc-qd-hd": buildPhuLucQdHd,
  "danh-sach-chuyen-gia": buildDsChuyenGia,
  "thong-ke-gvhd": buildThongKeGvhd,
  "thong-ke-hd": buildThongKeHd,
  "thong-ke-don-vi-ngoai": buildThongKeDonViNgoai,
  "ket-qua-bao-ve": buildKetQuaBaoVe,
  "nop-thu-vien": buildNopThuVien,
  "de-xuat-hd": buildDeXuatHd,
  "kiem-tra-tien-do": buildKiemTraTienDo,
} as const

export const thesisExportTemplateKinds = [
  ...Object.keys(builders),
  "thanh-toan-hoi-dong",
  "thanh-toan-huong-dan",
] as const

export type ThesisExportTemplateKind = (typeof thesisExportTemplateKinds)[number]

export async function buildThesisExport(
  kind: ThesisExportTemplateKind,
  filters: ThesisExportFilter
): Promise<ThesisExportResult> {
  if (kind === "thanh-toan-hoi-dong") return buildPayment("council", filters)
  if (kind === "thanh-toan-huong-dan") return buildPayment("supervisor", filters)

  const rows = await findThesisExportStudentRows(filters)
  assertRows(rows)
  const builder = builders[kind as keyof typeof builders]
  if (!builder) throw new Error("Mẫu xuất không được hỗ trợ.")
  return builder(rows, filters) as Promise<ThesisExportResult>
}
