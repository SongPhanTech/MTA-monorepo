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
  useCountSupervisorPaymentRecord,
  useDeleteSupervisorPaymentRecord,
  useFindManySupervisorPaymentRecord,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useSemesterStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function SupervisorPaymentRecordPage() {
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

  const thesisCondition = {
    some: { thesisType: ThesisType.THESIS },
  }

  const where = useMemo(
    () => ({
      OR: [{ thesisProjects: thesisCondition }, { coThesisProjects: thesisCondition }],
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
            thesisProjects: {
              some: {
                supervisor: {
                  name: {
                    contains: filters.name,
                    mode: "insensitive" as const,
                  },
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
      ...(semesterId
        ? {
            councilMember: {
              council: {
                thesis: {
                  some: { subjectClass: { semesterId } },
                },
              },
            },
          }
        : {}),
    }),
    [filters.name, filters.transactionCode, filters.paymentStatus, filters.paymentDate, semesterId]
  )

  const { data: supervisorPaymentData } = useFindManySupervisorPaymentRecord({
    where: {
      ...where,
    },
    include: {
      thesisProjects: {
        include: {
          supervisor: true,
        },
      },
      coThesisProjects: {
        include: {
          coSupervisor: true,
        },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountSupervisorPaymentRecord({
    where: {
      ...where,

      deletedAt: null,
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: openPaymentRecord } = useDisclosure<{ paymentRecordId: string }>({
    tag: "PutSupervisorPaymentRecord",
  })

  const { onOpen: openUpdatePaymentStatus, isOpen } = useDisclosure<{
    paymentRecordIds: string[]
    isSupervisor: boolean
  }>({
    tag: "PutUpdatePaymentStatus",
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedRowKeys([])
    }
  }, [isOpen])

  const { mutateAsync: deletePaymentRecord } = useDeleteSupervisorPaymentRecord()
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
          <Row gutter={[0, 16]} align="top" justify="space-between">
            <Col>
              <Flex justify="end" gap={4}>
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
                  "SUA"
                ) && (
                  <Button
                    onClick={() =>
                      openUpdatePaymentStatus({
                        paymentRecordIds: selectedRowKeys as string[],
                        isSupervisor: true,
                      })
                    }
                    disabled={selectedRowKeys.length === 0}
                    type="primary"
                  >
                    Cập nhật trạng thái
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
            data={supervisorPaymentData}
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Tên chuyên gia",
                dataIndex: "name",
                width: 250,
                type: "input",
                align: "center",
                render: (_, record) => {
                  const supervisorNames =
                    record.thesisProjects?.map((p: any) => p.supervisor?.name) || []

                  const coSupervisorNames =
                    record.coThesisProjects?.map((p: any) => p.coSupervisor?.name) || []

                  const allNames = [...supervisorNames, ...coSupervisorNames]

                  return Array.from(new Set(allNames.filter(Boolean))).join(", ")
                },
              },
              {
                title: "Đề tài",
                dataIndex: "title",
                width: 250,
                type: "input",
                align: "center",
                render: (_, record) =>
                  record.thesisProjects?.[0]?.title || record.coThesisProjects?.[0]?.title,
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
                  record?.paymentDate ? dayjs(record?.paymentDate).format("DD/MM/YYYY") : "-",
              },
              {
                title: "Trạng thái",
                dataIndex: "paymentStatus",
                width: 150,
                align: "center",
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
                  "THEM"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={() => {
                              openPaymentRecord({
                                paymentRecordId: id,
                              })
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
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

SupervisorPaymentRecordPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
