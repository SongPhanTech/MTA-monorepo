import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE, TRAINING_OBJECT_TYPE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { TrainingObjectTypes } from "@workspace/db/client"
import {
  useCountTrainingObjectType,
  useFindManyTrainingForm,
  useFindManyTrainingLevel,
  useFindManyTrainingObjectType,
  useUpdateTrainingObjectType,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function TrainingObjectTypePage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    type: undefined,
    baseScore: undefined,
    trainingFormId: undefined,
    trainingLevelId: undefined,
  })

  const { data = [], refetch } = useFindManyTrainingObjectType({
    where: {
      ...(filters.name
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.type?.length
        ? {
            type: {
              in: filters.type,
            },
          }
        : {}),
      ...(filters.trainingFormId?.length
        ? {
            trainingFormId: {
              in: filters.trainingFormId,
            },
          }
        : {}),
      ...(filters.trainingLevelId?.length
        ? {
            trainingLevelId: {
              in: filters.trainingLevelId,
            },
          }
        : {}),
    },
    include: {
      trainingForm: true,
      trainingLevel: true,
    },
    orderBy: {
      name: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: trainingFormData } = useFindManyTrainingForm()

  const { data: trainingLevelData } = useFindManyTrainingLevel()

  const { data: count } = useCountTrainingObjectType({
    where: {
      ...(filters.name
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.type
        ? {
            type: {
              in: filters.type,
            },
          }
        : {}),
      deletedAt: null,
    },
  })

  const mapFormData = () => {
    if (trainingFormData) {
      return trainingFormData.map((item) => ({
        value: item.id,
        label: item.name,
      }))
    }

    return []
  }

  const mapLevelData = () => {
    if (trainingLevelData) {
      return trainingLevelData.map((item) => ({
        value: item.id,
        label: item.name,
      }))
    }

    return []
  }

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingObjectTypeModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateTrainingObjectType } = useUpdateTrainingObjectType()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingObjectType({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
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
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={12}>
              <Flex>
                <Col span={8}>
                  {/* <Form.Item name="name">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange("searchText", e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            style={{
                                                maxWidth: 300,
                                                marginRight: 8,
                                                height: 32,
                                            }}
                                            prefix={
                                                <Search
                                                    size={16}
                                                    style={{
                                                        color: "rgba(0, 0, 0, 0.25)",
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item> */}
                </Col>
              </Flex>
            </Col>
            <Col span={6}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DOI_TUONG_DAO_TAO, "THEM") && (
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
            rowKey="id"
            id="training-category"
            data={data}
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Tên đối tượng đào tạo",
                dataIndex: "name",
                fixed: "left",
                align: "left",
                type: "input",
              },
              {
                title: "Loại",
                dataIndex: "type",
                align: "left",
                width: 200,
                type: "select",
                options: Object.keys(TRAINING_OBJECT_TYPE).map((key) => {
                  return {
                    label: TRAINING_OBJECT_TYPE[key as keyof typeof TRAINING_OBJECT_TYPE],
                    value: key,
                  }
                }),
                render: (__, record: { type?: TrainingObjectTypes }) => {
                  return record?.type
                    ? TRAINING_OBJECT_TYPE[record?.type as keyof typeof TRAINING_OBJECT_TYPE]
                    : ""
                },
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "trainingFormId",
                fixed: "left",
                align: "left",
                type: "select",
                options: mapFormData(),
                render: (__, record) => {
                  return record?.trainingForm?.name || ""
                },
              },
              {
                title: "Bậc đào tạo",
                dataIndex: "trainingLevelId",
                fixed: "left",
                align: "left",
                type: "select",
                options: mapLevelData(),
                render: (__, record) => {
                  return record?.trainingLevel?.name || ""
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 200,
                render: (value, record) => {
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DOI_TUONG_DAO_TAO,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DOI_TUONG_DAO_TAO,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DOI_TUONG_DAO_TAO,
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

TrainingObjectTypePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
