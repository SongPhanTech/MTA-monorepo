import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import type { FilterProps } from "@components/modal/quan-ly-ho-so/type"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import type { Prisma } from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyDM_DonVi,
  useFindManyDM_GioiTinh,
  useFindManyStudent,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Col, Flex, Form, Input, Row, Tag } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import TreeSelect from "@/components/commons/tree-select"

dayjs.locale("vi")

export default function StudentProfilePageDs() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    dateOfBirth: undefined,
    gender: undefined,
    email: "",
    phoneNumber: "",
    idCardNumber: "",
    sDM_DonViId: "",
    searchText: "",
  })

  const router = useRouter()
  const where = useMemo(() => {
    const userProfile: Prisma.UserProfileWhereInput = {
      ...(filters.name
        ? { fullname: { contains: filters.name, mode: "insensitive" } }
        : {}),
      ...(filters.idCardNumber
        ? { idCardNumber: { contains: filters.idCardNumber, mode: "insensitive" } }
        : {}),
      ...(filters.gender ? { genderId: { in: filters.gender } } : {}),
      ...(filters.dateOfBirth?.length === 2
        ? {
            dateOfBirth: {
              gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.phoneNumber
        ? { phoneNumber: { contains: filters.phoneNumber, mode: "insensitive" } }
        : {}),
      ...(filters.email ? { email: { contains: filters.email, mode: "insensitive" } } : {}),
    }

    return {
      deletedAt: null,
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" } } : {}),
      ...(filters.sDM_DonViId
        ? { fixedClass: { managementOrganizationId: filters.sDM_DonViId } }
        : {}),
      ...(Object.keys(userProfile).length > 0 ? { userProfile } : {}),
    } satisfies Prisma.StudentWhereInput
  }, [filters])

  const { data: students = [], refetch } = useFindManyStudent({
    where,
    include: {
      userProfile: {
        include: {
          gender: true,
          rank: true,
        },
      },
      fixedClass: {
        include: {
          managementOrganization: true,
          trainingCourse: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountStudent({
    where,
  })

  const { data: genderData = [] } = useFindManyDM_GioiTinh()
  const { data: organizations = [] } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(organizations)

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[8, 8]} align="top" justify="space-between">
            <Col xs={24} md={20}>
              <Flex wrap="wrap" gap={12}>
                <Form.Item className="mb-0" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                  <Input
                    className="w-[220px]"
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    allowClear
                    placeholder="Tìm theo họ tên"
                  />
                </Form.Item>
                <Form.Item className="mb-0" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                  <Input
                    className="w-[180px]"
                    onChange={(e) => handleFilterChange("code", e.target.value)}
                    allowClear
                    placeholder="Mã HV/SV"
                  />
                </Form.Item>
                <Form.Item className="mb-0" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                  <TreeSelect
                    showSearch
                    placeholder="Đơn vị (lớp quản lý)"
                    treeDefaultExpandAll
                    treeData={treeData}
                    onChange={(val) => handleFilterChange("sDM_DonViId", val)}
                    allowClear
                    className="h-8 w-[250px]"
                  />
                </Form.Item>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã HV/SV",
                align: "center",
                width: 120,
                fixed: "left",
                dataIndex: "code",
                type: "input",
                render: (__, record) => record?.code || "",
              },
              {
                title: "Họ và tên",
                align: "center",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                type: "input",
                render: (__, record) => record?.userProfile?.fullname || "",
              },
              {
                title: "CCCD/CMND",
                align: "center",
                width: 150,
                dataIndex: "idCardNumber",
                type: "input",
                render: (__, record) => record?.userProfile?.idCardNumber || "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 130,
                dataIndex: "dateOfBirth",
                type: "date",
                render: (__, record) =>
                  record?.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 100,
                type: "select",
                dataIndex: "gender",
                options: genderData.map((i) => ({
                  label: i.sTen,
                  value: i.Id,
                })),
                render: (__, record) => record?.userProfile?.gender?.sTen || "",
              },
              {
                title: "Lớp QL",
                align: "center",
                width: 140,
                render: (__, record) => record?.fixedClass?.code || record?.fixedClass?.name || "",
              },
              {
                title: "Đơn vị",
                align: "center",
                width: 180,
                render: (__, record) => record?.fixedClass?.managementOrganization?.sTen || "",
              },
              {
                title: "Khoá",
                align: "center",
                width: 140,
                render: (__, record) => record?.fixedClass?.trainingCourse?.name || "",
              },
              {
                title: "SĐT",
                align: "center",
                width: 120,
                type: "input",
                dataIndex: "phoneNumber",
                render: (__, record) => record?.userProfile?.phoneNumber || "",
              },
              {
                title: "Email",
                align: "center",
                width: 160,
                type: "input",
                dataIndex: "email",
                render: (__, record) => record?.userProfile?.email || "",
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                render: (_, record) =>
                  record.active ? (
                    <Tag color="success">Hoạt động</Tag>
                  ) : (
                    <Tag color="default">Không hoạt động</Tag>
                  ),
              },
              {
                title: "Thao tác",
                width: 80,
                align: "center",
                fixed: "right",
                hidden: !can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "SUA"),
                render: (_, record) =>
                  record.userProfileId ? (
                    <EditIcon
                      onClick={() => {
                        router.push(`${ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO}/${record.userProfileId}`)
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                  ) : null,
              },
            ]}
            rowKey="id"
            data={students}
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

StudentProfilePageDs.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[{ title: "Hồ sơ học viên/sinh viên", href: "/quan-ly-ho-so/hoc-vien" }]}
    >
      {page}
    </DefaultLayout>
  )
}
