import { CouncilProposalStatus, CouncilRole, ThesisType } from "@workspace/db/client"
import ExcelJS from "exceljs"
import { prisma } from ".."

export type ImportCouncilFromExcelParams = {
  thesisSessionId: string
  fileBuffer: ArrayBuffer | Buffer
}

export type ImportCouncilFromExcelResult = {
  updatedCount: number
}

type ImportRow = {
  rowNumber: number
  thesisProjectId: string
  studentCode: string
  title: string
  supervisorLabel: string
  coSupervisorLabel: string
  chairmanLabel: string
  secretaryLabel: string
  reviewer1Label: string
  reviewer2Label: string
  memberLabel: string
  roomLabel: string
  defenseSessionLabel: string
  defenseDate: Date | null
}

type LabelMaps = {
  expert: Map<string, string>
  president: Map<string, string>
  secretary: Map<string, string>
  room: Map<string, string>
  defenseSession: Map<string, string>
}

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ""
  const value = cell.value
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0")
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const year = value.getFullYear()
    return `${day}/${month}/${year}`
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text || "")
        .join("")
        .trim()
    }
    if ("text" in value && value.text != null) return String(value.text).trim()
    if ("result" in value) {
      const result = value.result
      if (result === null || result === undefined) return ""
      if (result instanceof Date) {
        const day = String(result.getDate()).padStart(2, "0")
        const month = String(result.getMonth() + 1).padStart(2, "0")
        const year = result.getFullYear()
        return `${day}/${month}/${year}`
      }
      return String(result).trim()
    }
  }
  return String(value).trim()
}

function parseExcelDate(cell: ExcelJS.Cell | undefined): Date | null {
  if (!cell) return null
  const value = cell.value
  if (value === null || value === undefined || value === "") return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  if (typeof value === "object" && value && "result" in value && value.result instanceof Date) {
    const result = value.result
    return new Date(result.getFullYear(), result.getMonth(), result.getDate())
  }
  const text = cellText(cell)
  if (!text) return null
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date
    }
    return null
  }
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isWithinGvhdSupervisorEditWindow(topicEntryDeadline: Date | null | undefined) {
  if (!topicEntryDeadline) return true
  const endOfDay = new Date(topicEntryDeadline)
  endOfDay.setHours(23, 59, 59, 999)
  return Date.now() <= endOfDay.getTime()
}

function resolveLabel(
  maps: LabelMaps,
  type: keyof LabelMaps,
  label: string,
  rowNumber: number,
  studentCode: string,
  fieldName: string
): string | null {
  if (!label) return null
  const id = maps[type].get(label)
  if (!id) {
    throw new Error(
      `Dòng ${rowNumber}${studentCode ? ` (mã HV: ${studentCode})` : ""}: không tìm thấy ${fieldName} "${label}" trong danh mục.`
    )
  }
  return id
}

function readLabelMaps(workbook: ExcelJS.Workbook): LabelMaps | null {
  const mapSheet = workbook.getWorksheet("_Map")
  if (!mapSheet) return null

  const maps: LabelMaps = {
    expert: new Map(),
    president: new Map(),
    secretary: new Map(),
    room: new Map(),
    defenseSession: new Map(),
  }

  mapSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const type = cellText(row.getCell(1)).toUpperCase()
    const label = cellText(row.getCell(2))
    const id = cellText(row.getCell(3))
    if (!type || !label || !id) return
    if (type === "EXPERT") maps.expert.set(label, id)
    else if (type === "PRESIDENT") maps.president.set(label, id)
    else if (type === "SECRETARY") maps.secretary.set(label, id)
    else if (type === "ROOM") maps.room.set(label, id)
    else if (type === "DEFENSE_SESSION") maps.defenseSession.set(label, id)
  })

  return maps
}

async function buildLabelMapsFromDb(): Promise<LabelMaps> {
  // Fallback when _Map sheet is missing: match by exact current display labels is unreliable,
  // so we only support ID-as-label and room/session names from DB.
  const [experts, rooms, defenseSessions] = await Promise.all([
    prisma.expertProfile.findMany({
      where: { deletedAt: null, thesisExpert: true },
      select: { id: true, eligiblePresident: true, eligibleSecretary: true },
    }),
    prisma.room.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.defenseSession.findMany({
      where: { deletedAt: null },
      select: { id: true, startTime: true },
    }),
  ])

  const maps: LabelMaps = {
    expert: new Map(),
    president: new Map(),
    secretary: new Map(),
    room: new Map(),
    defenseSession: new Map(),
  }

  for (const expert of experts) {
    maps.expert.set(expert.id, expert.id)
    if (expert.eligiblePresident) maps.president.set(expert.id, expert.id)
    if (expert.eligibleSecretary) maps.secretary.set(expert.id, expert.id)
  }
  for (const room of rooms) {
    maps.room.set(room.id, room.id)
    if (room.name) maps.room.set(room.name.trim(), room.id)
  }
  for (const session of defenseSessions) {
    maps.defenseSession.set(session.id, session.id)
    const date = session.startTime
    if (date) {
      const label = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`
      if (!maps.defenseSession.has(label)) maps.defenseSession.set(label, session.id)
    }
  }

  return maps
}

function readImportRows(workbook: ExcelJS.Workbook): ImportRow[] {
  const sheet = workbook.getWorksheet("NhapHoiDong")
  if (!sheet) {
    throw new Error(
      'Không tìm thấy sheet "NhapHoiDong". Vui lòng dùng đúng file mẫu xuất từ hệ thống.'
    )
  }

  const headerRow = sheet.getRow(2)
  const thesisProjectIdHeader = cellText(headerRow.getCell(2))
  if (!thesisProjectIdHeader.toLowerCase().includes("id đề tài")) {
    throw new Error("File Excel không đúng mẫu (thiếu cột ID đề tài ở dòng tiêu đề).")
  }

  const rows: ImportRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return
    const thesisProjectId = cellText(row.getCell(2))
    if (!thesisProjectId) return

    const defenseDateText = cellText(row.getCell(17))
    const defenseDate = parseExcelDate(row.getCell(17))
    if (defenseDateText && !defenseDate) {
      throw new Error(
        `Dòng ${rowNumber}: ngày bảo vệ không hợp lệ "${defenseDateText}". Dùng định dạng DD/MM/YYYY.`
      )
    }

    rows.push({
      rowNumber,
      thesisProjectId,
      studentCode: cellText(row.getCell(3)),
      title: cellText(row.getCell(7)),
      supervisorLabel: cellText(row.getCell(8)),
      coSupervisorLabel: cellText(row.getCell(9)),
      chairmanLabel: cellText(row.getCell(10)),
      secretaryLabel: cellText(row.getCell(11)),
      reviewer1Label: cellText(row.getCell(12)),
      reviewer2Label: cellText(row.getCell(13)),
      memberLabel: cellText(row.getCell(14)),
      roomLabel: cellText(row.getCell(15)),
      defenseSessionLabel: cellText(row.getCell(16)),
      defenseDate,
    })
  })

  if (!rows.length) {
    throw new Error("File Excel không có dòng dữ liệu để import.")
  }

  return rows
}

export async function importCouncilFromExcel(
  params: ImportCouncilFromExcelParams
): Promise<ImportCouncilFromExcelResult> {
  const { thesisSessionId, fileBuffer } = params
  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }

  const session = await prisma.thesisSession.findFirst({
    where: { id: thesisSessionId, deletedAt: null },
    select: { id: true, topicEntryDeadline: true },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt luận văn.")
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer))

  const rows = readImportRows(workbook)
  const maps = readLabelMaps(workbook) ?? (await buildLabelMapsFromDb())

  const resolved = rows.map((row) => {
    const supervisorId = resolveLabel(
      maps,
      "expert",
      row.supervisorLabel,
      row.rowNumber,
      row.studentCode,
      "GVHD 1"
    )
    const coSupervisorId = resolveLabel(
      maps,
      "expert",
      row.coSupervisorLabel,
      row.rowNumber,
      row.studentCode,
      "GVHD 2"
    )
    const councilChairman = resolveLabel(
      maps,
      "president",
      row.chairmanLabel,
      row.rowNumber,
      row.studentCode,
      "Chủ tịch"
    )
    const councilSecretary = resolveLabel(
      maps,
      "secretary",
      row.secretaryLabel,
      row.rowNumber,
      row.studentCode,
      "Thư ký"
    )
    const reviewer1 = resolveLabel(
      maps,
      "expert",
      row.reviewer1Label,
      row.rowNumber,
      row.studentCode,
      "Phản biện 1"
    )
    const reviewer2 = resolveLabel(
      maps,
      "expert",
      row.reviewer2Label,
      row.rowNumber,
      row.studentCode,
      "Phản biện 2"
    )
    const councilMember = resolveLabel(
      maps,
      "expert",
      row.memberLabel,
      row.rowNumber,
      row.studentCode,
      "Ủy viên"
    )
    const roomId = resolveLabel(
      maps,
      "room",
      row.roomLabel,
      row.rowNumber,
      row.studentCode,
      "Phòng bảo vệ"
    )
    const defenseSessionId = resolveLabel(
      maps,
      "defenseSession",
      row.defenseSessionLabel,
      row.rowNumber,
      row.studentCode,
      "Ca bảo vệ"
    )

    const councilIds = [
      councilChairman,
      councilSecretary,
      reviewer1,
      reviewer2,
      councilMember,
    ].filter((id): id is string => !!id)
    if (new Set(councilIds).size !== councilIds.length) {
      throw new Error(
        `Dòng ${row.rowNumber}${row.studentCode ? ` (mã HV: ${row.studentCode})` : ""}: các cán bộ hội đồng bảo vệ không được trùng nhau.`
      )
    }

    if (supervisorId && coSupervisorId && supervisorId === coSupervisorId) {
      throw new Error(
        `Dòng ${row.rowNumber}${row.studentCode ? ` (mã HV: ${row.studentCode})` : ""}: GVHD 1 và GVHD 2 không được trùng nhau.`
      )
    }

    const supervisorIds = [supervisorId, coSupervisorId].filter((id): id is string => !!id)
    if (supervisorIds.some((id) => councilIds.includes(id))) {
      throw new Error(
        `Dòng ${row.rowNumber}${row.studentCode ? ` (mã HV: ${row.studentCode})` : ""}: giáo viên hướng dẫn không được trùng với thành viên hội đồng bảo vệ.`
      )
    }

    return {
      ...row,
      supervisorId,
      coSupervisorId,
      councilChairman,
      councilSecretary,
      reviewer1,
      reviewer2,
      councilMember,
      roomId,
      defenseSessionId,
    }
  })

  const projectIds = resolved.map((item) => item.thesisProjectId)
  const uniqueProjectIds = [...new Set(projectIds)]
  if (uniqueProjectIds.length !== projectIds.length) {
    throw new Error("File Excel có ID đề tài bị trùng. Mỗi đề tài chỉ được xuất hiện một dòng.")
  }

  const projects = await prisma.thesisProject.findMany({
    where: {
      id: { in: uniqueProjectIds },
      deletedAt: null,
      thesisSessionId,
      thesisType: ThesisType.THESIS,
    },
    select: {
      id: true,
      councilId: true,
      supervisorId: true,
      coSupervisorId: true,
    },
  })
  const projectById = new Map(projects.map((project) => [project.id, project]))

  for (const item of resolved) {
    if (!projectById.has(item.thesisProjectId)) {
      throw new Error(
        `Dòng ${item.rowNumber}${item.studentCode ? ` (mã HV: ${item.studentCode})` : ""}: đề tài không thuộc đợt xét hiện tại.`
      )
    }
  }

  for (const item of resolved) {
    const project = projectById.get(item.thesisProjectId)!
    const oldSupervisorId = project.supervisorId ?? null
    const oldCoSupervisorId = project.coSupervisorId ?? null
    if (
      (item.supervisorId !== oldSupervisorId || item.coSupervisorId !== oldCoSupervisorId) &&
      !isWithinGvhdSupervisorEditWindow(session.topicEntryDeadline)
    ) {
      throw new Error(
        "Đã quá hạn nhập GVHD. Chỉ được thay đổi giáo viên hướng dẫn khi còn trong hạn (theo ngày hạn nhập đề tài của đợt xét)."
      )
    }
  }

  const updatedCount = await prisma.$transaction(async (tx) => {
    let count = 0
    for (const item of resolved) {
      const project = projectById.get(item.thesisProjectId)
      if (!project) continue

      let councilId = project.councilId
      if (!councilId) {
        const council = await tx.council.create({
          data: {
            proposedDate: new Date(),
            status: CouncilProposalStatus.PENDING,
          },
        })
        councilId = council.id
      } else {
        await tx.paymentRecord.deleteMany({
          where: { councilMember: { councilId } },
        })
        await tx.invitation.deleteMany({
          where: { councilMember: { councilId } },
        })
        await tx.councilMember.deleteMany({
          where: { councilId },
        })
      }

      const members = [
        { role: CouncilRole.CHAIRMAN, expertId: item.councilChairman },
        { role: CouncilRole.SECRETARY, expertId: item.councilSecretary },
        { role: CouncilRole.REVIEWER_1, expertId: item.reviewer1 },
        { role: CouncilRole.REVIEWER_2, expertId: item.reviewer2 },
        { role: CouncilRole.MEMBER, expertId: item.councilMember },
      ].filter((member): member is { role: CouncilRole; expertId: string } => !!member.expertId)

      if (members.length > 0) {
        await tx.councilMember.createMany({
          data: members.map((member) => ({
            councilId: councilId!,
            role: member.role,
            expertId: member.expertId,
          })),
        })
      }

      await tx.thesisProject.update({
        where: { id: project.id },
        data: {
          title: item.title,
          supervisorId: item.supervisorId,
          coSupervisorId: item.coSupervisorId,
          councilId,
          roomId: item.roomId,
          defenseSessionId: item.defenseSessionId,
          defenseDate: item.defenseDate,
        },
      })
      count += 1
    }
    return count
  })

  return { updatedCount }
}
