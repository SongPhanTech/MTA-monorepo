import { DownloadOutlined } from "@ant-design/icons"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Flex } from "antd"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const ExportStudentToanDot = ({
  query,
  selectedId,
  clusterName,
}: {
  query: any
  selectedId: string
  clusterName?: string
}) => {
  const checkStatus = (record: any) => {
    if (record?.student?.userProfile?.surveySession?.length > 0) {
      const result = record?.student?.userProfile?.surveySession?.find(
        (item: any) => item?.survey?.subjectClassId === record?.subjectClassId
      )
      if (result) {
        return result
      }
    }
    return null
  }
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

    const listSqlTransaction: any = [
      {
        model: "SubjectClass",
        operation: "findMany",
        data: {
          where: { ...query },
          include: {
            mainLecturer: {
              include: {
                userProfile: true,
              },
            },
            subjectClassStudent: {
              include: {
                student: {
                  include: {
                    userProfile: {
                      include: {
                        surveySession: {
                          where: {
                            survey: {
                              clusterSurveyId: selectedId,
                            },
                          },
                          include: {
                            survey: true,
                          },
                        },
                      },
                    },
                    fixedClass: {
                      include: {
                        trainingCourse: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    ]
    const res = await sqlTransaction(listSqlTransaction)

    if (res?.status === 200 && res?.data?.length > 0) {
      const data: any = res?.data[0]
      const workbook = new ExcelJS.Workbook()

      data.forEach(async (item: any, sheetIndex: number) => {
        // Excel giới hạn tên sheet <= 31 ký tự, cấm các ký tự : \ / ? * [ ] và không được trùng
        const rawName = `${sheetIndex + 1}. ${item.code} - ${item.name}`
        const sheetName = rawName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31)
        // Tạo workbook mới
        const worksheet = workbook.addWorksheet(sheetName)

        worksheet.mergeCells("A1:D2")
        worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
        worksheet.getCell("A1").style = headerTitleStyle

        worksheet.getRow(1).height = 30
        worksheet.getRow(2).height = 30

        worksheet.mergeCells("F1:I2")
        worksheet.getCell("F1").value =
          "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
        worksheet.getCell("F1").style = headerTitleStyle

        worksheet.mergeCells("A4:I4")
        worksheet.getCell("A4").value = `DANH SÁCH NGƯỜI LÀM KHẢO SÁT: ${clusterName || ""}`
        worksheet.getCell("A4").style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        worksheet.getCell("D6").value = "Lớp môn học:"
        worksheet.getCell("D6").style = headerTitleStyle
        worksheet.mergeCells("E6:F6")
        worksheet.getCell("E6").value = `${item.code} - ${item.name}`

        worksheet.getCell("E6").style = headerTitleStyle
        // Thêm tiêu đề bảng
        const headerRow = worksheet.getRow(11)
        headerRow.values = [
          "STT",
          "Mã học viên",
          "Họ và tên",
          "Ngày sinh",
          "CCCD",
          "SĐT",
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
          { width: 40 },
          { width: 20 },
          { width: 20 },
          { width: 20 },
          { width: 30 },
          { width: 30 },
          { width: 20 },
        ]

        if (item?.subjectClassStudent?.length > 0) {
          item?.subjectClassStudent.forEach(async (i: any, index: number) => {
            const headerRowValue: any = worksheet.getRow(12 + index)
            headerRowValue.values = [
              index + 1,
              i?.student?.code || "",
              `${i?.student?.userProfile?.lastName || ""} ${i?.student?.userProfile?.firstName || ""}`,
              i?.student?.userProfile?.dateOfBirth
                ? dayjs(i?.student?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                : "",
              i?.student?.userProfile?.idCardNumber || "",
              i?.student?.userProfile?.phoneNumber || "",
              i?.student ? `${i?.student?.fixedClass?.code || ""}` : "",
              i?.student ? `${i?.student?.fixedClass?.trainingCourse?.name || ""}` : "",
              checkStatus(i) ? "Đã làm" : "Chưa làm",
            ]
          })
        }
      })
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), `danh_sach_nguoi_lam_khao_sat${clusterName || ""}.xlsx`)
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

export default ExportStudentToanDot
