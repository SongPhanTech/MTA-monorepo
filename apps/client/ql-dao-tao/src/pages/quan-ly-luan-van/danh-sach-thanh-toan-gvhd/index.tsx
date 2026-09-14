import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { getSupervisorName } from "@pages/quan-ly-luan-van/dm-luan-van"
import { versionToPersonLike } from "@/utils/expert-select"
import type { ExpertProfileLike, PersonLike } from "@/utils/thesis-profile"
import { PaymentStatus, ThesisType } from "@workspace/db/client"
import {
  useCountSupervisorPaymentRecord,
  useDeleteSupervisorPaymentRecord,
  useFindManySupervisorPaymentRecord,
  useFindManyThesisSession,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Select, Tag } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const PERMISSION = QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN_GVHD

function buildThesisProjectSessionFilter(thesisSessionId?: string) {
  return {
    thesisType: ThesisType.THESIS,
    ...(thesisSessionId ? { thesisSessionId } : {}),
  } as const
}

function buildSupervisorPaymentSessionWhere(thesisSessionId?: string) {
  const projectWhere = buildThesisProjectSessionFilter(thesisSessionId)
  return {
    OR: [
      { thesisProjects: { some: projectWhere } },
      { coThesisProjects: { some: projectWhere } },
      { singleSupervisorPayment: { some: projectWhere } },
    ],
  }
}

const expertInclude = {
  academicRankType: true,
  academicDegreeType: true,
  expert: {
    include: {
      lecturer: {
        include: {
          userProfile: true,
          organization: true,
        },
      },
    },
  },
} as const

const thesisProjectInclude = (thesisSessionId?: string) => ({
  where: buildThesisProjectSessionFilter(thesisSessionId),
  include: {
    thesisSession: true,
    supervisor: { include: expertInclude },
    coSupervisor: { include: expertInclude },
    registrations: {
      take: 1,
      include: {
        student: { include: { userProfile: true } },
      },
    },
  },
})

type ThesisProjectRow = {
  title?: string | null
  thesisSession?: { name?: string | null } | null
  registrations?: Array<{ student?: { userProfile?: { fullname?: string | null } | null } | null }>
}

function getPrimaryThesisProject(record: {
  thesisProjects?: ThesisProjectRow[]
  coThesisProjects?: ThesisProjectRow[]
  singleSupervisorPayment?: ThesisProjectRow[]
}): ThesisProjectRow | undefined {
  return (
    record.thesisProjects?.[0] ||
    record.coThesisProjects?.[0] ||
    record.singleSupervisorPayment?.[0]
  )
}

function getExpertFromPaymentRecord(record: {
  thesisProjects?: Array<{ supervisor?: ExpertProfileLike | PersonLike | null }>
  coThesisProjects?: Array<{ coSupervisor?: ExpertProfileLike | PersonLike | null }>
  singleSupervisorPayment?: Array<{
    supervisor?: ExpertProfileLike | PersonLike | null
    coSupervisor?: ExpertProfileLike | PersonLike | null
  }>
}): ExpertProfileLike | PersonLike | null | undefined {
  const supProject = record.thesisProjects?.[0]
  if (supProject?.supervisor)
    return versionToPersonLike(supProject.supervisor) ?? supProject.supervisor
  const coProject = record.coThesisProjects?.[0]
  if (coProject?.coSupervisor) {
    return versionToPersonLike(coProject.coSupervisor) ?? coProject.coSupervisor
  }
  const singleProject = record.singleSupervisorPayment?.[0]
  const expert = singleProject?.supervisor || singleProject?.coSupervisor
  return versionToPersonLike(expert) ?? expert
}

function getSupervisorRoleLabel(record: {
  thesisProjects?: unknown[]
  coThesisProjects?: unknown[]
  singleSupervisorPayment?: unknown[]
}) {
  if (record.thesisProjects?.length) return "GVHD1"
  if (record.coThesisProjects?.length) return "GVHD2"
  if (record.singleSupervisorPayment?.length) return "GVHD độc lập"
  return "-"
}

function getStudentNameFromProject(project?: ThesisProjectRow) {
  return project?.registrations?.[0]?.student?.userProfile?.fullname || "-"
}

export default function SupervisorPaymentRecordPage() {
  const { can, canSome } = useAbility()
  const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
    usePaymentStatusOptions()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [thesisSessionId, setThesisSessionId] = useState<string>()
  const [filters, setFilters] = useState<FilterProps>({
    name: undefined,
    transactionCode: undefined,
    paymentStatus: undefined,
    paymentDate: undefined,
  })

  const { data: thesisSessions = [] } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  })

  const where = useMemo(() => {
    if (!thesisSessionId) {
      return { id: { in: [] as string[] } }
    }

    const projectWhere = buildThesisProjectSessionFilter(thesisSessionId)
    const sessionWhere = buildSupervisorPaymentSessionWhere(thesisSessionId)

    const extra: Record<string, unknown>[] = [sessionWhere]

    if (filters.name) {
      const nameFilter = {
        contains: filters.name,
        mode: "insensitive" as const,
      }
      extra.push({
        OR: [
          {
            thesisProjects: {
              some: {
                ...projectWhere,
                supervisor: { name: nameFilter },
              },
            },
          },
          {
            coThesisProjects: {
              some: {
                ...projectWhere,
                coSupervisor: { name: nameFilter },
              },
            },
          },
          {
            singleSupervisorPayment: {
              some: {
                ...projectWhere,
                OR: [{ supervisor: { name: nameFilter } }, { coSupervisor: { name: nameFilter } }],
              },
            },
          },
        ],
      })
    }

    return {
      AND: extra,
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
  ])

  const paymentInclude = useMemo(
    () => ({
      thesisProjects: thesisProjectInclude(thesisSessionId),
      coThesisProjects: thesisProjectInclude(thesisSessionId),
      singleSupervisorPayment: thesisProjectInclude(thesisSessionId),
    }),
    [thesisSessionId]
  )

  const { data: supervisorPaymentData } = useFindManySupervisorPaymentRecord(
    {
      where,
      include: paymentInclude,
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!thesisSessionId }
  )

  const { data: count } = useCountSupervisorPaymentRecord({ where }, { enabled: !!thesisSessionId })

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
      await deletePaymentRecord({ where: { id } })
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
                    Đang xem thanh toán GVHD — {selectedSessionName}
                  </span>
                ) : null}
              </Flex>
            </Col>
            <Col>
              <Flex justify="end" gap={4}>
                {can(PERMISSION, "SUA") && (
                  <Button
                    onClick={() =>
                      openUpdatePaymentStatus({
                        paymentRecordIds: selectedRowKeys as string[],
                        isSupervisor: true,
                      })
                    }
                    disabled={selectedRowKeys.length === 0 || !thesisSessionId}
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
            id="supervisor-payment-record-luan-van"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={thesisSessionId ? supervisorPaymentData : []}
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
                title: "Tên chuyên gia",
                dataIndex: "name",
                width: 220,
                type: "input",
                align: "left",
                render: (_, record) =>
                  getSupervisorName(getExpertFromPaymentRecord(record), false, true) || "-",
              },
              {
                title: "Vai trò",
                width: 110,
                align: "center",
                render: (_, record) => getSupervisorRoleLabel(record),
              },
              {
                title: "Học viên",
                width: 160,
                align: "left",
                render: (_, record) => getStudentNameFromProject(getPrimaryThesisProject(record)),
              },
              {
                title: "Đề tài",
                dataIndex: "title",
                width: 220,
                align: "left",
                render: (_, record) => getPrimaryThesisProject(record)?.title || "-",
              },
              {
                title: "Đợt xét",
                width: 180,
                align: "left",
                render: (_, record) =>
                  getPrimaryThesisProject(record)?.thesisSession?.name ||
                  selectedSessionName ||
                  "-",
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
                  record?.paymentDate ? dayjs(record.paymentDate).format("DD/MM/YYYY") : "-",
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
                hidden: !canSome(PERMISSION, "SUA", "XOA"),
                render: (_, { id }) => {
                  if (!id) return ""
                  return (
                    <Row className="justify-center gap-2">
                      {can(PERMISSION, "SUA") && (
                        <EditIcon
                          onClick={() => openPaymentRecord({ paymentRecordId: id })}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                      )}
                      {can(PERMISSION, "XOA") && (
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: () => handleDelete(id),
                          }}
                        />
                      )}
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

SupervisorPaymentRecordPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
