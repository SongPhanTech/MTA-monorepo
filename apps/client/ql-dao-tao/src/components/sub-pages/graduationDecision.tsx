import { ClipboardButton } from "@components/commons/clipboard"
import FormItem from "@components/commons/form-item"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import { ApplicationStatus, type Prisma } from "@workspace/db/client"
import {
  useCountGraduationDecision,
  useDeleteGraduationDecision,
  useFindManyDiplomaType,
  useFindManyGraduationDecision,
  useUpdateStudentGraduationApplication,
} from "@workspace/db/hooks"
import type { GenerateDiplomaNumberBody } from "@workspace/libs/api/schemas"
import {
  exportGraduationDecisionPptx,
  generateDiplomaNumber,
  getDanhSachTotNghiepData,
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
import { BookCheckIcon, Download, FileDown, Presentation, Sheet } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { removeVietnameseTones } from "@/utils/removeVietnamese"
import { formatDate } from "@lib/utils"
import { docxTemplate } from "@/utils/docx-template"

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
          sheet: id ? `${id}` : `sheet_${index + 1}`, // 🟢 tránh undefined
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
    dataStudent: any
  }>({
    tag: "ModalPrintToKQHT",
  })

  const handleExportDanhSachTN = async () => {
    try {
      showSpinner()
      const res = await getDanhSachTotNghiepData({ sessionId })
      if (res.status !== 200) {
        message.error(res.data?.message || "Không lấy được dữ liệu danh sách")
        return
      }

      const { data } = res.data
      const exportRes = await docxTemplate({
        fileName: "Danh_sach_cong_nhan_tot_nghiep.docx",
        path: "DS_HV_TN.docx",
        prefix: "/mta/template",
        data: data,
      })

      if (exportRes && exportRes.status >= 200 && exportRes.status < 300) {
        saveAs(exportRes.data, "Phu_luc_IX.docx")
      } else {
        message.error(`Xuất file thất bại: Status ${exportRes?.status}`)
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi xuất file, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

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
          <Button type="primary" onClick={handleExportDanhSachTN}>
            <Download />
            Xuất danh sách công nhận tốt nghiệp
          </Button>
          <Button
            type="primary"
            onClick={() => handleExportTemplate()}
            loading={isExportingTemplate}
          >
            <FileDown />
            Xuất mẫu in văn bằng
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
                          onOpenPhuLucVanBang({
                            dataStudent: record?.student,
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
