import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountRoom,
  useFindManyRoom,
  useFindUniqueBuilding,
  useUpdateRoom,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import _ from "lodash"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function BuildingPage() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const buildingId = router.query.id as string
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    code: "",
    name: "",
    active: undefined,
    capacityOrder: undefined,
    examCapacityOrder: undefined,
  })
  const where: any = useMemo(() => {
    return {
      buildingId,
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name, mode: "insensitive" } }
        : {}),
      ...(filters.code && filters.code !== ""
        ? { code: { contains: filters.code, mode: "insensitive" } }
        : {}),
      ...(filters.active?.length === 1
        ? {
            subjectClasses: {
              some: { active: filters.active[0] },
            },
          }
        : {}),
    }
  }, [filters, buildingId])

  const { data = [], refetch } = useFindManyRoom({
    where,
    orderBy: [
      ...(filters?.capacityOrder ? [{ capacity: filters.capacityOrder }] : []),

      ...(filters?.examCapacityOrder ? [{ examCapacity: filters.examCapacityOrder }] : []),

      { createdAt: "desc" },
    ],
    include: {
      subjectClasses: true,
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: building } = useFindUniqueBuilding(
    {
      where: {
        id: buildingId,
      },
      include: {
        trainingLocation: true,
      },
    },
    {
      enabled: !!buildingId,
    }
  )

  const { data: count } = useCountRoom({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { onOpen: openPutRoom } = useDisclosure<{
    buildingId: string
    buildingCode: string
    id?: string
  }>({
    tag: "PutRoomModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    if (building?.active === false) {
      message.error("Không thể thêm phòng vào tòa nhà đang không hoạt động")
      return
    }
    openPutRoom({
      buildingCode: building?.code ?? "",
      buildingId: buildingId,
    })
  }
  const { mutateAsync: update } = useUpdateRoom()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await update({
        where: { id },
        data: { deletedAt: new Date(), code: id },
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
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={6}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "THEM") && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <span className="text-lg font-semibold">
            Danh sách phòng{" "}
            {building ? `: ${building.trainingLocation?.name} - ${building.name}` : ""}
          </span>
          <Table
            rowKey={"id"}
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
                render: (_, __, index) => {
                  return (currentPage - 1) * numberOfPages + index + 1
                },
              },
              {
                title: "Mã phòng",
                dataIndex: "code",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Tên phòng",
                dataIndex: "name",
                align: "left",
                type: "input",
              },
              {
                title: "Số chỗ ngồi",
                dataIndex: "capacityOrder",
                align: "center",
                type: "order",
                render: (_, record) => record?.capacity,
              },
              {
                title: "Số chỗ ngồi thi",
                dataIndex: "examCapacityOrder",
                align: "center",
                type: "order",
                render: (_, record) => record?.examCapacity,
              },
              {
                title: "Mô tả",
                align: "center",
                dataIndex: "description",
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 130,
                fixed: "right",
                dataIndex: "active",
                type: "select",
                options: [
                  {
                    value: true,
                    label: "Đang hoạt động",
                  },
                  {
                    value: false,
                    label: "Không hoạt động",
                  },
                ],
                render: (__, record) => {
                  return !record?.active ? (
                    <Tag color="error">Không hoạt động</Tag>
                  ) : (
                    <Tag color="success">Đang hoạt động</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={openPutRoom.bind(null, {
                              buildingId,
                              buildingCode: building?.code ?? "",
                              id,
                            })}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
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

BuildingPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục" },
        {
          title: "Danh mục tòa nhà",
          href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC,
        },
        { title: "Danh sách phòng học" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
