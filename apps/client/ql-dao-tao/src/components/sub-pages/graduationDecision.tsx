import { ClipboardButton } from "@components/commons/clipboard"
import FormItem from "@components/commons/form-item"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import { $Enums } from "@workspace/db"
import { ApplicationStatus, type Prisma } from "@workspace/db/client"
import {
  useCountGraduationDecision,
  useDeleteGraduationDecision,
  useFindManyDiplomaType,
  useFindManyGraduationDecision,
  useFindManySemester,
  useUpdateStudentGraduationApplication,
} from "@workspace/db/hooks"
import type { GenerateDiplomaNumberBody } from "@workspace/libs/api/schemas"
import {
  exportGraduationDecisionPptx,
  generateDiplomaNumber,
  graduationSessionDecision,
} from "@workspace/libs/api/training"
import { exportFromTemplate } from "@workspace/libs/template-excel"
import { genOriginalDiplomaNumber, getMinioUrl } from "@workspace/libs/utils"
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popover,
  Row,
  Switch,
  Tooltip,
} from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { BookCheckIcon, FileDown, Presentation, Sheet } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { removeVietnameseTones } from "@/utils/removeVietnamese"
import { formatDate } from "@lib/utils"
import ExcelJS from "exceljs"
interface GraduationDecisionProps {
  sessionId: string
}

const classificationCategory: Record<string, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Khá",
  MEDIUM: "TB Khá",
  AVERAGE: "Trung bình",
  POOR: "Yếu",
  VERY_POOR: "Kém",
}

export default function GraduationDecision({ sessionId }: GraduationDecisionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [student, setStudent] = useState<any>(null)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    decisionDate: undefined,
    finalGpa: undefined,
    diplomaNumber: "",
    originalDiplomaNumber: "",
    diplomaIssueDate: undefined,
    classification: "",
    diplomaTypeId: undefined,
  })

  const isFiltering = useMemo(() => {
    return Object.values(filters).some((value) => !!value)
  }, [filters])
  const [isExportingPhuLucTemplate, setIsExportingPhuLucTemplate] = useState(false)
  const where: Prisma.GraduationDecisionWhereInput = useMemo(() => {
    if (!isFiltering) {
      return {
        application: { sessionId },
        deletedAt: null,
      }
    }

    return {
      deletedAt: null,
      application: {
        sessionId,
      },

      ...(filters.originalDiplomaNumber && {
        originalDiplomaNumber: {
          contains: filters.originalDiplomaNumber,
          mode: "insensitive",
        },
      }),

      ...(filters.diplomaNumber && {
        diplomaNumber: {
          contains: filters.diplomaNumber,
          mode: "insensitive",
        },
      }),

      ...(filters.diplomaIssueDate && {
        diplomaIssueDate: {
          gte: formatDate(filters.diplomaIssueDate[0], "Day"),
          lte: formatDate(filters.diplomaIssueDate[1], "Day"),
        },
      }),

      diplomaType: {
        ...(filters.diplomaTypeId &&
          filters?.diplomaTypeId?.length > 0 && {
            id: { in: filters.diplomaTypeId },
          }),
      },

      ...(filters.decisionDate && {
        decisionDate: {
          gte: formatDate(filters.decisionDate[0], "Day"),
          lte: formatDate(filters.decisionDate[1], "Day"),
        },
      }),

      finalRanking: {
        ...(filters.classification && {
          classification: {
            in: [...filters.classification],
          },
        }),
      },

      student: {
        ...(filters.code && {
          code: {
            contains: filters.code,
            mode: "insensitive",
          },
        }),

        userProfile: {
          ...(filters.name && {
            fullname: {
              contains: filters.name,
              mode: "insensitive",
            },
          }),
        },

        fixedClass: {
          ...(filters.fixedClassName && {
            name: {
              contains: filters.fixedClassName,
              mode: "insensitive",
            },
          }),

          ...(filters.fixedClassCode && {
            code: {
              contains: filters.fixedClassCode,
              mode: "insensitive",
            },
          }),
        },
      },
    }
  }, [sessionId, filters, isFiltering])

  const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
  const {
    data,
    refetch,
    isFetching: isFetchingGraduationDecision,
    isLoading: isLoadingGraduationDecision,
  } = useFindManyGraduationDecision({
    where,
    include: {
      diplomaType: true,
      application: true,
      trainingMajor: {
        include: {
          trainingField: {
            select: {
              name: true,
              englishName: true,
            },
          },
        },
      },
      finalRanking: true,
      student: {
        include: {
          userProfile: {
            include: {
              gender: true,
              ethnicity: true,
              newProvinceHometown: true,
            },
          },
          curriculumVersion: {
            include: {
              diplomaType: true,
            },
          },
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  scoreConverts: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { finalGpa: filters.finalGpa },
      { originalDiplomaNumber: "asc" },
      { student: { userProfile: { firstName: "asc" } } },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })
  const handleExportPhuLucTemplate = async () => {
    setIsExportingPhuLucTemplate(true)
    try {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet("PhuLucVanBang")
      const FONT = "Times New Roman"

      ws.columns = [
        { width: 6 }, // A - STT
        { width: 38 }, // B - Tên học phần
        { width: 9 }, // C - Số tín chỉ
        { width: 12 }, // D - Điểm 10
        { width: 12 }, // E - Điểm 4
        { width: 12 }, // F - Điểm chữ
      ]

      const thin: ExcelJS.BorderStyle = "thin"
      const border = {
        top: { style: thin },
        left: { style: thin },
        bottom: { style: thin },
        right: { style: thin },
      }
      const center: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" }
      const middle: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" }

      let r = 1

      ws.mergeCells(`A${r}:C${r}`)
      const c1 = ws.getCell(`A${r}`)
      c1.value = "BỘ QUỐC PHÒNG"
      c1.font = { name: FONT, size: 11 }
      c1.alignment = center

      ws.mergeCells(`D${r}:F${r}`)
      const c2 = ws.getCell(`D${r}`)
      c2.value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"
      c2.font = { name: FONT, size: 11, bold: true }
      c2.alignment = center
      r++

      ws.mergeCells(`A${r}:C${r}`)
      const c3 = ws.getCell(`A${r}`)
      c3.value = "HỌC VIỆN KỸ THUẬT QUÂN SỰ"
      c3.font = { name: FONT, size: 11, bold: true }
      c3.alignment = center

      ws.mergeCells(`D${r}:F${r}`)
      const c4 = ws.getCell(`D${r}`)
      c4.value = "Độc lập - Tự do - Hạnh phúc"
      c4.font = { name: FONT, size: 11, italic: true }
      c4.alignment = center
      r++

      ws.getRow(r).height = 4
      r++

      ws.mergeCells(`A${r}:F${r}`)
      const title = ws.getCell(`A${r}`)
      title.value = "PHỤ LỤC VĂN BẰNG"
      title.font = { name: FONT, size: 14, bold: true }
      title.alignment = center
      ws.getRow(r).height = 26
      r++

      ws.mergeCells(`A${r}:F${r}`)
      ws.getCell(`A${r}`).value = "(Kèm theo bằng tốt nghiệp số hiệu ...)"
      ws.getCell(`A${r}`).font = { name: FONT, size: 10, italic: true }
      ws.getCell(`A${r}`).alignment = center
      r += 2

      const infoLeft = [
        "Họ và tên:",
        "Mã sinh viên:",
        "Ngôn ngữ đào tạo:",
        "Ngành đào tạo:",
        "Chuyên ngành:",
      ]
      const infoRight = [
        "Ngày sinh:",
        "Năm nhập học:",
        "Thời gian đào tạo:",
        "Bậc đào tạo:",
        "Hình thức đào tạo:",
      ]

      for (let i = 0; i < infoLeft.length; i++) {
        ws.getRow(r).height = 18

        ws.getCell(`A${r}`).value = infoLeft[i]
        ws.getCell(`A${r}`).font = { name: FONT, size: 10, color: { argb: "FF656565" } }
        ws.getCell(`A${r}`).alignment = middle

        ws.mergeCells(`B${r}:C${r}`)
        ws.getCell(`B${r}`).border = { bottom: { style: thin } }

        ws.getCell(`D${r}`).value = infoRight[i]
        ws.getCell(`D${r}`).font = { name: FONT, size: 10, color: { argb: "FF656565" } }
        ws.getCell(`D${r}`).alignment = middle

        ws.mergeCells(`E${r}:F${r}`)
        ws.getCell(`E${r}`).border = { bottom: { style: thin } }

        r++
      }
      r++

      ws.getRow(r).height = 22
      const gray = {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFD9D9D9" },
      }

      ws.mergeCells(`A${r}:A${r + 1}`)
      const hTT = ws.getCell(`A${r}`)
      hTT.value = "TT"
      hTT.font = { name: FONT, bold: true, size: 10 }
      hTT.alignment = center
      hTT.border = border
      hTT.fill = gray

      ws.mergeCells(`B${r}:B${r + 1}`)
      const hTen = ws.getCell(`B${r}`)
      hTen.value = "Tên học phần"
      hTen.font = { name: FONT, bold: true, size: 10 }
      hTen.alignment = center
      hTen.border = border
      hTen.fill = gray

      ws.mergeCells(`C${r}:C${r + 1}`)
      const hTC = ws.getCell(`C${r}`)
      hTC.value = "Số tín chỉ"
      hTC.font = { name: FONT, bold: true, size: 10 }
      hTC.alignment = center
      hTC.border = border
      hTC.fill = gray

      ws.mergeCells(`D${r}:F${r}`)
      const hDiem = ws.getCell(`D${r}`)
      hDiem.value = "Điểm học phần"
      hDiem.font = { name: FONT, bold: true, size: 10 }
      hDiem.alignment = center
      hDiem.border = border
      hDiem.fill = gray
      r++

      ws.getRow(r).height = 32
      ;["D", "E", "F"].forEach((col, idx) => {
        const labels = ["Thang điểm 10", "Thang điểm 4", "Thang điểm chữ"]
        const cell = ws.getCell(`${col}${r}`)
        cell.value = labels[idx]
        cell.font = { name: FONT, bold: true, size: 10 }
        cell.alignment = { ...center, wrapText: true }
        cell.border = border
        cell.fill = gray
      })
      r++

      for (let i = 1; i <= 15; i++) {
        ws.getRow(r).height = 18
        ;["A", "B", "C", "D", "E", "F"].forEach((col) => {
          const cell = ws.getCell(`${col}${r}`)
          cell.value = col === "A" ? i : ""
          cell.font = { name: FONT, size: 10 }
          cell.alignment = col === "A" ? center : middle
          cell.border = border
        })
        r++
      }

      ws.mergeCells(`A${r}:F${r}`)
      const gradRow = ws.getCell(`A${r}`)
      gradRow.value = "Học phần tốt nghiệp"
      gradRow.font = { name: FONT, bold: true, size: 10 }
      gradRow.alignment = middle
      gradRow.border = border
      gradRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } }
      r++

      for (let i = 0; i < 3; i++) {
        ws.getRow(r).height = 18
        ;["A", "B", "C", "D", "E", "F"].forEach((col) => {
          ws.getCell(`${col}${r}`).border = border
          ws.getCell(`${col}${r}`).font = { name: FONT, size: 10 }
        })
        r++
      }
      r++

      ws.mergeCells(`A${r}:F${r}`)
      ws.getCell(`A${r}`).value = "Tổng số tín chỉ: ............"
      ws.getCell(`A${r}`).font = { name: FONT, size: 10 }
      r++

      ws.mergeCells(`A${r}:F${r}`)
      ws.getCell(`A${r}`).value =
        "Điểm trung bình chung tích lũy toàn khoá (Thang điểm 4): ............"
      ws.getCell(`A${r}`).font = { name: FONT, size: 10 }
      r++

      ws.mergeCells(`A${r}:F${r}`)
      ws.getCell(`A${r}`).value = "Xếp hạng: ............"
      ws.getCell(`A${r}`).font = { name: FONT, size: 10 }
      r += 2
      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = "Hà Nội, ngày ...... tháng ...... năm ......"
      ws.getCell(`D${r}`).font = { name: FONT, size: 10, italic: true }
      ws.getCell(`D${r}`).alignment = center
      r++

      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = "TL. GIÁM ĐỐC"
      ws.getCell(`D${r}`).font = { name: FONT, size: 10, bold: true }
      ws.getCell(`D${r}`).alignment = center
      r++

      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = "Trưởng phòng đào tạo"
      ws.getCell(`D${r}`).font = { name: FONT, size: 10, bold: true }
      ws.getCell(`D${r}`).alignment = center
      r += 4

      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = "Họ tên người ký"
      ws.getCell(`D${r}`).font = { name: FONT, size: 10 }
      ws.getCell(`D${r}`).alignment = center
      r += 2
      ;[
        { text: "Ghi chú:", bold: true, italic: false },
        { text: "- Học phần có đánh dấu * là học phần tự chọn", bold: false, italic: true },
        {
          text: "- Học phần in nghiêng và học phần bổ sung kiến thức không được tính vào trung bình chung tích lũy",
          bold: false,
          italic: true,
        },
        { text: "- Hệ thống điểm được quy định theo:", bold: false, italic: true },
      ].forEach(({ text, bold, italic }) => {
        ws.mergeCells(`A${r}:F${r}`)
        ws.getCell(`A${r}`).value = text
        ws.getCell(`A${r}`).font = { name: FONT, size: 9, bold, italic }
        ws.getRow(r).height = 16
        r++
      })

      ;["Thang điểm chữ", "Thang điểm 4", "Thang điểm 10"].forEach((label) => {
        ws.getCell(`A${r}`).value = label
        ws.getCell(`A${r}`).font = { name: FONT, size: 9, bold: true }
        ws.getRow(r).height = 16
        r++
      })

      ws.mergeCells(`A${r}:F${r}`)
      ws.getCell(`A${r}`).value =
        "- Phân hạng tốt nghiệp theo thang điểm 4: ............. (Loại tốt nghiệp có thể bị hạ mức theo quy chế đào tạo đại học của HVKTQS được áp dụng tại thời điểm xét tốt nghiệp)."
      ws.getCell(`A${r}`).font = { name: FONT, size: 9, italic: true }
      ws.getCell(`A${r}`).alignment = { wrapText: true }
      ws.getRow(r).height = 28
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      saveAs(blob, "mau_phu_luc_van_bang.xlsx")
      message.success("Xuất file thành công")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setIsExportingPhuLucTemplate(false)
    }
  }
  const { data: count } = useCountGraduationDecision({ where })

  const { showSpinner, hideSpinner } = useSpinner()

  const [openGenerateOriginalNumber, setOpenGenerateOriginalNumber] = useState(false)
  const [openGenerateDiplomaNumber, setOpenGenerateDiplomaNumber] = useState(false)
  type DiplomaNumberFormType = Omit<GenerateDiplomaNumberBody, "sessionId" | "field"> & {
    sample: number
  }
  const [originalNumberForm] = Form.useForm<DiplomaNumberFormType>()
  const [diplomaNumberForm] = Form.useForm<DiplomaNumberFormType>()
  const handleGenerateDiplomaNumber = async (
    type: "originalDiplomaNumber" | "diplomaNumber",
    payload: DiplomaNumberFormType
  ) => {
    showSpinner()
    try {
      const res = await generateDiplomaNumber({ field: type, sessionId, ...payload })
      if (res?.status === 200) {
        setOpenGenerateDiplomaNumber(false)
        setOpenGenerateOriginalNumber(false)
        message.success("Tạo thành công")
        refetch()
      } else if (res?.status === 400) {
        Modal.warning({
          title: res?.data?.message,
          content: (
            <div>
              <p>Đã tồn tại: {res?.data?.existing?.join(", ")}</p>
              <div className="flex align-middle justify-between items-center">
                <p>Cần bỏ qua: {res?.data?.shouldSkip?.join(", ")}</p>
                <ClipboardButton text={res?.data?.shouldSkip?.join(", ") || ""} />
              </div>
            </div>
          ),
        })
      } else {
        message.error(res?.data?.message)
      }
    } catch (error) {
      console.log(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { onOpen } = useDisclosure<{ id: string; trainingCourseId: string }>({
    tag: "PutGraduationDecision",
  })

  const { mutateAsync: deleteGraduationDecision } = useDeleteGraduationDecision()
  const { mutateAsync: updateStudentGraduationApplication } =
    useUpdateStudentGraduationApplication()
  async function handleDeleteGraduationDecision(id: string, applicationId: string) {
    try {
      showSpinner()
      await updateStudentGraduationApplication({
        where: { id: applicationId },
        data: { status: ApplicationStatus.IN_REVIEW },
      })
      await deleteGraduationDecision({ where: { id } })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const [isExporting, setIsExporting] = useState(false)
  const handleExportResult = async () => {
    if (!sessionId) return
    setIsExporting(true)
    try {
      const res = await graduationSessionDecision({ sessionId })

      if (res.status === 200) {
        saveAs(res.data, "DANH_SACH_TOT_NGHIEP.xlsx")
      } else {
        message.error(res.data.message)
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setIsExporting(false)
    }
  }
  const [isExportingTemplate, setIsExportingTemplate] = useState(false)
  const handleExportTemplate = async () => {
    if (!sessionId || !data || data.length === 0) {
      message.warning("Không có dữ liệu để xuất mẫu in văn bằng")
      return
    }
    setIsExportingTemplate(true)

    try {
      const allSheetOptions = data.map((item, index) => {
        const { student, trainingMajor, diplomaNumber, diplomaIssueDate, id } = item
        const profile = student?.userProfile
        const dob = dayjs(profile?.dateOfBirth)
        const ngayCap = diplomaIssueDate ? dayjs(diplomaIssueDate).format("D MMMM YYYY") : ""

        return {
          sheet: id ? `${id}` : `sheet_${index + 1}`,
          tableStartCell: { row: 24, col: 1 },
          rows: [{ cells: [{ value: null, colSpan: 18, border: false }] }],
          data: {
            tennganhtienganh: trainingMajor?.trainingField?.englishName ?? "",
            tennganhtiengviet: trainingMajor?.trainingField?.name ?? "",
            tentienganh: removeVietnameseTones(profile?.fullname ?? ""),
            tentiengviet: profile?.fullname ?? "",
            ngaysinhta: dob.isValid() ? dob.locale("en").format("D MMMM YYYY") : "",
            ngaysinhtv: dob.isValid() ? dob.format("DD/MM/YYYY") : "",
            sohieuvanbang: diplomaNumber ?? "",
            thoigian: ngayCap ? `Hà Nội, ${ngayCap}` : "",
          },
        }
      })

      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/mau-in-van-bang.xlsx"),
        sheets: allSheetOptions,
        fileName: `PhoiBangTotNghiep_${dayjs().format("HH[h]mm[m]ss[s]")}`,
        mergeSheetsToOne: true,
        sheetName: "XetTotNghiep",
      })

      message.success("Xuất file thành công")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setIsExportingTemplate(false)
    }
  }

  const [isExportingPptx, setIsExportingPptx] = useState(false)
  const handleExportPptx = async () => {
    if (!sessionId) return
    setIsExportingPptx(true)
    try {
      const res = await exportGraduationDecisionPptx({ sessionId })

      if (res.status === 200) {
        saveAs(res.data, "slide_TN.pptx")
      } else {
        message.error(res.data.message)
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setIsExportingPptx(false)
    }
  }

  const { onOpen: onOpenPhuLucVanBang } = useDisclosure<{
    dataTable: any
    dataStudent: any
    sessionId?: string
  }>({
    tag: "ModalPrintToKQHT",
  })

  const { data: dataTable } = useFindManySemester(
    {
      where: {
        subjectClasses: {
          some: {
            subjectClassStudent: {
              some: {
                studentId: student?.id,
              },
            },
          },
        },
      },
      include: {
        subjectClasses: {
          where: {
            subjectClassStudent: {
              some: {
                studentId: student?.id,
              },
            },
          },
          include: {
            subjectClassStudent: {
              where: {
                studentId: student?.id,
              },
              include: {
                subjectVersion: true,
                certificates: {
                  include: {
                    archivedCertificate: true,
                  },
                },
                awards: {
                  where: {
                    status: $Enums.ArchivedCertificateStatus.APPROVED,
                  },
                  include: {
                    archivedAward: true,
                  },
                },
              },
            },
          },
        },
        trainingCoursesStart: {
          where: {
            id: student?.fixedClass?.trainingCourseId ?? undefined,
          },
          include: {
            scoreConverts: true,
          },
        },
        schoolYear: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    },
    { enabled: !!student?.id }
  )
  return (
    <div className="bg-white rounded-lg shadow-sm px-4">
      <Flex align="center" justify="space-between" className="mt-4">
        <div className="flex align-middle items-center gap-2">
          <Popover
            content={
              <Form
                layout="horizontal"
                form={originalNumberForm}
                initialValues={{ isOverride: false }}
                className="gap-2 max-w-96"
                onFinish={(payload) => {
                  handleGenerateDiplomaNumber("originalDiplomaNumber", payload)
                }}
                onValuesChange={(_, allValues) => {
                  const originalDiplomaNumber = genOriginalDiplomaNumber({
                    ...allValues,
                    currentNumber: allValues.start,
                  })
                  originalNumberForm.setFieldValue("sample", originalDiplomaNumber)
                }}
              >
                <div className="grid grid-cols-2 grid-rows-2 gap-4">
                  <FormItem form={originalNumberForm} name="prefix" label="Tiền tố">
                    <Input placeholder={`CQ/${new Date().getFullYear()}/`} />
                  </FormItem>
                  <FormItem form={originalNumberForm} name="start" label="Số từ" required>
                    <InputNumber type="number" className="ml-4" min={0} />
                  </FormItem>

                  <FormItem form={originalNumberForm} name="suffix" label="Hậu tố">
                    <Input placeholder={`/${new Date().getFullYear()}`} />
                  </FormItem>

                  <FormItem
                    form={originalNumberForm}
                    className="mb-2"
                    name="maxLength"
                    label="Độ dài số"
                  >
                    <InputNumber placeholder="4" />
                  </FormItem>

                  <FormItem form={originalNumberForm} className="mb-2" name="sample" label="Mẫu">
                    <Input readOnly bordered={false} />
                  </FormItem>

                  <FormItem
                    form={originalNumberForm}
                    className="mb-2"
                    name="rewrite"
                    label="Ghi đè số cũ"
                  >
                    <Switch className="mx-auto" defaultChecked={false} />
                  </FormItem>
                </div>
                <FormItem
                  form={originalNumberForm}
                  className="mb-2"
                  name="skip"
                  label="Giá trị bỏ qua"
                >
                  <Input className="w-full" placeholder="4" />
                </FormItem>
                <Col span={24} className="text-right mt-4">
                  <Button type="primary" htmlType="submit">
                    Xác nhận
                  </Button>
                </Col>
              </Form>
            }
            title="Tạo số vào sổ gốc"
            trigger="click"
            placement="bottomRight"
            open={openGenerateOriginalNumber}
            onOpenChange={setOpenGenerateOriginalNumber}
          >
            <Button type="primary">Tạo số vào sổ gốc</Button>
          </Popover>

          <Popover
            content={
              <Form
                layout="horizontal"
                form={diplomaNumberForm}
                initialValues={{ isOverride: false }}
                className="gap-2 max-w-96"
                onFinish={(payload) => {
                  handleGenerateDiplomaNumber("diplomaNumber", payload)
                }}
                onValuesChange={(_, allValues) => {
                  const originalDiplomaNumber = genOriginalDiplomaNumber({
                    ...allValues,
                    currentNumber: allValues.start,
                  })
                  diplomaNumberForm.setFieldValue("sample", originalDiplomaNumber)
                }}
              >
                <div className="grid grid-cols-2 grid-rows-2 gap-4">
                  <FormItem form={diplomaNumberForm} name="prefix" label="Tiền tố">
                    <Input placeholder="GV/" />
                  </FormItem>
                  <FormItem form={diplomaNumberForm} name="start" label="Số từ" required>
                    <InputNumber type="number" className="ml-4" min={0} />
                  </FormItem>

                  <FormItem form={diplomaNumberForm} name="suffix" label="Hậu tố">
                    <Input />
                  </FormItem>

                  <FormItem
                    form={diplomaNumberForm}
                    className="mb-2"
                    name="maxLength"
                    label="Độ dài số"
                  >
                    <InputNumber placeholder="6" />
                  </FormItem>

                  <FormItem form={diplomaNumberForm} className="mb-2" name="sample" label="Mẫu">
                    <Input readOnly bordered={false} />
                  </FormItem>

                  <FormItem
                    form={diplomaNumberForm}
                    className="mb-2"
                    name="rewrite"
                    label="Ghi đè số hiệu cũ"
                  >
                    <Switch className="mx-auto" defaultChecked={false} />
                  </FormItem>
                </div>
                <FormItem
                  form={diplomaNumberForm}
                  className="mb-2"
                  name="skip"
                  label="Giá trị bỏ qua"
                >
                  <Input className="w-full" placeholder="4" />
                </FormItem>
                <Col span={24} className="text-right mt-4">
                  <Button type="primary" htmlType="submit">
                    Xác nhận
                  </Button>
                </Col>
              </Form>
            }
            title="Tạo số hiệu văn bằng"
            trigger="click"
            placement="bottomRight"
            open={openGenerateDiplomaNumber}
            onOpenChange={setOpenGenerateDiplomaNumber}
          >
            <Button type="primary">Tạo số hiệu văn bằng</Button>
          </Popover>
        </div>
        <div className="flex align-middle items-center gap-2">
          <Button
            type="primary"
            onClick={() => handleExportTemplate()}
            loading={isExportingTemplate}
          >
            <FileDown />
            Xuất mẫu file phụ lục văn bằng
          </Button>
          <Button
            type="primary"
            onClick={handleExportPhuLucTemplate}
            loading={isExportingPhuLucTemplate}
          >
            <FileDown />
            Xuất phụ lục văn bằng
          </Button>
          <Button type="primary" onClick={() => handleExportResult()} loading={isExporting}>
            <Sheet />
            Xuất kết quả
          </Button>

          <Button type="primary" onClick={() => handleExportPptx()} loading={isExportingPptx}>
            <Presentation />
            Xuất slide
          </Button>
        </div>
      </Flex>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Table
            rowKey={"id"}
            loading={isLoadingGraduationDecision || isFetchingGraduationDecision}
            data={data}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 40,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã sinh viên",
                align: "center",
                dataIndex: "code",
                width: 100,
                fixed: "left",
                type: "input",
                render: (_, record) => record?.student?.code || "",
              },
              {
                title: "Họ và tên",
                width: 150,
                dataIndex: "name",
                fixed: "left",
                type: "input",
                render: (_, record) => record?.student?.userProfile?.fullname,
              },
              {
                title: "Ngày sinh",
                width: 80,
                align: "center",
                render: (_, record) =>
                  record?.student?.userProfile?.dateOfBirth
                    ? dayjs(record?.student?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Lớp",
                width: 120,
                align: "center",
                dataIndex: "fixedClassCode",
                type: "input",
                render: (_, record) => (
                  <Tooltip title={record?.student?.fixedClass?.name}>
                    {record?.student?.fixedClass?.code}
                  </Tooltip>
                ),
              },
              {
                title: "SĐT",
                width: 100,
                align: "center",
                render: (_, record) => record?.student?.userProfile?.phoneNumber,
              },
              {
                title: "Giới tính",
                dataIndex: ["student", "userProfile", "gender"],
                align: "center",
                width: 60,
                render: (_, record) => record?.student?.userProfile?.gender?.sTen,
              },
              {
                title: "Nơi sinh",
                dataIndex: ["student", "userProfile", "placeOfBirth"],
                width: 100,
                align: "center",
                render: (_, record) => record?.student?.userProfile?.newProvinceHometown?.sTen,
              },
              {
                title: "Dân tộc",
                dataIndex: "",
                width: 80,
                align: "center",
                render: (_, record) => record.student?.userProfile?.ethnicity?.sTen || "",
              },
              {
                title: "Ngày duyệt đơn",
                dataIndex: "decisionDate",
                align: "center",
                type: "date",
                width: 130,
                render: (_, record) =>
                  record.decisionDate ? dayjs(record.decisionDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "ĐTBTL",
                align: "center",
                width: 80,
                dataIndex: "finalGpa",
                type: "order",
                render: (_, record) => record?.finalGpa?.toNumber(),
              },
              {
                title: "Xếp loại",
                align: "center",
                type: "select",
                options: Object.entries(classificationCategory).map(([_, value]) => ({
                  label: value,
                  value,
                })),
                dataIndex: "classification",
                width: 100,
                render: (_, record) => record?.finalRanking?.classification,
              },
              {
                title: "Loại bằng",
                align: "center",
                type: "select",
                dataIndex: "diplomaTypeId",
                options: diplomaTypeData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                width: 100,
                render: (_, record) =>
                  record?.diplomaType?.name ||
                  record?.student?.curriculumVersion?.diplomaType?.name,
              },
              {
                title: "Số hiệu văn bằng",
                align: "center",
                dataIndex: "diplomaNumber",
                type: "input",
                width: 120,
                render: (_, record) => record?.diplomaNumber,
              },
              {
                title: "Số vào sổ gốc văn bằng",
                align: "center",
                dataIndex: "originalDiplomaNumber",
                type: "input",
                width: 120,
                render: (_, record) => record?.originalDiplomaNumber,
              },
              {
                title: "Ngày cấp bằng",
                dataIndex: "diplomaIssueDate",
                align: "center",
                type: "date",
                width: 120,
                render: (_, record) =>
                  record.diplomaIssueDate
                    ? dayjs(record.diplomaIssueDate).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Ghi chú của hội đồng",
                width: 200,
                render: (_, record) => record?.notes,
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Phụ lục văn bằng" placement="top">
                      <BookCheckIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          setStudent(record?.student)
                          onOpenPhuLucVanBang({
                            dataStudent: record?.student,
                            dataTable,
                          })
                        }}
                        size={16}
                      />
                    </Tooltip>
                    <EditIcon
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen({
                          id: record.id,
                          trainingCourseId: record?.finalRanking?.trainingCourseId,
                        })
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () =>
                          handleDeleteGraduationDecision(record.id, record.applicationId),
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    />
                  </Row>
                ),
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
