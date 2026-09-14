import { CouncilRole, ThesisType } from "@workspace/db/client"
import ExcelJS from "exceljs"
import { prisma } from ".."

export type ExportCouncilImportTemplateParams = {
  thesisSessionId: string
}

export type ExportCouncilImportTemplateResult = {
  buffer: Buffer
  fileName: string
}

type ExpertLike = {
  id?: string
  expertId?: string | null
  name?: string | null
  workplace?: string | null
  academicRankType?: { sMa?: string | null } | null
  academicDegreeType?: { sMa?: string | null } | null
  expert?: {
    lecturer?: {
      lectureID?: string | null
      userProfile?: {
        fullname?: string | null
        academicRankType?: { sMa?: string | null } | null
        academicDegreeType?: { sMa?: string | null } | null
      } | null
    } | null
  } | null
  lecturer?: {
    lectureID?: string | null
    userProfile?: {
      fullname?: string | null
      academicRankType?: { sMa?: string | null } | null
      academicDegreeType?: { sMa?: string | null } | null
    } | null
  } | null
} | null

type LabeledOption = { id: string; label: string }

const EDITABLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" },
}

function formatExpertName(expert: ExpertLike) {
  if (!expert) return ""
  const profile = expert.expert?.lecturer?.userProfile ?? expert.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert.name || profile?.fullname || ""
  const text = [title, fullname].filter(Boolean).join(" ").trim()
  const workplace = expert.workplace?.trim()
  return workplace ? `${text}, ${workplace}` : text
}

function formatDefenseSessionClock(startTime: Date | string | null | undefined) {
  if (startTime === null || startTime === undefined) return ""
  const date = typeof startTime === "string" ? new Date(startTime) : startTime
  if (Number.isNaN(date.getTime())) return ""
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function makeUniqueLabels<T extends { id: string }>(
  items: T[],
  getLabel: (item: T) => string
): LabeledOption[] {
  const counts = new Map<string, number>()
  const bases = items.map((item) => {
    const base = getLabel(item).trim() || item.id
    counts.set(base, (counts.get(base) || 0) + 1)
    return { item, base }
  })
  const seen = new Map<string, number>()
  return bases.map(({ item, base }) => {
    if ((counts.get(base) || 0) <= 1) {
      return { id: item.id, label: base }
    }
    const index = (seen.get(base) || 0) + 1
    seen.set(base, index)
    return { id: item.id, label: `${base} (${index})` }
  })
}

function getCouncilExpertId(
  members: Array<{ role: CouncilRole; expertId?: string | null }> | undefined,
  role: CouncilRole
) {
  return members?.find((member) => member.role === role)?.expertId || ""
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { name: "Times New Roman", size: 11, bold: true }
  row.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E2F3" },
    }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
  })
}

function applyDataStyle(row: ExcelJS.Row) {
  row.font = { name: "Times New Roman", size: 11 }
  row.alignment = { vertical: "middle", wrapText: true }
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
  })
}

function applyEditableFill(row: ExcelJS.Row, columns: number[]) {
  for (const col of columns) {
    row.getCell(col).fill = EDITABLE_FILL
  }
}

function addListValidation(
  sheet: ExcelJS.Worksheet,
  col: number,
  startRow: number,
  endRow: number,
  listSheetName: string,
  listColLetter: string,
  listCount: number
) {
  if (listCount <= 0 || endRow < startRow) return
  const formulae = [`'${listSheetName}'!$${listColLetter}$2:$${listColLetter}$${listCount + 1}`]
  for (let row = startRow; row <= endRow; row++) {
    sheet.getCell(row, col).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae,
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Giá trị không hợp lệ",
      error: "Vui lòng chọn từ danh sách dropdown.",
      showInputMessage: true,
      promptTitle: "Chọn từ danh sách",
      prompt: "Bấm mũi tên để chọn.",
    }
  }
}

function writeListColumn(
  sheet: ExcelJS.Worksheet,
  col: number,
  header: string,
  options: LabeledOption[]
) {
  sheet.getCell(1, col).value = header
  sheet.getCell(1, col).font = { name: "Times New Roman", size: 11, bold: true }
  options.forEach((option, index) => {
    sheet.getCell(index + 2, col).value = option.label
    sheet.getCell(index + 2, col).font = { name: "Times New Roman", size: 11 }
  })
}

function writeMapRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  type: string,
  options: LabeledOption[]
) {
  options.forEach((option, index) => {
    const row = startRow + index
    sheet.getCell(row, 1).value = type
    sheet.getCell(row, 2).value = option.label
    sheet.getCell(row, 3).value = option.id
  })
  return startRow + options.length
}

const versionSelect = {
  id: true,
  expertId: true,
  name: true,
  workplace: true,
  academicRankType: { select: { sMa: true } },
  academicDegreeType: { select: { sMa: true } },
  expert: {
    select: {
      id: true,
      lecturer: {
        select: {
          lectureID: true,
          userProfile: {
            select: {
              fullname: true,
              academicRankType: { select: { sMa: true } },
              academicDegreeType: { select: { sMa: true } },
            },
          },
        },
      },
    },
  },
} as const

const expertCatalogSelect = {
  id: true,
  currentVersionId: true,
  currentVersion: {
    select: {
      name: true,
      workplace: true,
      eligiblePresident: true,
      eligibleSecretary: true,
      academicRankType: { select: { sMa: true } },
      academicDegreeType: { select: { sMa: true } },
    },
  },
  lecturer: {
    select: {
      lectureID: true,
      userProfile: {
        select: {
          fullname: true,
          academicRankType: { select: { sMa: true } },
          academicDegreeType: { select: { sMa: true } },
        },
      },
    },
  },
} as const

export async function exportCouncilImportTemplate(
  params: ExportCouncilImportTemplateParams
): Promise<ExportCouncilImportTemplateResult> {
  const { thesisSessionId } = params
  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }

  const session = await prisma.thesisSession.findFirst({
    where: { id: thesisSessionId, deletedAt: null },
    select: { id: true, name: true },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt luận văn.")
  }

  const [projects, experts, rooms, defenseSessions] = await Promise.all([
    prisma.thesisProject.findMany({
      where: {
        thesisSessionId,
        deletedAt: null,
        thesisType: ThesisType.THESIS,
        registrations: { some: { deletedAt: null } },
      },
      select: {
        id: true,
        title: true,
        defenseDate: true,
        roomId: true,
        defenseSessionId: true,
        supervisor: { select: versionSelect },
        coSupervisor: { select: versionSelect },
        room: { select: { id: true, name: true } },
        defenseSession: { select: { id: true, startTime: true } },
        council: {
          select: {
            members: {
              where: { deletedAt: null },
              select: {
                role: true,
                expertId: true,
                expertProfileVersion: { select: versionSelect },
              },
            },
          },
        },
        registrations: {
          where: { deletedAt: null },
          select: {
            student: {
              select: {
                code: true,
                userProfile: {
                  select: { fullname: true, dateOfBirth: true },
                },
                fixedClass: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expert.findMany({
      where: { deletedAt: null, currentVersion: { thesisExpert: true } },
      select: expertCatalogSelect,
      orderBy: [{ currentVersion: { name: "asc" } }],
    }),
    prisma.room.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.defenseSession.findMany({
      where: { deletedAt: null },
      select: { id: true, startTime: true },
      orderBy: { startTime: "asc" },
    }),
  ])

  if (!projects.length) {
    throw new Error("Đợt xét chưa có luận văn/đề án để xuất.")
  }

  const formatCatalogExpert = (expert: (typeof experts)[number]) =>
    formatExpertName({
      name: expert.currentVersion?.name,
      workplace: expert.currentVersion?.workplace,
      academicRankType: expert.currentVersion?.academicRankType,
      academicDegreeType: expert.currentVersion?.academicDegreeType,
      lecturer: expert.lecturer,
    })

  const allExpertOptions = makeUniqueLabels(experts, formatCatalogExpert)
  const presidentOptions = makeUniqueLabels(
    experts.filter((expert) => expert.currentVersion?.eligiblePresident),
    formatCatalogExpert
  )
  const secretaryOptions = makeUniqueLabels(
    experts.filter((expert) => expert.currentVersion?.eligibleSecretary),
    formatCatalogExpert
  )
  const roomOptions = makeUniqueLabels(rooms, (room) => room.name || room.id)
  const sessionOptions = makeUniqueLabels(defenseSessions, (item) =>
    formatDefenseSessionClock(item.startTime)
  )

  const allExpertLabelById = new Map(allExpertOptions.map((item) => [item.id, item.label]))
  const presidentLabelById = new Map(presidentOptions.map((item) => [item.id, item.label]))
  const secretaryLabelById = new Map(secretaryOptions.map((item) => [item.id, item.label]))
  const roomLabelById = new Map(roomOptions.map((item) => [item.id, item.label]))
  const sessionLabelById = new Map(sessionOptions.map((item) => [item.id, item.label]))

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "MTA"
  workbook.created = new Date()

  const dataSheet = workbook.addWorksheet("NhapHoiDong", {
    views: [{ state: "frozen", ySplit: 2 }],
  })
  const listSheet = workbook.addWorksheet("DanhMuc")
  const mapSheet = workbook.addWorksheet("_Map")
  mapSheet.state = "hidden"

  writeListColumn(listSheet, 1, "Chuyên gia", allExpertOptions)
  writeListColumn(listSheet, 2, "Chủ tịch", presidentOptions)
  writeListColumn(listSheet, 3, "Thư ký", secretaryOptions)
  writeListColumn(listSheet, 4, "Phòng bảo vệ", roomOptions)
  writeListColumn(listSheet, 5, "Ca bảo vệ", sessionOptions)
  listSheet.columns = [{ width: 40 }, { width: 40 }, { width: 40 }, { width: 24 }, { width: 14 }]

  mapSheet.getCell("A1").value = "Loại"
  mapSheet.getCell("B1").value = "Nhãn"
  mapSheet.getCell("C1").value = "ID"
  let mapRow = 2
  mapRow = writeMapRows(mapSheet, mapRow, "EXPERT", allExpertOptions)
  mapRow = writeMapRows(mapSheet, mapRow, "PRESIDENT", presidentOptions)
  mapRow = writeMapRows(mapSheet, mapRow, "SECRETARY", secretaryOptions)
  mapRow = writeMapRows(mapSheet, mapRow, "ROOM", roomOptions)
  writeMapRows(mapSheet, mapRow, "DEFENSE_SESSION", sessionOptions)

  dataSheet.mergeCells("A1:Q1")
  dataSheet.getCell("A1").value =
    `Mẫu nhập hội đồng bảo vệ — Đợt: ${session.name}. Ô vàng: chọn từ dropdown hoặc nhập (đề tài, ngày bảo vệ DD/MM/YYYY). Cột "ID đề tài" không được sửa.`
  dataSheet.getCell("A1").font = {
    name: "Times New Roman",
    size: 11,
    italic: true,
    color: { argb: "FF595959" },
  }
  dataSheet.getCell("A1").alignment = { vertical: "middle", wrapText: true }
  dataSheet.getRow(1).height = 36

  const headers = [
    "STT",
    "ID đề tài",
    "Mã HV",
    "Họ tên HV",
    "Ngày sinh",
    "Lớp quản lí",
    "Đề tài",
    "GVHD 1",
    "GVHD 2",
    "Chủ tịch",
    "Thư ký",
    "Phản biện 1",
    "Phản biện 2",
    "Ủy viên",
    "Phòng bảo vệ",
    "Ca bảo vệ",
    "Ngày bảo vệ",
  ]
  const headerRow = dataSheet.getRow(2)
  headerRow.values = headers
  applyHeaderStyle(headerRow)
  headerRow.height = 30

  dataSheet.columns = [
    { width: 6 },
    { width: 28 },
    { width: 12 },
    { width: 22 },
    { width: 12 },
    { width: 22 },
    { width: 40 },
    { width: 32 },
    { width: 32 },
    { width: 32 },
    { width: 32 },
    { width: 32 },
    { width: 32 },
    { width: 32 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
  ]

  const editableCols = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  let rowIndex = 3
  let stt = 1

  for (const project of projects) {
    for (const registration of project.registrations) {
      const student = registration.student
      const members = project.council?.members
      const chairmanId = getCouncilExpertId(members, CouncilRole.CHAIRMAN)
      const secretaryId = getCouncilExpertId(members, CouncilRole.SECRETARY)
      const reviewer1Id = getCouncilExpertId(members, CouncilRole.REVIEWER_1)
      const reviewer2Id = getCouncilExpertId(members, CouncilRole.REVIEWER_2)
      const memberId = getCouncilExpertId(members, CouncilRole.MEMBER)

      const row = dataSheet.getRow(rowIndex)
      row.values = [
        stt,
        project.id,
        student?.code || "",
        student?.userProfile?.fullname || "",
        formatDate(student?.userProfile?.dateOfBirth),
        student?.fixedClass?.name || "",
        project.title || "",
        allExpertLabelById.get(project.supervisor?.expertId || "") ||
          formatExpertName(project.supervisor),
        allExpertLabelById.get(project.coSupervisor?.expertId || "") ||
          formatExpertName(project.coSupervisor),
        presidentLabelById.get(chairmanId) ||
          allExpertLabelById.get(chairmanId) ||
          formatExpertName(
            members?.find((m) => m.role === CouncilRole.CHAIRMAN)?.expertProfileVersion ?? null
          ),
        secretaryLabelById.get(secretaryId) ||
          allExpertLabelById.get(secretaryId) ||
          formatExpertName(
            members?.find((m) => m.role === CouncilRole.SECRETARY)?.expertProfileVersion ?? null
          ),
        allExpertLabelById.get(reviewer1Id) ||
          formatExpertName(
            members?.find((m) => m.role === CouncilRole.REVIEWER_1)?.expertProfileVersion ?? null
          ),
        allExpertLabelById.get(reviewer2Id) ||
          formatExpertName(
            members?.find((m) => m.role === CouncilRole.REVIEWER_2)?.expertProfileVersion ?? null
          ),
        allExpertLabelById.get(memberId) ||
          formatExpertName(
            members?.find((m) => m.role === CouncilRole.MEMBER)?.expertProfileVersion ?? null
          ),
        roomLabelById.get(project.roomId || "") || project.room?.name || "",
        sessionLabelById.get(project.defenseSessionId || "") ||
          formatDefenseSessionClock(project.defenseSession?.startTime),
        formatDate(project.defenseDate),
      ]
      applyDataStyle(row)
      applyEditableFill(row, editableCols)
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(16).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(17).alignment = { horizontal: "center", vertical: "middle" }
      row.getCell(17).numFmt = "dd/mm/yyyy"

      rowIndex += 1
      stt += 1
    }
  }

  const lastDataRow = rowIndex - 1
  if (lastDataRow >= 3) {
    addListValidation(dataSheet, 8, 3, lastDataRow, "DanhMuc", "A", allExpertOptions.length)
    addListValidation(dataSheet, 9, 3, lastDataRow, "DanhMuc", "A", allExpertOptions.length)
    addListValidation(dataSheet, 10, 3, lastDataRow, "DanhMuc", "B", presidentOptions.length)
    addListValidation(dataSheet, 11, 3, lastDataRow, "DanhMuc", "C", secretaryOptions.length)
    addListValidation(dataSheet, 12, 3, lastDataRow, "DanhMuc", "A", allExpertOptions.length)
    addListValidation(dataSheet, 13, 3, lastDataRow, "DanhMuc", "A", allExpertOptions.length)
    addListValidation(dataSheet, 14, 3, lastDataRow, "DanhMuc", "A", allExpertOptions.length)
    addListValidation(dataSheet, 15, 3, lastDataRow, "DanhMuc", "D", roomOptions.length)
    addListValidation(dataSheet, 16, 3, lastDataRow, "DanhMuc", "E", sessionOptions.length)
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const safeSessionName = session.name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "DotXet"
  const dateStamp = new Date().toISOString().slice(0, 10)
  return {
    buffer,
    fileName: `MauNhapHoiDong_${safeSessionName}_${dateStamp}.xlsx`,
  }
}
