import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import { emptyObjectIf } from "@workspace/constant"
import { useCountAward, useFindManyAward, useUpdateAward } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import _ from "lodash"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function OlympicAwards() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    bonusScore: undefined,
    count: undefined,
    subjects: undefined,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen, onClose } = useDisclosure<string>({
    tag: "PutOlympicScoreModal",
  })

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateAward } = useUpdateAward()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateAward({
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

  const where = useMemo(() => {
    return {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.subjects && filters.subjects !== ""
        ? {
            subjects: {
              some: {
                name: {
                  contains: filters.subjects,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
    }
  }, [filters])

  const { data: dataTable = [], refetch } = useFindManyAward({
    where,
    include: { subjects: true, _count: true },
    orderBy: [
      ...emptyObjectIf(
        [
          {
            bonusScore: filters.bonusScore,
          },
        ],
        !!filters.bonusScore
      ),
      {
        createdAt: "desc",
      },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { data: count } = useCountAward({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24} className="mt-3">
              <Flex justify="space-between">
                <Col span={6}>
                  {/* <Form.Item className="mb-0" name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            allowClear
                                        />
                                    </Form.Item> */}
                </Col>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "THEM") && (
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
                title: "Tên giải thưởng",
                dataIndex: "name",
                align: "center",
                type: "input",
              },
              {
                title: "Điểm cộng",
                dataIndex: "bonusScore",
                width: 200,
                align: "center",
                type: "order",
              },
              {
                title: "Môn học có thể cộng điểm",
                dataIndex: "subjects",
                width: 300,
                align: "center",
                type: "input",
                render: (__, record) => {
                  return record?.subjects?.length ? (
                    <TextTruncate
                      arr={record?.subjects.map((i: any) => {
                        return {
                          key: i?.id,
                          label: `${i?.name}`,
                        }
                      })}
                    />
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id, _count }) => {
                  return (
                    <Row className="justify-center gap-2">
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "SUA") && (
                        <EditIcon
                          disabled={_count?.subjects > 0 || _count?.archivedAward > 0}
                          onClick={onOpen.bind(null, id)}
                        />
                      )}
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "XOA") && (
                        <DeleteIcon
                          disabled={_count?.subjects > 0 || _count?.archivedAward > 0}
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
