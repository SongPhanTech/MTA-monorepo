import { formatDateInSlash } from "@workspace/libs/timezone"
import { DownloadOutlined } from "@ant-design/icons"
import type { Prisma } from "@workspace/db/client"
import { Button, message } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

// Type for exam list data from useFindManyExamList
type ExamListData = Prisma.ExamListGetPayload<{
  select: {
    id: true
    start: true
    examRoom: {
      select: {
        room: {
          select: {
            name: true
          }
        }
        capacity: true
      }
    }
    examPapers: {
      include: {
        studentSubjectScore: {
          include: {
            student: {
              include: {
                userProfile: {
                  select: {
                    fullname: true
                    code: true
                    dateOfBirth: true
                  }
                }
                fixedClass: {
                  select: {
                    name: true
                    code: true
                    trainingCourse: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
            subjectClass: {
              select: {
                code: true
                room: {
                  select: {
                    id: true
                    name: true
                    capacity: true
                  }
                }
                subject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}>

interface ExportExamListProps {
  data: ExamListData[]
  examName?: string
  disabled?: boolean
  updateExamData: () => Promise<void>
  refreshExamLists?: () => Promise<ExamListData[]>
}

// Helper function to sanitize Excel sheet name
const sanitizeSheetName = (name: string): string => {
  return name
    .replace(/[*?:\\/[\]]/g, "") // Remove invalid characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .slice(0, 31) // Excel limits sheet name to 31 chars
}

const ExportExamList = ({
  data,
  examName,
  disabled,
  updateExamData,
  refreshExamLists,
}: ExportExamListProps) => {
  const exportToExcel = async () => {
    try {
      await updateExamData()
      const latestData = refreshExamLists ? await refreshExamLists() : data
      if (!latestData || latestData.length === 0) {
        message.warning("Không có dữ liệu để xuất")
        return
      }

      const allExamPapers = latestData.flatMap((el) => el.examPapers)
      if (allExamPapers.length === 0) {
        message.warning("Không có sinh viên nào trong danh sách thi")
        return
      }

      const workbook = new ExcelJS.Workbook()

      // Global font style
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

      // Check if rooms are assigned
      const hasRoomAssignment = latestData.some((el) => el.examRoom?.room?.name)

      if (hasRoomAssignment) {
        // Export by room - each room gets a separate sheet
        for (const examList of latestData) {
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
        // Export all students in one sheet (not assigned to rooms yet)
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

      // Export file
      const buffer = await workbook.xlsx.writeBuffer()
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `DanhSachThi_${examName?.replace(/[^a-zA-Z0-9]/g, "_") || "Export"}_${timestamp}.xlsx`
      saveAs(new Blob([buffer]), fileName)

      message.success("Xuất danh sách thi thành công")
    } catch (error) {
      console.error("Export error:", error)
      message.error("Có lỗi xảy ra khi xuất danh sách thi")
    }
  }

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={exportToExcel}
      disabled={disabled || !data || data.length === 0}
      className="bg-green-600 hover:bg-green-700"
    >
      Xuất DS thi
    </Button>
  )
}

interface CreateExamSheetParams {
  examPapers: ExamListData["examPapers"]
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

  // Title row
  worksheet.mergeCells("A1:O1")
  const titleCell = worksheet.getCell("A1")
  titleCell.value = `DANH SÁCH THI${examName ? ` - ${examName}` : ""}`
  titleCell.style = {
    font: { ...globalFontStyle, size: 16, bold: true },
    alignment: { horizontal: "center", vertical: "middle" },
  }
  worksheet.getRow(1).height = 30

  // Room info row
  worksheet.mergeCells("A2:O2")
  const roomInfoCell = worksheet.getCell("A2")
  const capacityText = capacity ? ` - Sức chứa: ${capacity}` : ""
  roomInfoCell.value = `Phòng thi: ${roomName} - Ca thi: ${caNumber}${capacityText}`
  roomInfoCell.style = {
    font: { ...globalFontStyle, size: 13, bold: true },
    alignment: { horizontal: "left", vertical: "middle" },
  }
  worksheet.getRow(2).height = 25

  // Empty row
  worksheet.getRow(3).height = 10

  // Header row
  const headerRow = worksheet.getRow(4)
  const headers = [
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
    "Đình chỉ thi",
    "Lý do đình chỉ thi",
    "Ghi chú",
  ]
  headerRow.values = headers
  headerRow.eachCell((cell) => {
    cell.style = headerStyle
  })
  headerRow.height = 25

  // Set column widths
  worksheet.columns = [
    { width: 6 }, // TT
    { width: 15 }, // Mã sinh viên
    { width: 30 }, // Họ và tên
    { width: 12 }, // Ngày sinh
    { width: 15 }, // Lớp
    { width: 10 }, // Điểm TX
    { width: 10 }, // Điểm ĐK
    { width: 10 }, // Điểm thi
    { width: 10 }, // Cấm thi
    { width: 25 }, // Lý do cấm thi
    { width: 10 }, // Hoãn thi
    { width: 25 }, // Lý do hoãn thi
    { width: 12 }, // Đình chỉ thi
    { width: 25 }, // Lý do đình chỉ thi
    { width: 20 }, // Ghi chú
  ]

  // Data rows
  let rowIndex = 5
  examPapers.forEach((examPaper, index) => {
    const sss = examPaper.studentSubjectScore
    const student = sss?.student
    const row = worksheet.getRow(rowIndex)

    row.values = [
      index + 1,
      student?.userProfile?.code || "",
      student?.userProfile?.fullname || "",
      student?.userProfile?.dateOfBirth
        ? formatDateInSlash(student.userProfile.dateOfBirth)
        : "",
      student?.fixedClass?.code || "",
      sss?.attendanceScore ?? "",
      sss?.midtermScore ?? "",
      sss?.examScore ?? "",
      sss?.examBanned ? "Có" : "",
      sss?.examBannedReason || "",
      sss?.examPostponed ? "Có" : "",
      sss?.examPostponedReason || "",
      sss?.suspended ? "Có" : "",
      sss?.suspendedReason || "",
      sss?.description || "",
    ]

    // Apply styles
    row.getCell(1).style = cellStyle // TT
    row.getCell(2).style = cellStyle // Mã định danh
    row.getCell(3).style = cellStyleLeft // Họ tên
    row.getCell(4).style = cellStyle // Ngày sinh
    row.getCell(5).style = cellStyle // Lớp
    row.getCell(6).style = cellStyle // Điểm TX
    row.getCell(7).style = cellStyle // Điểm ĐK
    row.getCell(8).style = cellStyle // Điểm thi
    row.getCell(9).style = cellStyle // Cấm thi
    row.getCell(10).style = cellStyleLeft // Lý do cấm thi
    row.getCell(11).style = cellStyle // Hoãn thi
    row.getCell(12).style = cellStyleLeft // Lý do hoãn thi
    row.getCell(13).style = cellStyle // Đình chỉ thi
    row.getCell(14).style = cellStyleLeft // Lý do đình chỉ thi
    row.getCell(15).style = cellStyleLeft // Ghi chú

    rowIndex++
  })

  // Summary row
  worksheet.mergeCells(`A${rowIndex + 1}:O${rowIndex + 1}`)
  const summaryCell = worksheet.getCell(`A${rowIndex + 1}`)
  summaryCell.value = `Tổng số sinh viên: ${examPapers.length}`
  summaryCell.style = {
    font: { ...globalFontStyle, bold: true, italic: true },
    alignment: { horizontal: "right", vertical: "middle" },
  }
}

export default ExportExamList
