import { DownloadOutlined } from "@ant-design/icons"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Flex } from "antd"

// import ExcelJS from 'exceljs'
// import { saveAs } from 'file-saver'

const ExportTemplateStudent = () => {
  // const exportTemplate = async () => {
  //     // Tạo workbook mới
  //     const workbook = new ExcelJS.Workbook()
  //     const worksheet = workbook.addWorksheet('HEQUANSU')

  //     // Thiết lập style
  //     const golbalFontStyle = {
  //         name: 'Times New Roman',
  //     }

  //     const headerTitleStyle = {
  //         font: { ...golbalFontStyle, bold: true, size: 14 },
  //         alignment: {
  //             horizontal: 'center' as const,
  //             vertical: 'middle' as const,
  //             wrapText: true as const,
  //         },
  //     }

  //     const headerSubtitleStyle = {
  //         font: { ...golbalFontStyle, bold: true, size: 16 },
  //         alignment: {
  //             horizontal: 'center' as const,
  //             vertical: 'middle' as const,
  //             wrapText: true as const,
  //         },
  //     }

  //     const headerStyleNormal = {
  //         font: { ...golbalFontStyle, size: 14 },
  //         alignment: {
  //             horizontal: 'right' as const,
  //             vertical: 'middle' as const,
  //             wrapText: true as const,
  //         },
  //     }

  //     const headerSubtitleStyleCenter = {
  //         font: { ...golbalFontStyle, bold: true, size: 14 },
  //         alignment: {
  //             horizontal: 'center' as const,
  //             vertical: 'middle' as const,
  //         },
  //     }

  //     const _headerSubtitleStyleRight = {
  //         font: { ...golbalFontStyle, bold: true, size: 14 },
  //         alignment: {
  //             horizontal: 'right' as const,
  //             vertical: 'middle' as const,
  //         },
  //     }

  //     const headerSubtitleStyleLeft = {
  //         font: { ...golbalFontStyle, bold: true, size: 14 },
  //         alignment: {
  //             horizontal: 'left' as const,
  //             vertical: 'middle' as const,
  //         },
  //     }

  //     const tableHeaderStyle = {
  //         font: {
  //             ...golbalFontStyle,
  //             bold: true,
  //             size: 14,
  //             color: { argb: 'FF000000' },
  //         },
  //         fill: {
  //             type: 'pattern',
  //             pattern: 'none',
  //         },
  //         alignment: {
  //             horizontal: 'center',
  //             vertical: 'middle',
  //             wrapText: true,
  //         },
  //         border: {
  //             top: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             left: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             right: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             bottom: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //         },
  //     }

  //     const dataCellStyle = {
  //         font: { ...golbalFontStyle, size: 14 },
  //         alignment: {
  //             horizontal: 'center' as const,
  //             vertical: 'middle' as const,
  //         },
  //         border: {
  //             top: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             left: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             right: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //             bottom: {
  //                 style: 'thin' as ExcelJS.BorderStyle,
  //                 color: { argb: 'FF000000' },
  //             },
  //         },
  //     }

  //     const _dataTextCellStyle = {
  //         ...dataCellStyle,
  //         alignment: {
  //             horizontal: 'left' as const,
  //             vertical: 'middle' as const,
  //         },
  //     }

  //     const italicTextStyle = {
  //         font: { ...golbalFontStyle, italic: true },
  //         alignment: {
  //             horizontal: 'left' as const,
  //             vertical: 'middle' as const,
  //         },
  //     }

  //     worksheet.mergeCells('A1:D2')
  //     worksheet.getCell('A1').value = 'BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ'
  //     worksheet.getCell('A1').style = headerTitleStyle

  //     worksheet.getRow(1).height = 20
  //     worksheet.getRow(2).height = 20

  //     worksheet.mergeCells('J1:R2')
  //     worksheet.getCell('J1').value =
  //         'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
  //     worksheet.getCell('J1').style = headerTitleStyle

  //     worksheet.mergeCells('A4:R4')
  //     worksheet.getCell('A4').value = 'IMPORT DANH SÁCH HỌC VIÊN'
  //     worksheet.getCell('A4').style = headerSubtitleStyle
  //     worksheet.getRow(4).height = 20

  //     worksheet.getCell('G6').value = 'Đối tượng đào tạo:'
  //     worksheet.getCell('G6').style = headerStyleNormal

  //     worksheet.getCell('H6').value = 'Đại học quân sự'
  //     worksheet.getCell('H6').style = headerSubtitleStyleLeft

  //     worksheet.getCell('G7').value = 'Khoá học:'
  //     worksheet.getCell('G7').style = headerStyleNormal

  //     worksheet.getCell('H7').value = 'Khoá 59'
  //     worksheet.getCell('H7').style = headerSubtitleStyleLeft

  //     worksheet.getCell('B8').value = '*Lưu ý:'
  //     worksheet.getCell('B8').style = headerSubtitleStyleCenter

  //     worksheet.mergeCells('B9:R9')
  //     worksheet.getCell('B9').value =
  //         'Mã học viên đánh theo quy định đánh mã, các trường thông tin khác nhập theo tên danh mục được xuất ra ở các sheet khác để đảm bảo dữ liệu được import chính xác vào hệ thống. '
  //     worksheet.getCell('B9').style = italicTextStyle
  //     // Thêm tiêu đề bảng
  //     const headerRow = worksheet.getRow(11)
  //     headerRow.values = [
  //         'STT',
  //         'Số BD',
  //         'Mã học viên',
  //         'Họ và tên',
  //         'Ngày sinh (dd/mm/yyyy)',
  //         'Giới tính',
  //         'Dân tộc',
  //         'Quốc tịch',
  //         'Nguyên quán Huyện',
  //         'Nguyên quán Tinh',
  //         'Tổ hợp xét tuyển',
  //         'Tổng điểm XT',
  //         'Điểm đánh giá NL',
  //         'Lớp quản lý',
  //         'Ngành',
  //         'Chuyên ngành',
  //         'Chương trình đào tạo',
  //         'Ghi chú',
  //     ]
  //     headerRow.eachCell((cell: any) => {
  //         cell.style = tableHeaderStyle
  //     })

  //     // Điều chỉnh độ rộng cột
  //     worksheet.columns = [
  //         { width: 10 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 40 },
  //         { width: 20 },
  //         { width: 10 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 20 },
  //     ]

  //     // Xuất file
  //     const buffer = await workbook.xlsx.writeBuffer()
  //     saveAs(new Blob([buffer]), 'Mau_nhap_sinh_vien.xlsx')
  // }

  return (
    <Flex>
      <Button
        className="px-4 py-1"
        href={getMinioUrl("mta/template/MauImportDSHV_v5.xlsx")}
        type="primary"
      >
        <DownloadOutlined />
        Xuất file mẫu excel
      </Button>
    </Flex>
  )
}

export default ExportTemplateStudent
