import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useDiplomaVerificationStatusOptions } from "@hooks/diplomaVerificationStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  type DiplomaVerificationApplication,
  DiplomaVerificationStatus,
} from "@workspace/db/client"
import {
  useCountDiplomaVerificationApplication,
  useFindManyDiplomaVerificationApplication,
  useUpdateDiplomaVerificationApplication,
} from "@workspace/db/hooks"
import { exportDiplomaVerification } from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Form, message, Popover, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import saveAs from "file-saver"
import { FileSearch } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function QLDONDANGKY() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const {
    diplomaVerificationStatusOptions,
    getDiplomaVerificationStatusLabel,
    getDiplomaVerificationStatusColor,
  } = useDiplomaVerificationStatusOptions()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    idCardNumber: undefined,
    dateOfBirth: undefined,
    phone: undefined,
    email: undefined,
    diplomaVerificationStatus: undefined,
    diplomaNumber: "",
    originalDiplomaNumber: "",
  })

  const [isExporting, setIsExporting] = useState(false)
  const [openExportForm, setOpenExportForm] = useState(false)
  type ExportForm = {
    startDate?: dayjs.Dayjs | null
    endDate?: dayjs.Dayjs | null
  }
  const [exportForm] = Form.useForm<ExportForm>()
  const handleExport = async (payload: ExportForm) => {
    if (!payload.startDate || !payload.endDate) return
    setIsExporting(true)
    try {
      const res = await exportDiplomaVerification({
        startDate: payload.startDate.format("YYYY-MM-DD"),
        endDate: payload.endDate.format("YYYY-MM-DD"),
      })
      if (res?.status === 200) {
        saveAs(res.data, "KET_QUA.xlsx")
      } else {
        message.error(res?.data?.message)
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      setIsExporting(false)
    }
  }

  const where = useMemo(
    () => ({
      ...(filters.name && filters.name !== ""
        ? {
            fullname: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.idCardNumber && filters.idCardNumber !== ""
        ? {
            idCardNumber: {
              contains: filters.idCardNumber,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.phone && filters.phone !== ""
        ? {
            phoneNumber: {
              contains: filters.phone,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.email && filters.email !== ""
        ? {
            email: {
              contains: filters.email,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.dateOfBirth?.length === 2
        ? {
            dateOfBirth: {
              gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.diplomaVerificationStatus
        ? Array.isArray(filters.diplomaVerificationStatus)
          ? {
              status: {
                in: filters.diplomaVerificationStatus,
              },
            }
          : {
              status: {
                equals: filters.diplomaVerificationStatus,
              },
            }
        : {}),
      ...(filters.diplomaNumber
        ? {
            diplomaNumber: {
              contains: filters.diplomaNumber,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.originalDiplomaNumber
        ? {
            originalDiplomaNumber: {
              contains: filters.originalDiplomaNumber,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }),
    [
      filters.name,
      filters.idCardNumber,
      filters.phone,
      filters.email,
      filters.dateOfBirth,
      filters.diplomaVerificationStatus,
      filters.originalDiplomaNumber,
      filters.diplomaNumber,
    ]
  )

  const { data = [], refetch } = useFindManyDiplomaVerificationApplication({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountDiplomaVerificationApplication({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateDiplomaVerificationApplication } =
    useUpdateDiplomaVerificationApplication()
  const handleUpdateInProgress = async (record: DiplomaVerificationApplication) => {
    try {
      showSpinner()
      if (
        record?.status === DiplomaVerificationStatus.IN_PROGRESS ||
        record?.status === DiplomaVerificationStatus.APPROVED
      )
        return
      await updateDiplomaVerificationApplication({
        where: { id: record?.id },
        data: { status: DiplomaVerificationStatus.IN_PROGRESS },
      })
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

  const { onOpen: onOpenModalTraCuuVanBang } = useDisclosure<{
    data: DiplomaVerificationApplication
  }>({
    tag: "ModalTraCuuVanBang",
  })

  const { onOpen: onOpenPutStatusQLTraCuuVanBang } = useDisclosure<string>({
    tag: "PutStatusQLTraCuuVanBang",
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <div className="flex justify-end">
            <Popover
              content={
                <Form
                  layout="horizontal"
                  form={exportForm}
                  initialValues={{ isOverride: false }}
                  onFinish={handleExport}
                >
                  <FormItem
                    form={exportForm}
                    name="startDate"
                    label="Từ ngày"
                    required
                    labelCol={{ span: 9 }}
                    labelAlign="left"
                  >
                    <DatePicker />
                  </FormItem>
                  <FormItem
                    form={exportForm}
                    name="endDate"
                    label="Đến ngày"
                    required
                    labelCol={{ span: 9 }}
                    className="mt-2"
                    labelAlign="left"
                  >
                    <DatePicker />
                  </FormItem>

                  <Col span={24} className="text-right mt-4">
                    <Button type="primary" htmlType="submit" loading={isExporting}>
                      Xác nhận
                    </Button>
                  </Col>
                </Form>
              }
              title="Xuất kết quả xác minh văn bằng"
              trigger="click"
              placement="bottomRight"
              open={openExportForm}
              onOpenChange={setOpenExportForm}
            >
              <Button type="primary">Xuất kết quả</Button>
            </Popover>
          </div>
          <Table
            rowKey="id"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Họ và tên",
                dataIndex: "name",
                width: 200,
                align: "center",
                fixed: "left",
                type: "input",
                render: (_, record) => record?.fullname,
              },
              {
                title: "Căn cước công dân",
                dataIndex: "idCardNumber",
                width: 170,
                align: "center",
                type: "input",
              },
              {
                title: "Ngày sinh",
                dataIndex: "dateOfBirth",
                width: 150,
                align: "center",
                type: "date",
                render: (_, record) =>
                  record?.dateOfBirth && dayjs(record?.dateOfBirth).format("DD/MM/YYYY"),
              },
              {
                title: "Số điện thoại",
                dataIndex: "phone",
                width: 150,
                align: "center",
                type: "input",
                render: (_, record) => record?.phoneNumber,
              },
              {
                title: "Email",
                dataIndex: "email",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Số hiệu văn bằng",
                dataIndex: "diplomaNumber",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Số vào sổ gốc văn bằng",
                dataIndex: "originalDiplomaNumber",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Chuyên ngành đào tạo",
                dataIndex: "trainingMajor",
                width: 200,
                align: "center",
              },
              {
                title: "Bậc đào đạo",
                dataIndex: "trainingLevel",
                width: 200,
                align: "center",
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "trainingForm",
                width: 200,
                align: "center",
              },
              {
                title: "Xếp loại tốt nghiệp",
                dataIndex: "classification",
                width: 200,
                align: "center",
              },
              {
                title: "Năm khoá học bắt đầu",
                dataIndex: "trainingCourseStartYear",
                width: 200,
                align: "center",
              },
              {
                title: "Năm khoá học kết thúc",
                dataIndex: "trainingCourseEndYear",
                width: 200,
                align: "center",
              },
              {
                title: "Ngày cấp bằng",
                dataIndex: "diplomaIssueDate",
                width: 150,
                align: "center",
                render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Lý do nộp đơn",
                dataIndex: "reason",
                width: 200,
                align: "center",
              },
              {
                title: "Trạng thái",
                dataIndex: "diplomaVerificationStatus",
                align: "center",
                fixed: "right",
                width: 150,
                type: "select",
                options: diplomaVerificationStatusOptions,
                render: (__, record) => {
                  return (
                    <Tag color={getDiplomaVerificationStatusColor(record?.status)}>
                      {getDiplomaVerificationStatusLabel(record?.status)}
                    </Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_QL_DON_DANG_KY_XAC_MINH,
                  "SUA"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    const rec = record as Exclude<typeof record, any>
                    return (
                      <Row className="justify-center gap-2">
                        <Tooltip title={"Tra cứu"} placement="top">
                          <FileSearch
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateInProgress(rec)
                              onOpenModalTraCuuVanBang({
                                data: rec,
                              })
                            }}
                            size={16}
                            strokeWidth={1.5}
                          />
                        </Tooltip>
                        <EditIcon
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenPutStatusQLTraCuuVanBang(record.id)
                          }}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            data={data}
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

QLDONDANGKY.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
