import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import dayjs from "dayjs"

interface ExportStudentListParams {
  subjectName: string
  subjectClassCode: string
  credits: number | string
  scheduleText: string
  roomName: string
  students: any[]
}

export const exportStudentList = async ({
  subjectName,
  subjectClassCode,
  credits,
  scheduleText,
  roomName,
  students,
}: ExportStudentListParams) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Danh sách sinh viên")

  const FONT_NORMAL = { name: "Times New Roman", size: 12 }
  const FONT_BOLD = { name: "Times New Roman", size: 12, bold: true }
  
  const ALIGN_CENTER: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle", wrapText: true }
  const ALIGN_LEFT: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle", wrapText: true }

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }

  worksheet.columns = [
    { width: 8 },  // STT
    { width: 15 }, // Mã định danh
    { width: 30 }, // Họ và tên
    { width: 15 }, // Ngày sinh
    { width: 15 }, // Lớp khóa học
    { width: 20 }, // Ghi chú
  ]

  worksheet.mergeCells("A1:C1")
  worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG"
  worksheet.getCell("A1").font = FONT_NORMAL
  worksheet.getCell("A1").alignment = ALIGN_CENTER

  worksheet.mergeCells("D1:F1")
  worksheet.getCell("D1").value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"
  worksheet.getCell("D1").font = FONT_BOLD
  worksheet.getCell("D1").alignment = ALIGN_CENTER

  worksheet.mergeCells("A2:C2")
  worksheet.getCell("A2").value = "HỌC VIỆN KỸ THUẬT QUÂN SỰ"
  worksheet.getCell("A2").font = FONT_BOLD
  worksheet.getCell("A2").alignment = ALIGN_CENTER

  worksheet.mergeCells("D2:F2")
  worksheet.getCell("D2").value = "Độc lập - Tự do - Hạnh phúc"
  worksheet.getCell("D2").font = FONT_BOLD
  worksheet.getCell("D2").alignment = ALIGN_CENTER

  worksheet.mergeCells("A3:C3")
  worksheet.getCell("A3").value = "----------o0o----------"
  worksheet.getCell("A3").font = FONT_NORMAL
  worksheet.getCell("A3").alignment = ALIGN_CENTER

  worksheet.mergeCells("D3:F3")
  worksheet.getCell("D3").value = "----------o0o----------"
  worksheet.getCell("D3").font = FONT_NORMAL
  worksheet.getCell("D3").alignment = ALIGN_CENTER

  worksheet.mergeCells("A4:F4")
  worksheet.getCell("A4").value = "DANH SÁCH LỚP MÔN HỌC"
  worksheet.getCell("A4").font = { ...FONT_BOLD, size: 14 }
  worksheet.getCell("A4").alignment = ALIGN_CENTER

  worksheet.getCell("A6").value = " Môn học: "
  worksheet.getCell("A6").font = FONT_NORMAL
  worksheet.getCell("A6").alignment = ALIGN_LEFT

  worksheet.getCell("B6").value = {
    richText: [
      { text: " " },
      { font: FONT_BOLD, text: subjectName }
    ]
  }
  worksheet.getCell("B6").alignment = ALIGN_LEFT

  worksheet.getCell("C6").value = " Mã lớp môn học:"
  worksheet.getCell("C6").font = FONT_NORMAL
  worksheet.getCell("C6").alignment = ALIGN_LEFT

  worksheet.getCell("D6").value = {
    richText: [
      { text: " " },
      { font: FONT_BOLD, text: subjectClassCode }
    ]
  }
  worksheet.getCell("D6").alignment = ALIGN_LEFT

  worksheet.getCell("E6").value = " Số tín chỉ:"
  worksheet.getCell("E6").font = FONT_NORMAL
  worksheet.getCell("E6").alignment = ALIGN_LEFT

  worksheet.getCell("F6").value = ` ${credits}`
  worksheet.getCell("F6").font = FONT_NORMAL
  worksheet.getCell("F6").alignment = ALIGN_LEFT

  worksheet.mergeCells("A7:D7")
  worksheet.getCell("A7").value = {
    richText: [
      { text: " Thứ - Tiết:  ", font: FONT_NORMAL },
      { text: scheduleText, font: FONT_BOLD }
    ]
  }
  worksheet.getCell("A7").alignment = ALIGN_LEFT

  worksheet.getCell("E7").value = " Giảng đường:"
  worksheet.getCell("E7").font = FONT_NORMAL
  worksheet.getCell("E7").alignment = ALIGN_LEFT

  worksheet.getCell("F7").value = ` ${roomName}`
  worksheet.getCell("F7").font = FONT_NORMAL
  worksheet.getCell("F7").alignment = ALIGN_LEFT

  const headers = ["STT", "Mã định danh", "Họ và tên", "Ngày sinh", "Lớp khóa học", "Ghi chú"]
  const headerRow = worksheet.getRow(8)
  headerRow.values = headers
  headerRow.eachCell((cell) => {
    cell.font = FONT_BOLD
    cell.alignment = ALIGN_CENTER
    cell.border = THIN_BORDER
  })
  headerRow.height = 25

  let currentRow = 9
  students.forEach((student, index) => {
    const row = worksheet.getRow(currentRow)
    row.getCell(1).value = index + 1
    row.getCell(1).alignment = ALIGN_CENTER

    row.getCell(2).value = student.student?.userProfile?.code || ""
    row.getCell(2).alignment = ALIGN_CENTER

    row.getCell(3).value = student.student?.userProfile?.fullname || ""
    row.getCell(3).alignment = ALIGN_LEFT

    const dateOfBirth = student.student?.userProfile?.dateOfBirth
    row.getCell(4).value = dateOfBirth ? dayjs(dateOfBirth).format("DD/MM/YYYY") : ""
    row.getCell(4).alignment = ALIGN_CENTER

    row.getCell(5).value = student.student?.fixedClass?.code || ""
    row.getCell(5).alignment = ALIGN_CENTER

    row.getCell(6).value = student.description || student.note || ""
    row.getCell(6).alignment = ALIGN_LEFT

    row.eachCell((cell) => {
      cell.font = FONT_NORMAL
      cell.border = THIN_BORDER
    })
    
    currentRow++
  })

  currentRow += 2
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "- Điện thoại:"
  worksheet.getCell(`A${currentRow}`).font = FONT_NORMAL

  currentRow += 2
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "- Đơn vị quản lý lớp môn học:"
  worksheet.getCell(`A${currentRow}`).font = FONT_NORMAL

  currentRow += 1
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`)
  worksheet.getCell(`D${currentRow}`).value = `ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  worksheet.getCell(`D${currentRow}`).font = { ...FONT_NORMAL, italic: true }
  worksheet.getCell(`D${currentRow}`).alignment = ALIGN_CENTER

  currentRow += 1
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`)
  worksheet.getCell(`D${currentRow}`).value = "GIẢNG VIÊN"
  worksheet.getCell(`D${currentRow}`).font = FONT_BOLD
  worksheet.getCell(`D${currentRow}`).alignment = ALIGN_CENTER

  const buffer = await workbook.xlsx.writeBuffer()
  const safeSubjectName = subjectName.replace(/[/\\?%*:|"<>]/g, '-')
  const fileName = `Danh_sach_SV_${safeSubjectName}_${subjectClassCode}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}
