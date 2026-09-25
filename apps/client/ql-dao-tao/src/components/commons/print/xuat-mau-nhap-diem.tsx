import type { DiemLopMonHocProps } from "@pages/quan-ly-diem/ql-diem-lop-mon-hoc"
import { Button } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { FileDown } from "lucide-react"

interface ExportScoreTemplateProps {
  selectedSubjectClass: string | undefined
  dataTable: any[]
  type: DiemLopMonHocProps["score"]
  role?: "GV" | "P13" | "P2/P7"
}

const ExportScoreTemplate = ({
  selectedSubjectClass,
  dataTable,
  type,
  role = "GV",
}: ExportScoreTemplateProps) => {
  const exportTemplate = async () => {
    if (!selectedSubjectClass || dataTable.length === 0) return

    const firstRecord = dataTable[0]
    const subjectClass = firstRecord.subjectClass

    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Mẫu nhập điểm")

    // Thiết lập style
    const golbalFontStyle = {
      name: "Times New Roman",
    }

    const headerTitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 20 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    }

    const headerSubtitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
      },
    }

    const headerSubtitleStyleCenter = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    }

    const headerSubtitleStyleRight = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "right" as const,
        vertical: "middle" as const,
      },
    }

    const tableHeaderStyle = {
      font: {
        ...golbalFontStyle,
        bold: true,
        size: 14,
        color: { argb: "FF000000" },
      },
      fill: {
        type: "pattern",
        pattern: "none",
      },
      alignment: {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      },
      border: {
        top: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        left: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        right: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        bottom: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
      },
    }

    const dataCellStyle = {
      font: { ...golbalFontStyle, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
      border: {
        top: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        left: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        right: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        bottom: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
      },
    }

    const dataTextCellStyle = {
      ...dataCellStyle,
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
      },
    }

    const italicTextStyle = {
      font: { ...golbalFontStyle, italic: true },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
      },
    }

    // Thêm các dòng tiêu đề
    worksheet.mergeCells("A1:H1")
    worksheet.getCell("A1").value = "IMPORT ĐIỂM"
    worksheet.getCell("A1").style = headerTitleStyle

    worksheet.mergeCells("A3:B3")
    worksheet.getCell("A3").value = "Học kỳ: "
    worksheet.getCell("A3").style = headerSubtitleStyle

    worksheet.getCell("C3").value = `${subjectClass?.semester?.name || ""}`
    worksheet.getCell("C3").style = headerSubtitleStyle

    worksheet.mergeCells("A4:B4")
    worksheet.getCell("A4").value = "Lớp môn học: "
    worksheet.getCell("A4").style = headerSubtitleStyle

    worksheet.getCell("C4").value = `${subjectClass?.code || ""}`
    worksheet.getCell("C4").style = headerSubtitleStyle

    worksheet.mergeCells("D3:H3")
    worksheet.getCell("D3").value =
      `${subjectClass?.semester?.name || ""} năm học ${subjectClass?.semester?.schoolYear?.name || ""}`
    worksheet.getCell("D3").style = headerSubtitleStyle

    worksheet.mergeCells("D4:H4")
    worksheet.getCell("D4").value = `${subjectClass?.subject?.name || ""}`
    worksheet.getCell("D4").style = headerSubtitleStyle

    worksheet.mergeCells("A5:B5")
    worksheet.getCell("A5").value = "Giảng viên:"
    worksheet.getCell("A5").style = headerSubtitleStyle

    worksheet.mergeCells("C5:H5")
    worksheet.getCell("C5").value =
      `${subjectClass?.enterGradeLecturer?.userProfile?.fullname || subjectClass?.mainLecturer?.userProfile?.fullname || subjectClass?.extraLecturer?.userProfile?.fullname || ""}`
    worksheet.getCell("C5").style = headerSubtitleStyle

    worksheet.mergeCells("A6:C6")
    worksheet.getCell("A6").value = "Điểm nhập trong khoảng"
    worksheet.getCell("A6").style = headerSubtitleStyle

    worksheet.getCell("D6").value = "0"
    worksheet.getCell("D6").style = headerSubtitleStyleRight

    worksheet.getCell("E6").value = "10"
    worksheet.getCell("E6").style = headerSubtitleStyleRight

    worksheet.mergeCells("F6:H6")
    worksheet.getCell("F6").value = "Làm tròn 0.5"
    worksheet.getCell("F6").style = headerSubtitleStyleCenter

    worksheet.mergeCells("A7:H7")
    worksheet.getCell("A7").value =
      "Import điểm quá trình: trong chức năng Nhập điểm quá trình (khi còn hạn)"
    worksheet.getCell("A7").style = italicTextStyle

    worksheet.mergeCells("A8:H8")
    worksheet.getCell("A8").value = "Import điểm thi: trong chức năng Nhập điểm thi (khi còn hạn)"
    worksheet.getCell("A8").style = italicTextStyle

    // Thêm tiêu đề bảng
    const headerRow = worksheet.getRow(10)
    headerRow.values = [
      "STT",
      "Mã sinh viên",
      "Họ và tên",
      "Ngày sinh",
      "Tên lớp",
      "Điểm TX",
      "Điểm ĐK",
      "Điểm thi",
    ]

    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    // Thêm dữ liệu sinh viên
    dataTable.forEach((record, index) => {
      const row = worksheet.getRow(11 + index)
      row.values = [
        index + 1,
        record.student?.userProfile?.code || "",
        `${record.student?.userProfile?.lastName || ""} ${record.student?.userProfile?.firstName || ""}`,
        record.student?.userProfile?.dateOfBirth
          ? new Date(record.student.userProfile.dateOfBirth).toLocaleDateString("vi-VN")
          : "",
        record.student?.fixedClass?.name || "",
        record.attendanceScore ?? "",
        record.midtermScore ?? "",
        record.examScore ?? "",
      ]

      row.eachCell((cell: ExcelJS.Cell) => {
        if (Number(cell.col) >= 6 && Number(cell.col) <= 8 && row.number >= 11) {
          cell.protection = { locked: false }
        } else if (role !== "P13") {
          cell.protection = { locked: true }
        }
        cell.dataValidation = {
          type: "decimal",
          formulae: [0, 10],
          showErrorMessage: true,
          errorStyle: "error",
          errorTitle: "Giá trị không hợp lệ",
          error: "Vui lòng nhập điểm từ 0 đến 10",
        }
        const baseStyle = {
          ...dataCellStyle,
          protection: cell.protection,
        }

        if (cell.col && Number(cell.col) === 3) {
          cell.style = {
            ...baseStyle,
            alignment: dataTextCellStyle.alignment,
          }
        } else {
          cell.style = baseStyle
        }
      })
    })

    worksheet.protect("", {
      selectLockedCells: false,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false,
      objects: false,
      scenarios: false,
    })

    // Điều chỉnh độ rộng cột
    worksheet.columns = [
      { width: 10 }, // STT
      { width: 20 }, // Mã SV
      { width: 30 }, // Họ tên
      { width: 20 }, // Ngày sinh
      { width: 20 }, // Tên lớp
      { width: 15 }, // Điểm TX
      { width: 15 }, // Điểm ĐK
      { width: 15 }, // Điểm Thi
    ]
    if (role !== "P13") {
      if (type !== "THI") {
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell, colNumber) => {
            // Nếu là cột "Điểm thi" → khoá, ngược lại thì cho sửa
            cell.protection = { locked: colNumber === 8 }
          })
        })
      } else {
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell, colNumber) => {
            // Nếu là cột "Điểm thi" → khoá, ngược lại thì cho sửa
            cell.protection = { locked: colNumber === 7 || colNumber === 6 }
          })
        })
      }
    }

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer()
    const name = type === "TX/ĐK" ? "TX/ĐK" : "THI"
    saveAs(new Blob([buffer]), `Mau_nhap_diem_${name}_${subjectClass?.code || "unknown"}.xlsx`)
  }

  return (
    <Button onClick={exportTemplate} disabled={!selectedSubjectClass}>
      <FileDown />
      Xuất mẫu nhập điểm
    </Button>
  )
}

export default ExportScoreTemplate
