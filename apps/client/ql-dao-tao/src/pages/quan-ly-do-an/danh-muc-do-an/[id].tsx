import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useCouncilRoleOptions } from "@hooks/councilRole"
import { useDecisionTypeOptions } from "@hooks/decisionType"
import useSpinner from "@hooks/spinner"
import { useStudentThesisRegistrationStatusOptions } from "@hooks/studentThesisRegistrationStatus"
import DefaultLayout from "@layouts/default-layout"
import {
  useDeleteStudentThesisRegistration,
  useFindManyCouncil,
  useFindManyDecision,
  useFindManyStudentThesisRegistration,
  useUpdateCouncil,
  useUpdateCouncilMember,
  useUpdateDecision,
} from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FilterPropsStudent = FilterProps & {
  title?: string
  status?: string[]
  titleEN?: string
}

export default function ThesisProjectDetail() {
  const { getStudentThesisRegistrationStatusColor, getStudentThesisRegistrationStatusLabel } =
    useStudentThesisRegistrationStatusOptions()
  const { getDecisionTypeColor, getDecisionTypeLabel } = useDecisionTypeOptions()
  const { getCouncilRoleLabel } = useCouncilRoleOptions()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterPropsStudent>({
    code: undefined,
  })
  const thesisProjectId = router.query.id as string

  const { data: studentThesisRegistration } = useFindManyStudentThesisRegistration({
    where: {
      thesisProjectId: thesisProjectId,
      ...(filters.code
        ? {
            student: { code: { contains: filters.code, mode: "insensitive" } },
          }
        : {}),
    },
    include: {
      student: { include: { userProfile: true } },
      reviewedBy: { include: { userProfile: true } },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: council } = useFindManyCouncil({
    where: {
      thesis: { some: { id: thesisProjectId } },
    },
    include: {
      members: {
        include: { expert: { include: { lecturer: { include: { userProfile: true } } } } },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: decision } = useFindManyDecision({
    where: {
      thesisProjectId: thesisProjectId,
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const councilWithName = council?.map((council) => ({
    ...council,
    name: "Hội đồng",
  }))

  const { onOpen: openDecision } = useDisclosure<{ thesisProjectId: string; decisionId: string }>({
    tag: "PutDecision",
  })

  const { onOpen: openStudentThesisRegistration } = useDisclosure<{
    studentThesisId: string
    thesisProjectId: string
  }>({
    tag: "PutStudentThesisRegistration",
  })

  const { onOpen: openCouncil } = useDisclosure<{ councilId: string; thesisProjectId: string }>({
    tag: "PutCouncil",
  })

  const { onOpen: openCouncilMember } = useDisclosure<{
    councilId: string
    councilMemberId: string
  }>({
    tag: "PutCouncilMember",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateDecision } = useUpdateDecision()
  async function handleDeleteDecision(id: string) {
    try {
      showSpinner()
      await updateDecision({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
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

  const { mutateAsync: updateStudentThesisRegistration } = useDeleteStudentThesisRegistration()
  async function handleDeleteStudentThesisRegistration(id: string) {
    try {
      showSpinner()
      await updateStudentThesisRegistration({
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

  const { mutateAsync: updateCouncil } = useUpdateCouncil()
  async function handleDeleteCouncil(id: string) {
    try {
      showSpinner()
      await updateCouncil({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
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

  const { mutateAsync: updateCouncilMember } = useUpdateCouncilMember()
  async function handleDeleteCouncilMember(id: string) {
    try {
      showSpinner()
      await updateCouncilMember({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
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
      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          SINH VIÊN, HỌC VIÊN ĐĂNG KÝ ĐỒ ÁN
        </div>
        <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full mb-2">
          <Col span={12}>{/*  */}</Col>
          <Col span={4}>
            <Flex justify="end" gap={4}>
              <Button
                type="primary"
                onClick={() =>
                  openStudentThesisRegistration({
                    studentThesisId: "",
                    thesisProjectId: thesisProjectId,
                  })
                }
              >
                <BookPlus />
                Thêm mới
              </Button>
            </Flex>
          </Col>
        </Row>
        <Table
          rowKey="key"
          id="student-thesis-registration"
          dataSource={studentThesisRegistration}
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
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã sinh viên",
              dataIndex: "code",
              width: 120,
              fixed: "left",
              type: "input",
              render: (_, record) => record?.student?.code,
            },
            {
              title: "Họ và tên",
              width: 200,
              fixed: "left",
              render: (record) => record.student.userProfile.fullname,
            },
            {
              title: "Thời gian đăng ký",
              dataIndex: "registeredAt",
              align: "center",
              width: 100,
              render: (record) => (record ? dayjs(record).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Người phê duyệt",
              dataIndex: "reviewedBy",
              width: 150,
              render: (record) => record?.userProfile.fullname,
            },
            {
              title: "Thời gian phê duyệt",
              dataIndex: "reviewedAt",
              align: "center",
              width: 150,
              render: (record) => (record ? dayjs(record).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ghi chú",
              dataIndex: "reviewNote",
              width: 150,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              align: "center",
              width: 150,
              fixed: "right",
              render: (_, record) => {
                const label = getStudentThesisRegistrationStatusLabel(record?.status)
                const color = getStudentThesisRegistrationStatusColor(record?.status)
                return <Tag color={color}>{label}</Tag>
              },
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                if (record?.id) {
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        onClick={() =>
                          openStudentThesisRegistration({
                            thesisProjectId: thesisProjectId,
                            studentThesisId: record?.id,
                          })
                        }
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDeleteStudentThesisRegistration(record?.id),
                        }}
                      />
                    </Row>
                  )
                }
                return ""
              },
            },
          ]}
        />
      </Col>
      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          HỘI ĐỒNG ĐÁNH GIÁ
        </div>
        {!councilWithName?.length && (
          <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full">
            <Col span={12}>{/*  */}</Col>
            <Col span={4}>
              <Flex justify="end" gap={4}>
                <Button
                  type="primary"
                  onClick={() =>
                    openCouncil({
                      councilId: "",
                      thesisProjectId: thesisProjectId,
                    })
                  }
                >
                  <BookPlus />
                  Thêm mới hội đồng
                </Button>
              </Flex>
            </Col>
          </Row>
        )}
        <TableCollapse
          rowKey="key"
          id="graduation-criteria"
          headerTitleKey="name"
          defaultExpandAll
          data={councilWithName}
          childrenFieldName="members"
          columns={[
            {
              title: "Tên chuyên gia",
              width: 200,
              fixed: "left",
              render: (record) => record.expert?.name,
            },
            {
              title: "Vai trò",
              dataIndex: "role",
              align: "center",
              width: 150,
              render: (record) => <div>{getCouncilRoleLabel(record)}</div>,
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                if (record?.id) {
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        onClick={() =>
                          openCouncilMember({
                            councilId: record.councilId || "",
                            councilMemberId: record?.id,
                          })
                        }
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDeleteCouncilMember(record?.id),
                        }}
                      />
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
            total: councilWithName?.[0]?.members?.length,
            onChange: (page, pageSize) => {
              if (numberOfPages === pageSize) {
                setCurrentPage(page)
              } else {
                setCurrentPage(1)
                setNumberOfPages(pageSize)
              }
            },
          }}
          headerRight={({ id }) => (
            <div className="flex gap-2.5 w-[85px] items-center">
              <CreateIcon
                onClick={() => {
                  openCouncilMember({
                    councilId: id,
                    councilMemberId: "",
                  })
                }}
                title="Thêm mới thành viên hội đồng"
              />
              <EditIcon
                onClick={() =>
                  openCouncil({
                    councilId: id,
                    thesisProjectId: thesisProjectId || "",
                  })
                }
                className="text-sm text-blue-700 cursor-pointer"
              />
              <DeleteIcon
                popConfirm={{
                  onConfirm: () => handleDeleteCouncil(id),
                }}
              />
            </div>
          )}
        />
      </Col>
      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          QUYẾT ĐỊNH LIÊN QUAN
        </div>
        <Row gutter={[0, 16]} align="top" justify="space-between" className="w-full mb-2">
          <Col span={12}>{/*  */}</Col>
          <Col span={4}>
            <Flex justify="end" gap={4}>
              <Button
                type="primary"
                onClick={() =>
                  openDecision({
                    thesisProjectId: thesisProjectId,
                    decisionId: "",
                  })
                }
              >
                <BookPlus />
                Thêm mới
              </Button>
            </Flex>
          </Col>
        </Row>
        <Table
          rowKey="key"
          id="decision"
          dataSource={decision}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Ngày ban hành",
              width: 200,
              align: "center",
              fixed: "left",
              render: (record) => (record ? dayjs(record.issueDate).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Loại quyết định",
              align: "center",
              width: 150,
              render: (_, record) => {
                const label = getDecisionTypeLabel(record?.type)
                const color = getDecisionTypeColor(record?.type)
                return <Tag color={color}>{label}</Tag>
              },
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                if (record?.id) {
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        onClick={() =>
                          openDecision({
                            thesisProjectId: thesisProjectId,
                            decisionId: record?.id,
                          })
                        }
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDeleteDecision(record?.id),
                        }}
                      />
                    </Row>
                  )
                }
                return ""
              },
            },
          ]}
        />
      </Col>
    </div>
  )
}

ThesisProjectDetail.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý đồ án" },
        {
          title: "Danh mục đồ án",
          href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN,
        },
        { title: "Chi tiết danh mục đồ án" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
