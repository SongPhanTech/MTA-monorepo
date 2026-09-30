import { CalendarOutlined, UnlockFilled } from "@ant-design/icons"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import type { Prisma } from "@workspace/db/client"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { parseVnDateEnd, parseVnDateStart, formatDateVn } from "@workspace/libs/timezone"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function SubjectClassScore() {
  const { canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    trainingObjectId: null,
    subjectName: "",
    scoreDeadline: undefined,
    examScoreDeadline: undefined,
    startDate: undefined,
    examDate: undefined,
    endDate: undefined,
  })
  const { id: semesterId } = useSemesterStore()
  const { onOpen } = useDisclosure<string>({
    tag: "HanNhapDiem",
  })
  const { onOpen: onOpenMoKhoa } = useDisclosure<string>({
    tag: "MoKhoaNhapDiem",
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const where = useMemo(
    () =>
      ({
        ...(filters.code && filters.code !== ""
          ? {
              code: {
                contains: filters.code,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(filters.name && filters.name !== ""
          ? {
              name: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(semesterId ? { semesterId } : {}),
        trainingObjectTypeId,
        ...(filters.subjectName && filters.subjectName !== ""
          ? {
              subject: {
                name: {
                  contains: filters.subjectName,
                  mode: "insensitive" as const,
                },
              },
            }
          : {}),
        ...(filters.scoreDeadline?.length === 2
          ? {
              scoreDeadline: {
                gte: parseVnDateStart(String(filters.scoreDeadline?.[0])) ?? undefined,
                lte: parseVnDateEnd(String(filters.scoreDeadline?.[1])) ?? undefined,
              },
            }
          : {}),
        ...(filters.examScoreDeadline?.length === 2
          ? {
              examScoreDeadline: {
                gte: parseVnDateStart(String(filters.examScoreDeadline?.[0])) ?? undefined,
                lte: parseVnDateEnd(String(filters.examScoreDeadline?.[1])) ?? undefined,
              },
            }
          : {}),
        ...(filters.startDate?.length === 2
          ? {
              startDate: {
                gte: parseVnDateStart(String(filters.startDate?.[0])) ?? undefined,
                lte: parseVnDateEnd(String(filters.startDate?.[1])) ?? undefined,
              },
            }
          : {}),
        ...(filters.examDate?.length === 2
          ? {
              examDate: {
                gte: parseVnDateStart(String(filters.examDate?.[0])) ?? undefined,
                lte: parseVnDateEnd(String(filters.examDate?.[1])) ?? undefined,
              },
            }
          : {}),
        ...(filters.endDate?.length === 2
          ? {
              endDate: {
                gte: parseVnDateStart(String(filters.endDate?.[0])) ?? undefined,
                lte: parseVnDateEnd(String(filters.endDate?.[1])) ?? undefined,
              },
            }
          : {}),
        deletedAt: null,
        cancelled: false,
        active: true,
        status: "OFFICIAL",
      }) satisfies Prisma.SubjectClassWhereInput,
    [
      filters.code,
      filters.name,
      semesterId,
      trainingObjectTypeId,
      filters.subjectName,
      filters.scoreDeadline,
      filters.examScoreDeadline,
      filters.startDate,
      filters.examDate,
      filters.endDate,
    ]
  )

  const { data: dataTable = [], refetch } = useFindManySubjectClass({
    where,
    include: {
      subject: {
        include: {
          managementOrganization: true,
        },
      },
      mainLecturer: {
        include: { userProfile: true },
      },
      extraLecturer: {
        include: { userProfile: true },
      },
      enterGradeLecturer: {
        include: { userProfile: true },
      },
      subjectClassStudent: {
        include: {
          student: { include: { userProfile: true } },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { data: count } = useCountSubjectClass({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  /* Mới */
  // #endregion
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: any) => {
      setSelectedRowKeys(selectedKeys)
    },
  }

  return (
    <div>
      <Form form={form}>
        <Row gutter={[16, 0]}>
          <Col span={24} className="pb-2">
            <Row gutter={[16, 16]} align="top" justify="space-between">
              {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
            </Row>
          </Col>

          <Col span={24}>
            <p
              style={{
                color: "red",
                fontWeight: "bold",
                marginBottom: 16,
              }}
            >
              Hạn nhập điểm TX, ĐK tự động đặt là trước ngày thi 1 tuần, hạn nhập điểm thi tự động
              đặt là trước ngày thi lớp 1 tuần
            </p>
            <Table
              rowKey="id"
              id="training-category"
              // rowSelection={rowSelection}
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
                  title: "Mã lớp",
                  dataIndex: "code",
                  align: "center",
                  width: 200,
                  fixed: "left",
                  type: "input",
                },
                {
                  title: "Tên lớp",
                  dataIndex: "name",
                  align: "center",
                  width: 200,
                  type: "input",
                },
                {
                  title: "Môn học",
                  width: 250,
                  dataIndex: "subjectName",
                  render: (text, record) => record?.subject?.name || text,
                  type: "input",
                },
                {
                  title: "Số TC",
                  width: 80,
                  align: "center",
                  render: (text, record) => record?.subject?.credit || text,
                },

                {
                  title: "Giảng viên",
                  width: 200,
                  align: "center",
                  render: (text, record) => {
                    const mainLecturer = record?.mainLecturer
                      ? `${record?.mainLecturer?.userProfile?.lastName} ${record?.mainLecturer?.userProfile?.firstName}`
                      : "Chưa có giảng viên chính"
                    const extraLecturer = record?.extraLecturer
                      ? `, ${record?.extraLecturer?.userProfile?.lastName} ${record?.extraLecturer?.userProfile?.firstName}`
                      : ""
                    return (
                      <span>
                        {mainLecturer}
                        {extraLecturer}
                      </span>
                    )
                  },
                },
                {
                  title: "Giảng viên NĐ",
                  width: 200,
                  align: "center",
                  render: (text, record) => {
                    const enterGradeLecturer = record?.enterGradeLecturer
                      ? `${record?.enterGradeLecturer?.userProfile?.lastName} ${record?.enterGradeLecturer?.userProfile?.firstName}`
                      : ""
                    const mainLecturer = record?.mainLecturer
                      ? `${record?.mainLecturer?.userProfile?.lastName} ${record?.mainLecturer?.userProfile?.firstName}`
                      : ""
                    const extraLecturer = record?.extraLecturer
                      ? `${record?.extraLecturer?.userProfile?.lastName} ${record?.extraLecturer?.userProfile?.firstName}`
                      : ""
                    return (
                      <span>
                        {enterGradeLecturer ||
                          mainLecturer ||
                          extraLecturer ||
                          "Chưa có giảng viên NĐ"}
                      </span>
                    )
                  },
                },

                {
                  title: "Ngày bắt đầu",
                  width: 150,
                  align: "center",
                  type: "date",
                  render: (_, record) =>
                    record.startDate ? formatDateVn(record.startDate, "DD/MM/YYYY") : "",
                },
                {
                  title: "Ngày thi",
                  width: 150,
                  align: "center",
                  type: "date",
                  render: (_, record) =>
                    record.examDate ? formatDateVn(record.examDate, "DD/MM/YYYY") : "",
                },
                {
                  title: "Ngày kết thúc",
                  width: 150,
                  align: "center",
                  type: "date",
                  render: (_, record) =>
                    record.endDate ? formatDateVn(record.endDate, "DD/MM/YYYY") : "",
                },
                {
                  title: "Bộ môn",
                  width: 200,
                  align: "center",
                  render: (text, record) => {
                    return (
                      <span>
                        {record?.subject?.managementOrganization?.sTen || "Chưa có bộ môn"}
                      </span>
                    )
                  },
                },
                {
                  title: "Khoa",
                  width: 200,
                  align: "center",
                  render: (text, record) => {
                    return (
                      <span>
                        {record?.subject?.managementOrganization?.parent?.sTen || "Chưa có khoa"}
                      </span>
                    )
                  },
                },
                {
                  title: "Trạng thái",
                  width: 150,
                  fixed: "right",
                  align: "center",
                  render: (text, record) => {
                    if (record?.active === true || record?.active === "active") {
                      return <Tag color="green">Đang hoạt động</Tag>
                    }
                    if (record?.active === false || record?.active === "inactive") {
                      return <Tag color="red">Kết thúc</Tag>
                    }
                    return ""
                  },
                },
                {
                  title: "Thao tác",
                  width: 150,
                  align: "center",
                  fixed: "right",
                  hidden: !canSome(
                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_KHOA_NHAP_DIEM,
                    "SUA"
                  ),
                  render: (text, record) => {
                    if (record.id) {
                      return (
                        <div className="flex justify-center items-center gap-2">
                          <Row className="flex justify-center items-center gap-2 text-primary">
                            {profileId === "9ed6bb0e-eaf5-4110-8fd3-ef37f13619bc" && (
                              <Tooltip title="Đặt lại lịch nhập điểm" placement="top">
                                <Button
                                  icon={<CalendarOutlined />}
                                  onClick={() => onOpen(record.id)}
                                  style={{
                                    height: "40px",
                                    width: "40px",
                                  }}
                                />
                              </Tooltip>
                            )}
                            {profileId === "e0bf913a-7b9c-40ac-9a52-266a4326e02f" && (
                              <Tooltip title="Mở khoá nhập điểm" placement="top">
                                <Button
                                  icon={<UnlockFilled />}
                                  onClick={() => onOpenMoKhoa(record.id)}
                                  style={{
                                    height: "40px",
                                    width: "40px",
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Row>
                        </div>
                      )
                    }
                    return ""
                  },
                },
              ]}
              data={dataTable}
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
      </Form>
    </div>
  )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
