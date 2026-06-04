import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useCouncilRoleOptions } from "@hooks/councilRole"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { getSupervisorName } from "@pages/quan-ly-luan-van/dm-luan-van"
import { CouncilRole, PaymentStatus, ThesisType } from "@workspace/db/client"
import {
  useCountPaymentRecord,
  useDeletePaymentRecord,
  useFindManyPaymentRecord,
  useFindManyThesisSession,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Select, Tag } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

// const PERMISSION = QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN

function buildThesisProjectSessionFilter(thesisSessionId?: string) {
  return {
    thesisType: ThesisType.THESIS,
    ...(thesisSessionId ? { thesisSessionId } : {}),
  } as const
}

function buildCouncilThesisWhere(thesisSessionId?: string) {
  const thesisProjectWhere = buildThesisProjectSessionFilter(thesisSessionId)
  return {
    OR: [
      { thesis: { some: thesisProjectWhere } },
      {
        studentThesisRegistration: {
          is: { thesisProject: thesisProjectWhere },
        },
      },
    ],
  }
}

function getThesisProjectFromCouncil(council: any) {
  if (!council) return undefined
  if (council.thesis?.length) return council.thesis[0]
  return council.studentThesisRegistration?.thesisProject
}

function getStudentNameFromCouncil(council: any) {
  const fromRegistration = council?.studentThesisRegistration?.student?.userProfile?.fullname
  if (fromRegistration) return fromRegistration
  const project = getThesisProjectFromCouncil(council)
  const registration = project?.registrations?.[0]
  return registration?.student?.userProfile?.fullname || ""
}

export default function PaymentRecordPage() {
  const { can, canSome } = useAbility()
  const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
    usePaymentStatusOptions()
  const { councilRoleOptions, getCouncilRoleLabel } = useCouncilRoleOptions()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [thesisSessionId, setThesisSessionId] = useState<string>()
  const [filters, setFilters] = useState<FilterProps>({
    name: undefined,
    transactionCode: undefined,
    paymentStatus: undefined,
    paymentDate: undefined,
    role: undefined,
  })

  const { data: thesisSessions = [] } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  })

  const where = useMemo(() => {
    if (!thesisSessionId) {
      return { id: { in: [] as string[] } }
    }

    const councilMemberWhere: Record<string, unknown> = {
      ...buildCouncilThesisWhere(thesisSessionId),
    }

    if (filters.name) {
      councilMemberWhere.expert = {
        name: {
          contains: filters.name,
          mode: "insensitive",
        },
      }
    }

    if (filters.role) {
      councilMemberWhere.role = Array.isArray(filters.role)
        ? { in: filters.role }
        : { equals: filters.role }
    }

    return {
      councilMember: { is: councilMemberWhere },
      ...(filters.transactionCode
        ? {
            transactionCode: {
              contains: filters.transactionCode,
              mode: "insensitive" as const,
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
    }
  }, [
    thesisSessionId,
    filters.name,
    filters.transactionCode,
    filters.paymentStatus,
    filters.paymentDate,
    filters.role,
  ])

  const paymentInclude = useMemo(
    () => ({
      councilMember: {
        include: {
          expert: {
            include: {
              lecturer: { include: { userProfile: true } },
              academicDegreeType: true,
              academicRankType: true,
            },
          },
          council: {
            include: {
              thesis: {
                where: buildThesisProjectSessionFilter(thesisSessionId),
                include: {
                  thesisSession: true,
                  registrations: {
                    include: {
                      student: { include: { userProfile: true } },
                    },
                  },
                },
                take: 1,
              },
              studentThesisRegistration: {
                include: {
                  thesisProject: { include: { thesisSession: true } },
                  student: { include: { userProfile: true } },
                },
              },
            },
          },
        },
      },
    }),
    [thesisSessionId]
  )

  const { data: paymentRecordData } = useFindManyPaymentRecord(
    {
      where,
      include: paymentInclude,
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!thesisSessionId }
  )

  const { data: count } = useCountPaymentRecord(
    {
      where,
    },
    { enabled: !!thesisSessionId }
  )

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: openPaymentRecord } = useDisclosure<{ paymentRecordId: string }>({
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
        where: { id },
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

  const selectedSessionName = thesisSessions.find((s) => s.id === thesisSessionId)?.name || ""

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[0, 16]} align="middle" justify="space-between">
            <Col flex="auto">
              <Flex align="center" gap={12} wrap>
                <span className="whitespace-nowrap font-medium">Đợt xét luận văn:</span>
                <Select
                  allowClear
                  showSearch
                  placeholder="Chọn đợt xét"
                  className="min-w-[280px]"
                  optionFilterProp="label"
                  value={thesisSessionId}
                  options={thesisSessions.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  onChange={(value) => {
                    setThesisSessionId(value)
                    setCurrentPage(1)
                    setSelectedRowKeys([])
                  }}
                />
                {selectedSessionName ? (
                  <span className="text-neutral-500 text-sm">
                    Đang xem thanh toán HĐ — {selectedSessionName}
                  </span>
                ) : null}
              </Flex>
            </Col>
            <Col>
              <Flex justify="end" gap={4}>
                {/* {can(PERMISSION, "THEM") && ( */}
                <Button
                  onClick={() =>
                    openUpdatePaymentStatus({
                      paymentRecordIds: selectedRowKeys as string[],
                    })
                  }
                  disabled={selectedRowKeys.length === 0 || !thesisSessionId}
                  type="primary"
                >
                  Cập nhật trạng thái
                </Button>
                {/* )} */}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            id="payment-record-luan-van"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={thesisSessionId ? paymentRecordData : []}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled: record.status === PaymentStatus.PAID,
                style: record.status === PaymentStatus.PAID ? { display: "none" } : {},
              }),
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
                title: "Tên thành viên HĐ",
                dataIndex: "name",
                width: 200,
                type: "input",
                align: "left",
                render: (_, record) =>
                  getSupervisorName(record.councilMember?.expert, false, true) || "-",
              },
              {
                title: "Vai trò",
                dataIndex: "role",
                width: 120,
                align: "center",
                type: "select",
                options: councilRoleOptions,
                render: (_, record) =>
                  getCouncilRoleLabel(record.councilMember?.role as CouncilRole),
              },
              {
                title: "Học viên",
                width: 160,
                align: "left",
                render: (_, record) =>
                  getStudentNameFromCouncil(record.councilMember?.council) || "-",
              },
              {
                title: "Đợt xét",
                width: 180,
                align: "left",
                render: (_, record) => {
                  const project = getThesisProjectFromCouncil(record.councilMember?.council)
                  return project?.thesisSession?.name || selectedSessionName || "-"
                },
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
                width: 130,
                align: "right",
                render: (amount) => (amount != null ? `${Number(amount).formatVND()}` : "-"),
              },
              {
                title: "Thời gian TT",
                dataIndex: "paymentDate",
                align: "center",
                width: 120,
                type: "date",
                render: (_, record) =>
                  record?.paymentDate ? dayjs(record.paymentDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Trạng thái",
                dataIndex: "paymentStatus",
                width: 130,
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
                // hidden: !canSome(PERMISSION, "SUA", "XOA"),
                render: (_, { id }) => {
                  if (!id) return ""
                  return (
                    <Row className="justify-center gap-2">
                      {/* {can(PERMISSION, "SUA") && ( */}
                      <EditIcon
                        onClick={() => openPaymentRecord({ paymentRecordId: id })}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      {/* )} */}
                      {/* {can(PERMISSION, "XOA") && ( */}
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                      {/* )} */}
                    </Row>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: thesisSessionId ? count : 0,
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
