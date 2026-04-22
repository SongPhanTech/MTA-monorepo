import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { PaymentStatus, ThesisType } from "@workspace/db/client"
import {
  useCountPaymentRecord,
  useDeletePaymentRecord,
  useFindManyPaymentRecord,
  useFindManyThesisSession,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useSemesterStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Form, Select } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTrainingObjectTypeStore } from "@workspace/ui"

interface ThesisProjectForm {
  thesisSessionId: string
  fixedClassId: string[]
  organizationId: string
  topicEntryDeadline?: ReturnType<typeof dayjs>
  councilDeadline?: ReturnType<typeof dayjs>
}

export default function PaymentRecordPage() {
  const { can, canSome } = useAbility()
  const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
    usePaymentStatusOptions()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { id: semesterId } = useSemesterStore()
  const [filters, setFilters] = useState<FilterProps>({
    name: undefined,
    transactionCode: undefined,
    paymentStatus: undefined,
    paymentDate: undefined,
    role: undefined,
  })
  const [searchParams, setSearchParams] = useState<Partial<ThesisProjectForm>>({})
  const { id: trainingObjectId } = useTrainingObjectTypeStore()
  const [trainingCourseId, setTrainingCourseId] = useState<string | null>(null)
  const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])

  const where = useMemo(
    () => ({
      ...(searchParams.thesisSessionId
        ? {
            councilMember: {
              council: {
                thesis: {
                  some: {
                    thesisType: ThesisType.THESIS,
                    thesisSessionId: searchParams.thesisSessionId,
                  },
                },
              },
            },
          }
        : { id: { in: [] } }),
      ...(filters.transactionCode
        ? {
            transactionCode: {
              contains: filters.transactionCode,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name
        ? {
            councilMember: {
              expert: {
                name: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
      ...(filters.paymentStatus
        ? Array.isArray(filters.paymentStatus)
          ? { status: { in: filters.paymentStatus } }
          : { status: { equals: filters.paymentStatus } }
        : {}),
      ...(filters.paymentDate?.length === 2
        ? {
            paymentDate: {
              gte: dayjs(filters.paymentDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.paymentDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }),
    [
      searchParams.thesisSessionId,
      filters.name,
      filters.transactionCode,
      filters.paymentStatus,
      filters.paymentDate,
    ]
  )

  const { data: thesisSessionData } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    where: {
      trainingObjectTypeId: trainingObjectId,
    },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
  })

  const { data: paymentRecordData } = useFindManyPaymentRecord({
    where: {
      ...where,
    },
    include: {
      councilMember: {
        include: {
          expert: true,
          council: {
            include: {
              thesis: {
                where: {
                  thesisType: ThesisType.THESIS,
                  ...(searchParams.thesisSessionId && {
                    thesisSessionId: searchParams.thesisSessionId,
                  }),
                },
                include: {
                  subjectClass: true,
                },
              },
            },
          },
        },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
    orderBy: { createdAt: "desc" },
  })

  const { data: count } = useCountPaymentRecord({
    where: {
      ...where,
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: openPaymentRecord } = useDisclosure<{
    paymentRecordId?: string
    thesisSessionId?: string
  }>({
    tag: "PutPaymentRecordDetail",
  })

  const { onOpen: openUpdatePaymentStatus, isOpen } = useDisclosure<{
    paymentRecordIds: string[]
  }>({
    tag: "PutUpdatePaymentStatus",
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedRowKeys([])
    }
  }, [isOpen])

  const { mutateAsync: deletePaymentRecord } = useDeletePaymentRecord()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await deletePaymentRecord({
        where: {
          id,
        },
      })
      message.success("Xóa thành công")
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

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[0, 16]} align="middle" justify="space-between">
            <Col>
              <Form.Item name="thesisSessionId" label="Đợt xét" required className="mb-0">
                <Select
                  className="w-36"
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 300 }}
                  options={thesisSessionData?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={(value) => {
                    setSearchParams({
                      ...searchParams,
                      thesisSessionId: value as string,
                    })
                    setTrainingCourseId(
                      thesisSessionData?.find((x) => x.id === value)?.trainingCourse?.id || null
                    )
                    setCurrentPage(1)
                    setEditingRowKeys([])
                  }}
                  placeholder="Chọn đợt xét"
                />
              </Form.Item>
            </Col>
            <Col>
              <Flex justify="end" gap={4}>
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
                  "THEM"
                ) && (
                  <Button
                    onClick={() =>
                      openUpdatePaymentStatus({
                        paymentRecordIds: selectedRowKeys as string[],
                      })
                    }
                    disabled={selectedRowKeys.length === 0}
                    type="primary"
                  >
                    Cập nhật trạng thái
                  </Button>
                )}
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
                  "THEM"
                ) && (
                  <Button
                    onClick={() =>
                      openPaymentRecord({
                        paymentRecordId: undefined,
                        thesisSessionId: searchParams.thesisSessionId,
                      })
                    }
                    disabled={!searchParams.thesisSessionId}
                    type="primary"
                  >
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="payment-record"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={paymentRecordData}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record) => {
                return {
                  disabled: record.status === PaymentStatus.PAID,
                  style: record.status === PaymentStatus.PAID ? { display: "none" } : {},
                }
              },
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
                title: "Tên chuyên gia",
                dataIndex: "name",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) => record.councilMember?.expert?.name ?? "-",
              },
              {
                title: "Mã giao dịch",
                dataIndex: "transactionCode",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Số tiền TT",
                dataIndex: "amount",
                width: 150,
                align: "center",
                render: (record) => (record ? `${Number(record).formatVND()}` : "-"),
              },
              {
                title: "Thời gian TT",
                dataIndex: "paymentDate",
                align: "center",
                width: 150,
                type: "date",
                render: (_, record) =>
                  record?.paymentDate ? dayjs(record?.paymentDate).format("DD/MM/YYYY") : undefined,
              },
              {
                title: "Trạng thái",
                dataIndex: "paymentStatus",
                width: 150,
                align: "center",
                fixed: "right",
                type: "select",
                options: paymentStatusOptions,
                render: (_, record) => {
                  const label = getPaymentStatusLabel(record?.status)
                  const color = getPaymentStatusColor(record?.status)
                  return <Tag color={color}>{label}</Tag>
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={() => {
                              openPaymentRecord({
                                paymentRecordId: id,
                                thesisSessionId: searchParams.thesisSessionId,
                              })
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: () => handleDelete(id),
                            }}
                          />
                        )}
                      </Row>
                    )
                  }
                  return ""
                },
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

PaymentRecordPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
