import { DownloadOutlined } from "@ant-design/icons"
import { Button, Flex } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportTemplateInternship = () => {
  const exportTemplate = async () => {
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Danh sách thực tập")

    // Thiết lập style
    const golbalFontStyle = {
      name: "Times New Roman",
    }

    const headerTitleStyle = {
      font: { ...golbalFontStyle, size: 14 },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
        wrapText: true as const,
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

    worksheet.getCell("A1").value = "Trường"
    worksheet.getCell("A1").style = headerTitleStyle

    worksheet.getCell("C1").value = "HỌC VIỆN KỸ THUẬT QUÂN SỰ"
    worksheet.getCell("C1").style = headerTitleStyle

    worksheet.getCell("A2").value = "Danh sách thực tập"
    worksheet.getCell("A2").style = headerTitleStyle

    // Thêm tiêu đề bảng
    const headerRow = worksheet.getRow(4)
    headerRow.values = [
      "STT",
      "Mã TTS",
      "Tên thực tập sinh",
      "Ngày sinh (dd/mm/yyyy)",
      "Mã lớp môn thực tập",
      "Tên lớp môn thực tập",
      "Giới tính",
      "Đơn vị thực tập",
      "Địa chỉ đơn vị thực tập",
      "Nội dung thực tập",
      "GVHD1",
      "GVHD2",
      "Thời gian bắt đầu thực tập (dd/mm/yyyy)",
      "Thời gian kết thúc thực tập (dd/mm/yyyy)",
      "Thời gian báo cáo (dd/mm/yyyy)",
      "Điểm",
    ]
    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    // Điều chỉnh độ rộng cột
    worksheet.columns = [
      { width: 10 }, // STT
      { width: 20 }, // Mã TTS
      { width: 45 }, // Tên thực tập sinh
      { width: 40 }, // Ngày sinh
      { width: 40 }, // Mã lớp môn thực tập
      { width: 30 }, // Tên lớp môn thực tập
      { width: 20 }, // Giới tính
      { width: 20 }, // Đơn vị thực tập
      { width: 20 }, // Địa chỉ đơn vị thực tập
      { width: 30 }, // Nội dung thực tập
      { width: 20 }, // GVHD1
      { width: 20 }, // GVHD2
      { width: 40 }, // Thời gian bắt đầu thực tập
      { width: 40 }, // Thời gian kết thúc thực tập
      { width: 30 }, // Thời gian báo cáo
      { width: 20 }, // Điểm
    ]

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "Mau_nhap_thuc_tap.xlsx")
  }

  return (
    <Flex>
      <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
        Xuất file mẫu excel
      </Button>
    </Flex>
  )
}

export default ExportTemplateInternship
