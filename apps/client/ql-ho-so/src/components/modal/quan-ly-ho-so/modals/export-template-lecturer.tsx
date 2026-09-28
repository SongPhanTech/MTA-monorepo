import { DownloadOutlined } from "@ant-design/icons"
import { Button, Flex } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportTemplateLecturer = () => {
  const exportTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Danh sách giảng viên")

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

    worksheet.getCell("A2").value = "Danh sách giảng viên"
    worksheet.getCell("A2").style = headerTitleStyle

    const headerRow = worksheet.getRow(4)
    headerRow.values = [
      "STT",
      "Mã định danh",
      "Tên giảng viên",
      "Ngày sinh (dd/mm/yyyy)",
      "Giới tính",
      "Kiểu giảng viên",
      "Học hàm",
      "Học vị",
      "Khoa",
      "Bộ môn",
      "Địa chỉ",
      "Điện thoại",
      "Email",
      "CCCD/CMND",
      "Ghi chú",
    ]
    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    worksheet.columns = [
      { width: 10 },
      { width: 20 },
      { width: 40 },
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "Mau_nhap_giang_vien_vien.xlsx")
  }

  return (
    <Flex>
      <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
        Xuất file mẫu excel
      </Button>
    </Flex>
  )
}

export default ExportTemplateLecturer
