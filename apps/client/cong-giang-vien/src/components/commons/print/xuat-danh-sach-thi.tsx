import { formatDate } from "@lib/utils"
import type { Prisma } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, message } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Download } from "lucide-react"
import { useState } from "react"

const examListSelect = {
  id: true,
  start: true,
  examRoom: {
    select: {
      room: {
        select: {
          name: true,
        },
      },
      capacity: true,
    },
  },
  examPapers: {
    include: {
      studentSubjectScore: {
        include: {
          student: {
            include: {
              userProfile: {
                select: {
                  fullname: true,
                  code: true,
                  dateOfBirth: true,
                },
              },
              fixedClass: {
                select: {
                  name: true,
                  code: true,
                  trainingCourse: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          subjectClass: {
            select: {
              code: true,
              room: {
                select: {
                  id: true,
                  name: true,
                  capacity: true,
                },
              },
              subject: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const

export type ExamListExportData = Prisma.ExamListGetPayload<{
  select: typeof examListSelect
}>

const sanitizeSheetName = (name: string): string => {
  return name
    .replace(/[*?:\\/[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31)
}

const writeExamListWorkbook = async (data: ExamListExportData[], examName?: string) => {
  const allExamPapers = data.flatMap((el) => el.examPapers)

  if (!data.length) {
    message.warning("Không có dữ liệu để xuất")
    return false
  }
  if (allExamPapers.length === 0) {
    message.warning("Không có sinh viên nào trong danh sách thi")
    return false
  }

  const workbook = new ExcelJS.Workbook()
  const globalFontStyle = {
    name: "Times New Roman",
    size: 12,
  }
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { ...globalFontStyle, bold: true },
    alignment: {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    },
    border: {
      top: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const },
      bottom: { style: "thin" as const },
    },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFE0E0E0" },
    },
  }
  const cellStyle: Partial<ExcelJS.Style> = {
    font: globalFontStyle,
    alignment: {
      horizontal: "center",
      vertical: "middle",
    },
    border: {
      top: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const },
      bottom: { style: "thin" as const },
    },
  }
  const cellStyleLeft: Partial<ExcelJS.Style> = {
    ...cellStyle,
    alignment: {
      horizontal: "left",
      vertical: "middle",
    },
  }

  const hasRoomAssignment = data.some((el) => el.examRoom?.room?.name)

  if (hasRoomAssignment) {
    for (const examList of data) {
      if (examList.examPapers.length === 0) continue
      const roomName = examList.examRoom?.room?.name || "Chua phan phong"
      const caNumber = examList.start || "N/A"
      const sheetName = sanitizeSheetName(`Ca ${caNumber} - ${roomName}`)
      const worksheet = workbook.addWorksheet(sheetName)
      createExamSheet(worksheet, {
        examPapers: examList.examPapers,
        roomName,
        caNumber: String(caNumber),
        capacity: examList.examRoom?.capacity,
        examName,
        globalFontStyle,
        headerStyle,
        cellStyle,
        cellStyleLeft,
      })
    }
  } else {
    const worksheet = workbook.addWorksheet("Danh sach thi")
    createExamSheet(worksheet, {
      examPapers: allExamPapers,
      roomName: "Chua phan phong",
      caNumber: "Chua xac dinh",
      capacity: undefined,
      examName,
      globalFontStyle,
      headerStyle,
      cellStyle,
      cellStyleLeft,
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const timestamp = new Date().toISOString().slice(0, 10)
  const fileName = `DanhSachThi_${examName?.replace(/[^a-zA-Z0-9]/g, "_") || "Export"}_${timestamp}.xlsx`
  saveAs(new Blob([buffer]), fileName)
  message.success("Xuất danh sách thi thành công")
  return true
}

interface CreateExamSheetParams {
  examPapers: ExamListExportData["examPapers"]
  roomName: string
  caNumber: string
  capacity?: number | null
  examName?: string
  globalFontStyle: { name: string; size: number }
  headerStyle: Partial<ExcelJS.Style>
  cellStyle: Partial<ExcelJS.Style>
  cellStyleLeft: Partial<ExcelJS.Style>
}

function createExamSheet(worksheet: ExcelJS.Worksheet, params: CreateExamSheetParams) {
  const {
    examPapers,
    roomName,
    caNumber,
    capacity,
    examName,
    globalFontStyle,
    headerStyle,
    cellStyle,
    cellStyleLeft,
  } = params

  worksheet.mergeCells("A1:M1")
  const titleCell = worksheet.getCell("A1")
  titleCell.value = `DANH SÁCH THI${examName ? ` - ${examName}` : ""}`
  titleCell.style = {
    font: { ...globalFontStyle, size: 16, bold: true },
    alignment: { horizontal: "center", vertical: "middle" },
  }
  worksheet.getRow(1).height = 30

  worksheet.mergeCells("A2:M2")
  const roomInfoCell = worksheet.getCell("A2")
  const capacityText = capacity ? ` - Sức chứa: ${capacity}` : ""
  roomInfoCell.value = `Phòng thi: ${roomName} - Ca thi: ${caNumber}${capacityText}`
  roomInfoCell.style = {
    font: { ...globalFontStyle, size: 13, bold: true },
    alignment: { horizontal: "left", vertical: "middle" },
  }
  worksheet.getRow(2).height = 25
  worksheet.getRow(3).height = 10

  const headerRow = worksheet.getRow(4)
  headerRow.values = [
    "TT",
    "Mã sinh viên",
    "Họ và tên",
    "Ngày sinh",
    "Lớp",
    "Điểm TX",
    "Điểm ĐK",
    "Điểm thi",
    "Cấm thi",
    "Lý do cấm thi",
    "Hoãn thi",
    "Lý do hoãn thi",
    "Ghi chú",
  ]
  headerRow.eachCell((cell) => {
    cell.style = headerStyle
  })
  headerRow.height = 25

  worksheet.columns = [
    { width: 6 },
    { width: 15 },
    { width: 30 },
    { width: 12 },
    { width: 15 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 25 },
    { width: 10 },
    { width: 25 },
    { width: 20 },
  ]

  let rowIndex = 5
  examPapers.forEach((examPaper, index) => {
    const sss = examPaper.studentSubjectScore
    const student = sss?.student
    const row = worksheet.getRow(rowIndex)
    row.values = [
      index + 1,
      student?.userProfile?.code || "",
      student?.userProfile?.fullname || "",
      student?.userProfile?.dateOfBirth ? formatDate(student.userProfile.dateOfBirth) : "",
      student?.fixedClass?.code || "",
      sss?.attendanceScore ?? "",
      sss?.midtermScore ?? "",
      sss?.examScore ?? "",
      sss?.examBanned ? "Có" : "",
      sss?.examBannedReason || "",
      sss?.examPostponed ? "Có" : "",
      sss?.examPostponedReason || "",
      sss?.description || "",
    ]
    row.getCell(1).style = cellStyle
    row.getCell(2).style = cellStyle
    row.getCell(3).style = cellStyleLeft
    row.getCell(4).style = cellStyle
    row.getCell(5).style = cellStyle
    row.getCell(6).style = cellStyle
    row.getCell(7).style = cellStyle
    row.getCell(8).style = cellStyle
    row.getCell(9).style = cellStyle
    row.getCell(10).style = cellStyleLeft
    row.getCell(11).style = cellStyle
    row.getCell(12).style = cellStyleLeft
    row.getCell(13).style = cellStyleLeft
    rowIndex++
  })

  worksheet.mergeCells(`A${rowIndex + 1}:M${rowIndex + 1}`)
  const summaryCell = worksheet.getCell(`A${rowIndex + 1}`)
  summaryCell.value = `Tổng số sinh viên: ${examPapers.length}`
  summaryCell.style = {
    font: { ...globalFontStyle, bold: true, italic: true },
    alignment: { horizontal: "right", vertical: "middle" },
  }
}

/** Cùng điều kiện ql-dao-tao: đã có kỳ thi và đã lấy điểm SV (có ExamList). Không khóa DS thi. */
export const xuatDanhSachThiTheoKyThi = async (examId?: string | null, examName?: string) => {
  if (!examId) {
    message.warning("Lớp môn học chưa được lên danh sách thi")
    return
  }

  const res = await sqlTransaction([
    {
      model: "ExamList",
      operation: "findMany",
      data: {
        where: {
          examRoom: {
            examId,
            active: true,
            deletedAt: null,
          },
        },
        select: examListSelect,
        orderBy: {
          start: {
            nulls: "first",
            sort: "asc",
          },
        },
      },
    },
  ])

  if (res.status !== 200 || !res.data) {
    message.error("Không tải được danh sách thi")
    return
  }

  const data = (res.data[0] ?? []) as ExamListExportData[]
  try {
    await writeExamListWorkbook(data, examName)
  } catch (error) {
    console.error(error)
    message.error("Có lỗi xảy ra khi xuất danh sách thi")
  }
}

export const XuatDanhSachThiButton = ({
  examId,
  examName,
  disabled,
}: {
  examId?: string | null
  examName?: string
  disabled?: boolean
}) => {
  const [dangXuat, setDangXuat] = useState(false)
  const khongTheXuat = disabled || !examId

  return (
    <Button
      icon={<Download size={14} />}
      loading={dangXuat}
      disabled={khongTheXuat}
      onClick={async () => {
        setDangXuat(true)
        try {
          await xuatDanhSachThiTheoKyThi(examId, examName)
        } finally {
          setDangXuat(false)
        }
      }}
    >
      Xuất DS thi
    </Button>
  )
}
