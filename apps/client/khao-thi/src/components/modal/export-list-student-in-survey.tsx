import { formatDateInSlash } from "@workspace/libs/timezone"
import { DownloadOutlined } from "@ant-design/icons"
import { Button, Flex } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportStudentInSurvey = ({
  data,
  lecturer,
}: {
  /** Dữ liệu từ API lượt khảo sát (đã lọc đối tượng); xuất đúng số liệu trên màn hình. */
  data: any[]
  lecturer: any
  selectedId?: string
}) => {
  const checkStatus = (record: any) => (record?.completed ? record : null)
  const exportTemplate = async () => {
    // Thiết lập style
    const golbalFontStyle = {
      name: "Times New Roman",
    }

    const headerTitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const headerSubtitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 16 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const centerColumns = new Set([1, 2, 4, 5, 6, 7, 8])
    const TABLE_COL_COUNT = 8
    const TABLE_HEADER_ROW = 11
    const DATA_START_ROW = 12

    const thinBorder = {
      top: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
      left: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
      right: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
      bottom: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
    }

    const applyTableCellStyle = (cell: ExcelJS.Cell, colNumber: number, isHeader = false) => {
      cell.font = {
        ...golbalFontStyle,
        bold: isHeader,
        size: isHeader ? 13 : 12,
      }
      cell.alignment = {
        horizontal: centerColumns.has(colNumber) ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      }
      cell.border = thinBorder
    }

    const setupA4Print = (sheet: ExcelJS.Worksheet, lastRow: number) => {
      sheet.pageSetup = {
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.6,
          bottom: 0.6,
          header: 0.3,
          footer: 0.3,
        },
      }
      sheet.pageSetup.printArea = `A1:H${lastRow}`
    }
    if (data?.length > 0) {
      const workbook = new ExcelJS.Workbook()

      data.forEach((item: any) => {
        const worksheet = workbook.addWorksheet(`${item.code} - ${item.name}`)

        worksheet.mergeCells("A1:D2")
        worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
        worksheet.getCell("A1").style = headerTitleStyle

        worksheet.getRow(1).height = 28
        worksheet.getRow(2).height = 28

        worksheet.mergeCells("E1:H2")
        worksheet.getCell("E1").value =
          "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
        worksheet.getCell("E1").style = headerTitleStyle

        worksheet.mergeCells("A4:H4")
        worksheet.getCell("A4").value =
          `DANH SÁCH NGƯỜI LÀM KHẢO SÁT: ${lecturer?.survey[0]?.clusterSurvey?.name}`
        worksheet.getCell("A4").style = headerSubtitleStyle
        worksheet.getRow(4).height = 24

        const infoLabelStyle = {
          font: { ...golbalFontStyle, bold: true, size: 13 },
          alignment: {
            horizontal: "right" as const,
            vertical: "middle" as const,
          },
        }
        const infoValueStyle = {
          font: { ...golbalFontStyle, size: 13 },
          alignment: {
            horizontal: "left" as const,
            vertical: "middle" as const,
          },
        }

        worksheet.getCell("C5").value = "Giảng viên:"
        worksheet.getCell("C5").style = infoLabelStyle
        worksheet.mergeCells("D5:H5")
        worksheet.getCell("D5").value =
          `${lecturer?.userProfile?.code} - ${lecturer?.userProfile?.fullname || ""}`
        worksheet.getCell("D5").style = infoValueStyle
        worksheet.getRow(5).height = 22

        worksheet.getCell("C6").value = "Lớp môn học:"
        worksheet.getCell("C6").style = infoLabelStyle
        worksheet.mergeCells("D6:H6")
        worksheet.getCell("D6").value = `${item.code} - ${item.name}`
        worksheet.getCell("D6").style = infoValueStyle
        worksheet.getRow(6).height = 22

        const headerRow = worksheet.getRow(TABLE_HEADER_ROW)
        headerRow.values = [
          "STT",
          "Mã học viên",
          "Họ và tên",
          "Ngày sinh",
          "SĐT",
          "Lớp quản lý",
          "Khoá",
          "Trạng thái khảo sát",
        ]
        headerRow.height = 30
        for (let col = 1; col <= TABLE_COL_COUNT; col++) {
          applyTableCellStyle(headerRow.getCell(col), col, true)
        }

        worksheet.columns = [
          { width: 6 },
          { width: 14 },
          { width: 24 },
          { width: 12 },
          { width: 14 },
          { width: 12 },
          { width: 10 },
          { width: 16 },
        ]

        const dataRowCount = item?.subjectClassStudent?.length || 0
        if (dataRowCount > 0) {
          item.subjectClassStudent.forEach((i: any, index: number) => {
            const dataRow = worksheet.getRow(DATA_START_ROW + index)
            dataRow.height = 24
            dataRow.values = [
              index + 1,
              i?.student?.userProfile?.code || "",
              `${i?.student?.userProfile?.lastName || ""} ${i?.student?.userProfile?.firstName || ""}`,
              i?.student?.userProfile?.dateOfBirth
                ? formatDateInSlash(i?.student?.userProfile?.dateOfBirth)
                : "",
              i?.student?.userProfile?.phoneNumber || "",
              i?.student ? `${i?.student?.fixedClass?.code || ""}` : "",
              i?.student ? `${i?.student?.fixedClass?.trainingCourse?.name || ""}` : "",
              checkStatus(i) ? "Đã làm" : "Chưa làm",
            ]
            for (let col = 1; col <= TABLE_COL_COUNT; col++) {
              applyTableCellStyle(dataRow.getCell(col), col)
            }
          })
        }

        setupA4Print(worksheet, TABLE_HEADER_ROW + dataRowCount)
      })
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(
        new Blob([buffer]),
        `danh_sach_nguoi_lam_khao_sat${lecturer?.survey[0]?.clusterSurvey?.name}.xlsx`
      )
    }
  }

  return (
    <Flex>
      <Button type="primary" size="small" onClick={exportTemplate} icon={<DownloadOutlined />}>
        Xuất file excel
      </Button>
    </Flex>
  )
}

export default ExportStudentInSurvey
