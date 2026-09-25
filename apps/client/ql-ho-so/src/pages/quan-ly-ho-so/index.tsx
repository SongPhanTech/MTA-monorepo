import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { FilterProps } from "@components/modal/quan-ly-ho-so/type"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import type { DM_DonVi } from "@workspace/db"
import {
  useCountUserProfile,
  useFindManyDM_DonVi,
  useFindManyDM_GioiTinh,
  useFindManyUserProfile,
  useUpdateUserProfile,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Dropdown, Flex, Form, Input, Menu, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { Printer } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TreeSelect from "@/components/commons/tree-select"

// import { deleteDMNhanViensId } from '@workspace/libs/api/system'

dayjs.locale("vi")
export default function UserProfilePageDs() {
  const { can, canSome } = useAbility()
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
    originalPlace: "",
    sDM_DonViId: "",
    searchText: "",
  })

  const router = useRouter()
  const where = useMemo(() => {
    return {
      OR: [
        { lecturer: { isNot: null } },
        { staffs: { isNot: null } },
        { bLaGiangVien: true },
        { bLaCanBoNhanVien: true },
      ],
      ...(filters.originalPlace
        ? {
            originalPlace: {
              contains: filters.originalPlace,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.idCardNumber
        ? {
            idCardNumber: {
              contains: filters.idCardNumber,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.sDM_DonViId
        ? {
            sDM_DonViId: {
              equals: filters.sDM_DonViId,
            },
          }
        : {}),
      ...(filters.name
        ? {
            fullname: {
              contains: filters.name,
              mode: "insensitive",
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
      ...(filters.gender
        ? {
            genderId: {
              in: filters.gender,
            },
          }
        : {}),
      ...(filters.phoneNumber
        ? {
            phoneNumber: {
              contains: filters.phoneNumber,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.email
        ? {
            email: {
              contains: filters.email,
              mode: "insensitive",
            },
          }
        : {}),
    } as any
  }, [filters])

  const { data: UserProfileData = [], refetch } = useFindManyUserProfile({
    where,
    include: {
      gender: true,
      rank: true,
      lecturer: { select: { id: true } },
      staffs: { select: { id: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountUserProfile({
    where: {
      ...where,
      deletedAt: null,
    },
    orderBy: {
      firstName: "asc",
    },
  })

  const { data: genderData = [] } = useFindManyDM_GioiTinh()
  const { data: organizations = [] } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(organizations)
  const { showSpinner, hideSpinner } = useSpinner()
  // const treeData = buildOrgTree(organizations)
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
  const handleModal = () => {
    router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_TAO_MOI)
  }

  const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalTomTatLyLich",
  })

  const { onOpen: onOpenModalLyLichCanBo } = useDisclosure<{
    id: string
  }>({
    tag: "ModalLyLichCanBo",
  })

  const { onOpen: onOpenModalSoYeuLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalSoYeuLyLich",
  })

  const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      // const res = await deleteDMNhanViensId(id) // todo

      await updateUserProfile({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xoá hồ sơ thành công")
    } catch (error) {

      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const list = [
    {
      key: "1",
      label: "Xuất dữ liệu theo mẫu trích yếu 63",
      onClick: ({ id }: { id: string }) => onOpenModalTomTatLyLich({ id }),
    },
    {
      key: "2",
      label: "Xuất dữ liệu theo mẫu C2",
      onClick: ({ id }: { id: string }) => onOpenModalLyLichCanBo({ id }),
    },
    {
      key: "3",
      label: "Xuất dữ liệu theo mẫu sơ yếu lý lịch",
      onClick: ({ id }: { id: string }) => onOpenModalSoYeuLyLich({ id }),
    },
  ]

  return (
    <div className="min-w-0 w-full">
      <Row gutter={[16, 0]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[8, 8]} align="top" justify="space-between">
            <Col xs={12} md={12}>
              <Flex>
                <Form.Item
                  className="mb-0 mr-3"
                  name="name"
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  labelAlign="left"
                >
                  <Input
                    id="search"
                    className="w-[250px]"
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    allowClear
                    placeholder="Tìm kiếm"
                  />
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="sDM_DonViId"
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  labelAlign="left"
                >
                  <TreeSelect
                    showSearch
                    placeholder="Chọn đơn vị quản lý"
                    treeDefaultExpandAll
                    treeData={treeData}
                    onChange={(val) => handleFilterChange("sDM_DonViId", val)}
                    allowClear
                    className="h-8 w-[250px]"
                  />
                </Form.Item>
              </Flex>
            </Col>
            <Col xs={12}>
              <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                {/* <Button
                                    type="primary"
                                    onClick={() => setImportModalVisible(true)}
                                    icon={<UploadOutlined />}
                                >
                                    Nhập dữ liêu Excel
                                </Button>
                                <ImportStudentModal
                                    visible={importModalVisible}
                                    onCancel={() => setImportModalVisible(false)}
                                />
                                <ExportTemplateStudent /> */}
                {can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "THEM") && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
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
                title: "Mã GV/CB",
                align: "center",
                width: 120,
                ellipsis: true,
                render: (__, record) => record?.code || "",
              },
              {
                title: "Họ và tên",
                align: "center",
                width: 180,
                ellipsis: true,
                render: (__, record) => (record ? `${record.lastName} ${record.firstName}` : ""),
                type: "input",
                dataIndex: "name",
              },
              {
                title: "Loại",
                align: "center",
                width: 110,
                render: (__, record) => (
                  <Flex justify="center" gap={4} wrap="wrap">
                    {record?.lecturer || record?.bLaGiangVien ? (
                      <Tag color="blue">Giảng viên</Tag>
                    ) : null}
                    {record?.staffs || record?.bLaCanBoNhanVien ? (
                      <Tag color="purple">Cán bộ</Tag>
                    ) : null}
                  </Flex>
                ),
              },
              {
                title: "CCCD/CMND",
                align: "center",
                width: 140,
                ellipsis: true,
                render: (__, record) => (record.idCardNumber ? record.idCardNumber : ""),
                type: "input",
                dataIndex: "idCardNumber",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 150,
                dataIndex: "dateOfBirth",
                type: "date",
                render: (__, record) =>
                  record?.dateOfBirth ? dayjs(record.dateOfBirth).format("DD/MM/YYYY") : "",
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

                render: (__, record) => (record?.gender ? record?.gender?.sTen : ""),
              },
              {
                title: "Nguyên quán",
                align: "center",
                width: 150,
                ellipsis: true,
                type: "input",
                dataIndex: "originalPlace",
                render: (__, record) => (record?.originalPlace ? record?.originalPlace : ""),
              },
              {
                title: "Đơn vị",
                align: "center",
                width: 180,
                ellipsis: true,
                // type: 'tree_select',
                // options: treeData,
                dataIndex: "sDM_DonViId",
                render: (__, record) => {
                  if (record?.sDM_DonViId) {
                    const donVi = organizations.find(
                      (item: DM_DonVi) => item.Id === record?.sDM_DonViId
                    )
                    if (donVi) {
                      return donVi.sTen
                    }
                    return ""
                  }
                  return ""
                },
              },
              {
                title: "Cấp bậc",
                align: "center",
                width: 120,
                type: "input",
                dataIndex: "capBac",
                render: (__, record) => {
                  return record?.rank ? record?.rank?.sTen : ""
                },
              },
              {
                title: "SĐT",
                align: "center",
                width: 120,
                type: "input",
                dataIndex: "phoneNumber",
                render: (__, record) => (record?.phoneNumber ? record?.phoneNumber : ""),
              },
              {
                title: "Email",
                align: "center",
                width: 180,
                ellipsis: true,
                type: "input",
                dataIndex: "email",
                render: (__, record) => (record.email ? record?.email : ""),
              },

              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                render: (_, record: { active?: boolean }) => {
                  return record.active ? (
                    <Tag color="success">Hoạt động</Tag>
                  ) : (
                    <Tag color="default">Không hoạt động</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 120,
                align: "center",
                fixed: "right",
                hidden: !canSome(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "IN", "XOA", "SUA"),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "IN") && (
                      <Dropdown
                        overlay={
                          <Menu>
                            {list.map((item) => (
                              <Menu.Item key={item.key} onClick={(e) => item.onClick({ id })}>
                                {item.label}
                              </Menu.Item>
                            ))}
                          </Menu>
                        }
                        trigger={["click"]}
                      >
                        <Button
                          className="w-fit"
                          type="link"
                          icon={<Printer className="text-[#212121]" />}
                          size="large"
                        />
                      </Dropdown>
                    )}
                    {can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "SUA") && (
                      <EditIcon
                        onClick={() => {
                          router.push(`quan-ly-ho-so/${id}`)
                        }}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
            rowKey="id"
            // rowSelection={{
            //     selectedRowKeys,
            //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
            // }}
            data={UserProfileData}
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

UserProfilePageDs.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[{ title: "Hồ sơ giảng viên/cán bộ", href: "/quan-ly-ho-so" }]}
    >
      {page}
    </DefaultLayout>
  )
}
