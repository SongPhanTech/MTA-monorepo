import { useExamTypeOptions } from "@hooks/examType"
import type { Prisma } from "@workspace/db/client"
import { Button } from "antd"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Printer } from "lucide-react"
import { useMemo } from "react"

interface ExportTemplateExamProps {
  dataTable: Prisma.StudentSubjectScoreGetPayload<{
    include: {
      student: {
        include: {
          userProfile: true
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  scoreConverts: true
                }
              }
            }
          }
        }
      }
      subjectClass: {
        include: {
          subject: true
          semester: {
            include: {
              schoolYear: true
            }
          }
          mainLecturer: {
            include: {
              userProfile: true
            }
          }
          extraLecturer: {
            include: {
              userProfile: true
            }
          }
          enterGradeLecturer: {
            include: {
              userProfile: true
            }
          }
        }
      }
      awards: {
        include: {
          archivedAward: true
        }
      }
      certificates: {
        include: {
          archivedCertificate: true
        }
      }
    }
  }>[]
  dataClass?: Prisma.SubjectClassGetPayload<{
    select: {
      scoreDeadLineStart: true
      scoreDeadline: true
      examScoreDeadline: true
      isLockScore: true
      isLockExamScore: true
      enteredScore: true
      enteredExamScore: true
      subject: {
        select: {
          onePoint: true
          credit: true
          managementOrganization: {
            select: {
              sTen: true
            }
          }
        }
      }
      subjectClassStudent: true
      semester: {
        select: {
          name: true
          schoolYear: true
        }
      }
      code: true
      name: true
      mainLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true
            }
          }
        }
      }
      extraLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true
            }
          }
        }
      }
      examDate: true
      examType: true
    }
  }>
  disabled?: boolean
}

const ExportTemplateExam = ({ dataTable, dataClass, disabled }: ExportTemplateExamProps) => {
  const { getExamTypeLabel } = useExamTypeOptions()
  // const firstTrainingCourse = useMemo(() => {
  //     return dataClass?.subjectClassStudent?.find(({ student }: any) =>
  //         Boolean(student.fixedClass?.trainingCourse)
  //     )?.student?.fixedClass?.trainingCourse
  // }, [dataClass?.subjectClassStudent])
  const trainingCourseSame = useMemo(() => {
    if (!dataClass?.subjectClassStudent) return null

    const uniqTrainingCourse = new Set(
      dataClass.subjectClassStudent.map(
        ({ student }: any) => student?.fixedClass?.trainingCourse?.code
      )
    )

    return uniqTrainingCourse.size === 1 ? [...uniqTrainingCourse][0] : null
  }, [dataClass?.subjectClassStudent])
  const exportTemplate = async () => {
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Danh sách thi")

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
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const _headerStyleNormal = {
      font: { ...golbalFontStyle, size: 14 },
      alignment: {
        horizontal: "right" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const _headerSubtitleStyleCenter = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    }

    const _headerSubtitleStyleRight = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "right" as const,
        vertical: "middle" as const,
      },
    }

    const headerSubtitleStyleLeft = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "left" as const,
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

    const _italicTextStyle = {
      font: { ...golbalFontStyle, italic: true },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
      },
    }

    worksheet.mergeCells("A1:D2")
    worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
    worksheet.getCell("A1").style = headerTitleStyle

    worksheet.getRow(1).height = 30
    worksheet.getRow(2).height = 30

    worksheet.mergeCells("F1:L2")
    worksheet.getCell("F1").value =
      "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
    worksheet.getCell("F1").style = headerTitleStyle

    worksheet.mergeCells("A4:L4")
    worksheet.getCell("A4").value = "DANH SÁCH THI"
    worksheet.getCell("A4").style = headerTitleStyle
    worksheet.getRow(4).height = 30

    worksheet.mergeCells("A5:L5")
    worksheet.getCell("A5").value =
      `(${dataClass?.semester?.name} Năm học ${dataClass?.semester?.schoolYear?.name})`
    worksheet.getCell("A5").style = headerSubtitleStyle
    worksheet.getRow(5).height = 25

    worksheet.mergeCells("A6:B6")
    worksheet.getCell("A6").value = "Lớp học phần: "
    worksheet.getCell("A6").style = headerSubtitleStyleLeft

    worksheet.getCell("C6").value = `${dataClass?.code || ""}`
    worksheet.getCell("C6").style = headerSubtitleStyleLeft

    worksheet.mergeCells("A7:B7")
    worksheet.getCell("A7").value = "Tên học phần: "
    worksheet.getCell("A7").style = headerSubtitleStyleLeft

    worksheet.getCell("C7").value = `${dataClass?.name || ""}`
    worksheet.getCell("C7").style = headerSubtitleStyleLeft

    worksheet.mergeCells("A8:B8")
    worksheet.getCell("A8").value = "Giảng viên: "
    worksheet.getCell("A8").style = headerSubtitleStyleLeft

    worksheet.getCell("C8").value = `${
      dataClass?.mainLecturer?.userProfile?.fullname ||
      dataClass?.extraLecturer?.userProfile?.fullname ||
      ""
    }`
    worksheet.getCell("C8").style = headerSubtitleStyleLeft

    worksheet.mergeCells("A9:B9")
    // worksheet.getCell('A9').value = 'Hệ số điểm thường xuyên: '
    worksheet.getCell("A9").style = headerSubtitleStyleLeft

    // worksheet.getCell('C9').value = `${firstTrainingCourse?.coef_1 || ''}`
    worksheet.getCell("C9").style = headerSubtitleStyleLeft

    worksheet.getCell("E6").value = "Khoá: "
    worksheet.getCell("E6").style = headerSubtitleStyleLeft

    worksheet.getCell("F6").value = `${trainingCourseSame || ""}`
    worksheet.getCell("F6").style = headerSubtitleStyleLeft

    worksheet.getCell("I6").value = "Ngày thi: "
    worksheet.getCell("I6").style = headerSubtitleStyleLeft

    worksheet.getCell("J6").value = `${dayjs(dataClass?.examDate).format("DD/MM/YYYY") || ""}`
    worksheet.getCell("J6").style = headerSubtitleStyleLeft

    worksheet.getCell("E7").value = "Khoa: "
    worksheet.getCell("E7").style = headerSubtitleStyleLeft

    worksheet.getCell("F7").value = `${dataClass?.subject?.managementOrganization?.sTen || ""}`
    worksheet.getCell("F7").style = headerSubtitleStyleLeft

    worksheet.getCell("I7").value = "Số tín chỉ: "
    worksheet.getCell("I7").style = headerSubtitleStyleLeft

    worksheet.getCell("J7").value = `${dataClass?.subject?.credit || ""}`
    worksheet.getCell("J7").style = headerSubtitleStyleLeft

    worksheet.getCell("E8").value = "Quân số: "
    worksheet.getCell("E8").style = headerSubtitleStyleLeft

    worksheet.getCell("F8").value = `${dataClass?.subjectClassStudent?.length || ""}`
    worksheet.getCell("F8").style = headerSubtitleStyleLeft

    worksheet.getCell("I8").value = "Hình thức thi: "
    worksheet.getCell("I8").style = headerSubtitleStyleLeft

    worksheet.getCell("J8").value = `${getExamTypeLabel(dataClass?.examType) || ""}`
    worksheet.getCell("J8").style = headerSubtitleStyleLeft

    worksheet.mergeCells("E9:F9")
    // worksheet.getCell('E9').value = 'Hệ số điểm định kỳ: '
    worksheet.getCell("E9").style = headerSubtitleStyleLeft

    // worksheet.getCell('G9').value = `${firstTrainingCourse?.coef_2 || ''}`
    worksheet.getCell("G9").style = headerSubtitleStyleLeft

    // worksheet.getCell('I9').value = 'Hệ số điểm thi: '
    worksheet.getCell("I9").style = headerSubtitleStyleLeft

    // worksheet.getCell('J9').value = `${firstTrainingCourse?.coef_3 || ''}`
    worksheet.getCell("J9").style = headerSubtitleStyleLeft

    // Thêm tiêu đề bảng
    const headerRow = worksheet.getRow(11)
    headerRow.values = [
      "TT",
      "Mã định danh",
      "Họ tên",
      "Ngày sinh",
      "Lớp",
      "Điểm C.cần",
      "Điểm T.xuyên",
      "Điểm thi",
      "Đề",
      "Số tờ",
      "Ký nhận",
      "Ghi chú",
    ]
    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    dataTable.forEach((record, index) => {
      const row = worksheet.getRow(12 + index)
      const note = (() => {
        const statusTexts = []

        if (record.examPostponed) statusTexts.push("Hoãn thi")
        if (record.exempted) statusTexts.push("Miễn học")
        if (record.withdrew) statusTexts.push("Rút khỏi")
        if (record.examBanned) statusTexts.push("Cấm thi")
        if (record.suspended) statusTexts.push("Đình chỉ")

        return statusTexts.length > 0 ? statusTexts.join(", ") : null
      })()
      row.values = [
        index + 1,
        record?.student?.userProfile?.code || "",
        `${record.student?.userProfile?.fullname || ""}`,
        record.student?.userProfile?.dateOfBirth
          ? new Date(record.student.userProfile.dateOfBirth).toLocaleDateString("vi-VN")
          : "",
        record.student?.fixedClass?.code || "",
        record.attendanceScore || "0",
        record.midtermScore || "0",
        "",
        "", // Đề
        "", // Số tờ
        "", // Ký nhận
        note || "", // Ghi chú
      ]

      row.eachCell((cell: ExcelJS.Cell) => {
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

    // Điều chỉnh độ rộng cột
    worksheet.columns = [
      { width: 10 },
      { width: 20 },
      { width: 40 },
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ]

    const dataRowCount = dataTable.length
    const footerStartRow = 13 + dataRowCount + 1

    worksheet.mergeCells(`A${footerStartRow}:L${footerStartRow}`)
    worksheet.getCell(`A${footerStartRow}`).value = "Tổng số bài:"
    worksheet.getCell(`A${footerStartRow}`).style = headerSubtitleStyleLeft

    worksheet.mergeCells(`A${footerStartRow + 1}:L${footerStartRow + 1}`)
    worksheet.getCell(`A${footerStartRow + 1}`).value = "Tổng số tờ:"
    worksheet.getCell(`A${footerStartRow + 1}`).style = headerSubtitleStyleLeft

    worksheet.mergeCells(`A${footerStartRow + 2}:L${footerStartRow + 2}`)
    worksheet.getCell(`A${footerStartRow + 2}`).value = "Nhận xét tình hình thi:"
    worksheet.getCell(`A${footerStartRow + 2}`).style = headerSubtitleStyleLeft

    worksheet.mergeCells(`A${footerStartRow + 4}:F${footerStartRow + 4}`)
    worksheet.getCell(`A${footerStartRow + 4}`).value = "CÁN BỘ COI THI 1"
    worksheet.getCell(`A${footerStartRow + 4}`).style = headerSubtitleStyle

    worksheet.mergeCells(`G${footerStartRow + 4}:L${footerStartRow + 4}`)
    worksheet.getCell(`G${footerStartRow + 4}`).value = "CÁN BỘ COI THI 2"
    worksheet.getCell(`G${footerStartRow + 4}`).style = headerSubtitleStyle

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Phieu_danh_sach_thi_lop_${dataClass?.name || "unknown"}.xlsx`)
  }

  return (
    <Button onClick={exportTemplate} disabled={disabled}>
      <Printer />
      Xuất phiếu danh sách thi
    </Button>
  )
}

export default ExportTemplateExam
