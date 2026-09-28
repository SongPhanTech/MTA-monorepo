import { DownloadOutlined } from "@ant-design/icons"
import { Button, Flex } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportTemplateGuestLecturer = () => {
  const exportTemplate = async () => {
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Danh sách giảng viên mời giảng")

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

    worksheet.getCell("A2").value = "Danh sách giảng viên mời giảng"
    worksheet.getCell("A2").style = headerTitleStyle

    // Thêm tiêu đề bảng
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
      "Địa chỉ",
      "Điện thoại",
      "Email",
      "CCCD/CMND",
      "Ngân hàng",
      "Số tài khoản",
      "Ghi chú",
    ]
    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    // Mặc định "Kiểu giảng viên" là giảng viên ngoài cho các dòng nhập liệu
    worksheet.getCell("F5").value = "Giảng viên ngoài"
    // Điều chỉnh độ rộng cột
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
    // Cột Mã định danh (B), CCCD (L), Ngân hàng (M), Số tài khoản (N) ép kiểu text
    ;["B", "L", "M", "N"].forEach((col) => {
      worksheet.getColumn(col).numFmt = "@"

      worksheet.getColumn(col).alignment = {
        horizontal: "left",
        vertical: "middle",
      }
    })
    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "Mau_nhap_giang_vien_moi_giang.xlsx")
  }

  return (
    <Flex>
      <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
        Xuất file mẫu GV mời giảng
      </Button>
    </Flex>
  )
}

export default ExportTemplateGuestLecturer
