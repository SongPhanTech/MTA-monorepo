import { DownloadOutlined } from "@ant-design/icons"
import { sqlTransaction } from "@workspace/libs/api/model"

import { Button, Flex } from "antd"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportLecturerInSurvey = ({
  query,
  surveyName,
  selectedId,
}: {
  query: any
  surveyName: string
  selectedId: string
}) => {
  const exportTemplate = async () => {
    const listSqlTransaction: any = [
      {
        model: "Lecturer",
        operation: "findMany",
        data: {
          where: { ...query },
          include: {
            survey: {
              where: {
                clusterSurveyId: selectedId,
              },
              include: {
                surveySessions: true,
                surveyQuestion: true,
                clusterSurvey: true,
                subjectClass: true,
              },
            },
            userProfile: true,
            organization: true,
          },
          orderBy: [
            {
              userProfile: {
                firstName: "asc",
              },
            },
            {
              userProfile: {
                lastName: "asc",
              },
            },
          ],
        },
      },
    ]
    const res = await sqlTransaction(listSqlTransaction)
    if (res?.status === 200) {
      const data: any = res?.data[0]

      // Tạo workbook mới
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Danh sách bài khảo sát")

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

      const centerColumns = new Set([1, 4, 5, 6, 7])

      const addBorderToRange = (
        sheet: ExcelJS.Worksheet,
        fromRow: number,
        toRow: number,
        toCol: number
      ) => {
        for (let row = fromRow; row <= toRow; row++) {
          for (let col = 1; col <= toCol; col++) {
            sheet.getCell(row, col).border = {
              top: { style: "thin", color: { argb: "FF000000" } },
              left: { style: "thin", color: { argb: "FF000000" } },
              right: { style: "thin", color: { argb: "FF000000" } },
              bottom: { style: "thin", color: { argb: "FF000000" } },
            }
          }
        }
      }

      worksheet.mergeCells("A1:C2")
      worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
      worksheet.getCell("A1").style = headerTitleStyle

      worksheet.getRow(1).height = 30
      worksheet.getRow(2).height = 30

      worksheet.mergeCells("E1:H2")
      worksheet.getCell("E1").value =
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
      worksheet.getCell("E1").style = headerTitleStyle

      worksheet.mergeCells("A4:H4")
      worksheet.getCell("A4").value = `Danh sách bài khảo sát: ${surveyName}`
      worksheet.getCell("A4").style = headerSubtitleStyle
      worksheet.getRow(4).height = 20

      // Thêm tiêu đề bảng
      const headerRow = worksheet.getRow(7)
      headerRow.values = [
        "STT",
        "Giảng viên",
        "Lớp môn học",
        "SĐT",
        "Đơn vị quản lý",
        "Ngày bắt đầu",
        "Ngày kết thúc",
      ]
      headerRow.eachCell((cell: any) => {
        cell.style = tableHeaderStyle
      })

      // Điều chỉnh độ rộng cột
      worksheet.columns = [
        { width: 10 },
        { width: 40 },
        { width: 40 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
      ]
      const dataRowCount = data?.length || 0
      if (dataRowCount > 0) {
        data.forEach((i: any, index: number) => {
          const dataRow = worksheet.getRow(8 + index)
          dataRow.values = [
            index + 1,
            `${i?.code || ""} - ${i?.userProfile?.lastName || ""} ${i?.userProfile?.firstName || ""}`,
            i?.survey?.length > 0
              ? i?.survey
                  ?.map((t: any) => `${t.subjectClass?.code || ""} - ${t.subjectClass?.name || ""}`)
                  .join("\n")
              : "",
            i?.userProfile?.phoneNumber || "",
            i?.organization?.sMa || "",
            i?.survey[0]?.startDate ? dayjs(i?.survey[0]?.startDate).format("DD/MM/YYYY") : "",
            i?.survey[0]?.endDate ? dayjs(i?.survey[0]?.endDate).format("DD/MM/YYYY") : "",
          ]
          dataRow.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            cell.font = { ...golbalFontStyle, size: 14 }
            cell.alignment = {
              horizontal: centerColumns.has(colNumber) ? "center" : "left",
              vertical: "middle",
              wrapText: true,
            }
          })
        })
      }
      addBorderToRange(worksheet, 7, 7 + dataRowCount, 7)

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), "danh_sach_giang_vien_khao_sat.xlsx")
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

export default ExportLecturerInSurvey
