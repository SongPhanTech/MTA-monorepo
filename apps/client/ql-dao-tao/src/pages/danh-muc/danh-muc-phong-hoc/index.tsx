import {
  NestedCollapsibleTable,
  type NestedColumn,
} from "@components/commons/nested-collapsible-table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import ViewIcon from "@components/icons/view"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useFindManyDM_Tinh_New,
  useUpdateBuilding,
  useUpdateTrainingLocation,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import { Building2Icon } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrainingLocationPage() {
  const { can } = useAbility()
  const router = useRouter()

  const {
    data = [],
    isLoading: isLoadingDM,
    isFetching: isFetchingDM,
  } = useFindManyDM_Tinh_New({
    include: {
      trainingLocation: {
        include: {
          buildings: {
            include: {
              rooms: true,
            },
          },
        },
      },
    },
  })
  // const { data = [], refetch } = useFindManyTrainingLocation({
  //     where: {
  //         name: {
  //             contains: filters.name,
  //             mode: 'insensitive',
  //         },
  //         code: {
  //             contains: filters.code,
  //             mode: 'insensitive',
  //         },
  //         ...(filters.active?.length === 1
  //             ? {
  //                   subjectVersion: {
  //                       some: { active: filters.active[0] },
  //                   },
  //               }
  //             : {}),
  //     },
  //     include: {
  //         _count: true,
  //         buildings: {
  //             include: {
  //                 rooms: true,
  //             },
  //         },
  //     },
  //     orderBy: {
  //         createdAt: 'desc',
  //     },
  //     take: numberOfPages,
  //     skip: (currentPage - 1) * numberOfPages,
  // })

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingLocationModal",
  })

  const { onOpen: openPutBuilding } = useDisclosure<{
    trainingLocationId: string
    id?: string
  }>({
    tag: "PutBuildingModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateTrainingLocation } = useUpdateTrainingLocation()
  const { mutateAsync: updateBuilding } = useUpdateBuilding()
  const provincesWithLocations = useMemo(() => {
    return data?.filter((tinh) => tinh.trainingLocation && tinh.trainingLocation.length > 0) || []
  }, [data])
  const columns: NestedColumn<any>[] = useMemo(
    () => [
      {
        title: "Mã toà nhà",
        dataIndex: "code",
        width: 200,
        align: "center",
        type: "input",
      },
      {
        title: "Tên toà nhà",
        dataIndex: "name",
        align: "center",
        type: "input",
      },
      {
        title: "Số tầng",
        dataIndex: "floor",
        align: "center",
        type: "order",
      },
      {
        title: "Số phòng",
        align: "center",
        dataIndex: "",
        type: "order",
        render: (_, record: any) => {
          return record?.rooms?.length ?? 0
        },
      },
      {
        title: "Mô tả",
        align: "center",
        dataIndex: "description",
        render: (text) => text || "-",
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
        render: (_, record) => {
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
        render: (_, _record) => {
          const { id, trainingLocationId, rooms } = _record
          const trainingLocationActive = provincesWithLocations
            .flatMap((province) => province.trainingLocation)
            .find((location) => location?.id === trainingLocationId)?.active
          if (id && trainingLocationId) {
            return (
              <Row className="justify-center gap-2">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "SUA") &&
                  trainingLocationActive && (
                    <EditIcon
                      onClick={(e) => {
                        openPutBuilding({
                          trainingLocationId: trainingLocationId,
                          id,
                        })
                        e.stopPropagation()
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                  )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "XEM") && (
                  <ViewIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      if (id && trainingLocationId) {
                        router.push(
                          `${ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC_PHONG_HOC_ID.replace("[id]", id)}?trainingLocationId=${trainingLocationId}`
                        )
                      }
                    }}
                    className="text-sm text-blue-700 cursor-pointer"
                  />
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "XOA") &&
                  !rooms.length && (
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: (e) => {
                          handleDeleteBuilding(id)
                          e?.stopPropagation()
                        },
                        onCancel: (e) => {
                          e?.stopPropagation()
                        },
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
              </Row>
            )
          }
        },
      },
    ],
    [provincesWithLocations, can]
  )
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingLocation({
        where: { id },
        data: { deletedAt: new Date(), code: id, name: id },
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

  async function handleDeleteBuilding(id: string) {
    try {
      showSpinner()
      await updateBuilding({
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
        <Col span={24} className="mt-2">
          <NestedCollapsibleTable
            data={provincesWithLocations}
            columns={columns}
            loading={isLoadingDM || isFetchingDM}
            nestedKeys={["trainingLocation", "buildings"]}
            defaultExpandAllRows={false}
            rowKey={(record) => record.id || record.Id}
            getParentLabel={(record, level) => {
              if (level === 0) {
                return `${record.sMa} - ${record.sTen}`
              }
              if (level === 1) {
                return `${record.code} - ${record.name}`
              }
              return ""
            }}
            getParentCount={(record, level) => {
              if (level === 0) {
                return record.trainingLocation?.length ?? 0
              }
              if (level === 1) {
                return record.buildings?.length ?? 0
              }
              return 0
            }}
            renderParentActions={(record, _level, parentIndex) => {
              if (parentIndex.length === 2 && parentIndex[1] === "buildings") {
                return (
                  <Row className="justify-center gap-2 mr-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "THEM") && (
                      <Tooltip title="Thêm tòa nhà">
                        <Building2Icon
                          className="text-yellow-700"
                          style={{
                            cursor: record?.active ? "pointer" : "not-allowed",
                            opacity: record?.active ? "1" : ".5",
                          }}
                          size={16}
                          onClick={
                            record?.active
                              ? openPutBuilding.bind(null, {
                                  trainingLocationId: record.id,
                                })
                              : (e) => {
                                  message.warning("Khu vực đã ngừng hoạt động")
                                  e.stopPropagation()
                                }
                          }
                        />
                      </Tooltip>
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "SUA") && (
                      <EditIcon
                        onClick={onOpen.bind(null, record.id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: (e) => {
                            handleDelete(record.id)
                            e?.stopPropagation()
                          },
                          onCancel: (e) => {
                            e?.stopPropagation()
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </Row>
                )
              }
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

TrainingLocationPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
