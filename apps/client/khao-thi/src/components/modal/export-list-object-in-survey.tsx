import { DownloadOutlined } from "@ant-design/icons"
import { getSurveyObjects } from "@workspace/libs/api/exam"
import { Flex, message } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportObjectInSurvey = ({ query, surveyName }: { query: any; surveyName: string }) => {
  const exportTemplate = async () => {
    try {
      const res = await getSurveyObjects({
        ...query,
      })
      if (res?.status === 200) {
        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet("Danh sách người làm khảo sát")

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

        const headerStyleNormal = {
          font: { ...golbalFontStyle, size: 14 },
          alignment: {
            horizontal: "right" as const,
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

        worksheet.mergeCells("A1:D2")
        worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
        worksheet.getCell("A1").style = headerTitleStyle

        worksheet.getRow(1).height = 30
        worksheet.getRow(2).height = 30

        worksheet.mergeCells("G1:J2")
        worksheet.getCell("G1").value =
          "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
        worksheet.getCell("G1").style = headerTitleStyle

        worksheet.mergeCells("A4:J4")
        worksheet.getCell("A4").value = `DANH SÁCH NGƯỜI LÀM KHẢO SÁT: ${surveyName}`
        worksheet.getCell("A4").style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        // Thêm tiêu đề bảng
        const headerRow = worksheet.getRow(11)
        headerRow.values = [
          "STT",
          "Mã học viên",
          "Mã giảng viên",
          "Họ và tên",
          "CCCD",
          "SĐT",
          "Đơn vị quản lý",
          "Lớp quản lý",
          "Khoá",
          "Trạng thái khảo sát",
        ]
        headerRow.eachCell((cell: any) => {
          cell.style = tableHeaderStyle
        })

        // Điều chỉnh độ rộng cột
        worksheet.columns = [
          { width: 10 },
          { width: 20 },
          { width: 20 },
          { width: 40 },
          { width: 20 },
          { width: 20 },
          { width: 30 },
          { width: 30 },
          { width: 30 },
          { width: 20 },
        ]
        if (res?.data && res?.data?.data?.length > 0) {
          res?.data?.data.forEach((i: any, index: number) => {
            const headerRowValue: any = worksheet.getRow(12 + index)
            headerRowValue.values = [
              index + 1,
              i?.code || "",
              i?.lecturer?.userProfile?.code || "",
              `${i?.lastName || ""} ${i?.firstName || ""}`,
              i?.idCardNumber || "",
              i?.phoneNumber || "",
              i?.donVi?.sTen || "",
              i?.educationAndTraining?.length > 0
                ? `${i?.educationAndTraining[0]?.fixedClass?.code}-${i?.educationAndTraining[0]?.fixedClass?.name}`
                : "",
              i?.educationAndTraining?.length > 0
                ? `${i?.educationAndTraining[0]?.fixedClass?.trainingCourse?.name || ""}`
                : "",
              i?.surveySession ? "Đã làm" : "Chưa làm",
            ]
          })
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), `${surveyName}.xlsx`)
      }
    } catch (error: any) {
      if (error?.info?.message) {
        return
      }
      message.error("Đã xảy ra lỗi, vuiご kiểm tra lại")
    }
  }

  return (
    <Flex>
      <span
        onClick={exportTemplate}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <DownloadOutlined />
        <span style={{ color: "#000" }}>Xuất file Excel</span>
      </span>
    </Flex>
  )
}

export default ExportObjectInSurvey
