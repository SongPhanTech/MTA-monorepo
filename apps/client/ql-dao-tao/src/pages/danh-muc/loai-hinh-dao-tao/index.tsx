import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountTrainingType,
  useFindManyTrainingType,
  useUpdateTrainingType,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function TrainingTypePage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
  })

  const { data = [], refetch } = useFindManyTrainingType({
    where: filters.name
      ? {
          name: {
            contains: filters.name,
            mode: "insensitive",
          },
        }
      : {},
    orderBy: {
      name: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountTrainingType({
    where: {
      ...(filters.name
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingTypeModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateTrainingType } = useUpdateTrainingType()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingType({
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
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOAI_HINH_DAO_TAO, "THEM") && (
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên loại hình đào tạo",
                dataIndex: "name",
                fixed: "left",
                align: "left",
                type: "input",
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOAI_HINH_DAO_TAO,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOAI_HINH_DAO_TAO,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOAI_HINH_DAO_TAO,
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

TrainingTypePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
