import TableCollapse from "@components/commons/tableCollapse"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma, TrainingCourse } from "@workspace/db/client"
import {
  useCountTrainingCourse,
  useDeleteManyScoreConvert,
  useDeleteScoreConvert,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { SelectTrainingCourse, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Form, message, Row, Tooltip } from "antd"
import _ from "lodash"
import { Copy } from "lucide-react"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface FilterProps {
  trainingCourseId: string | undefined
  active: string | undefined
}

export default function TrainingFieldPage() {
  const { can, canSome } = useAbility()
  const [expandAll, setExpandAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    trainingCourseId: "",
    active: "true",
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const where: Prisma.TrainingCourseWhereInput = useMemo(
    () =>
      filters.trainingCourseId
        ? {
            id: filters.trainingCourseId,
            trainingObjectTypeId,
            deletedAt: null,
            active: true,
          }
        : {
            trainingObjectTypeId,
            deletedAt: null,
            active: true,
          },
    [filters, trainingObjectTypeId]
  )
  const { data = [], refetch } = useFindManyTrainingCourse({
    where,
    include: {
      scoreConverts: {
        orderBy: [{ trainingCourse: { createdAt: "desc" } }, { base10Max: "desc" }],
      },
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: count } = useCountTrainingCourse({ where })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<string>({
    tag: "PutConvertScore",
  })

  const { onOpen: onOpenCopy } = useDisclosure<{ record: TrainingCourse }>({
    tag: "PutCloneConvertScore",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: UpdateScoreConvert } = useDeleteScoreConvert()
  const { mutateAsync: UpdateManyScoreConvert } = useDeleteManyScoreConvert()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await UpdateScoreConvert({
        where: {
          id,
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

  async function handleDeleteMultil(record: TrainingCourse) {
    try {
      showSpinner()

      await UpdateManyScoreConvert({
        where: {
          trainingCourseId: record.id,
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
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={12}>
              <Flex>
                <Form.Item name="trainingCourseId" label="Khoá học">
                  <SelectTrainingCourse
                    placeholder="Chọn khoá"
                    allowClear
                    onChange={(val) => {
                      handleFilterChange("trainingCourseId", val)
                    }}
                  />
                </Form.Item>
              </Flex>
            </Col>
            <Col span={6}>
              <Flex justify="end" className="gap-2">
                <Button onClick={() => setExpandAll(!expandAll)}>
                  {expandAll ? "Thu gọn" : "Mở rộng"}
                </Button>
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                  "THEM"
                ) && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <TableCollapse
            data={data}
            headerRight={(record) => (
              <Row className="justify-center gap-2 mr-2">
                <Tooltip title="Nhân bản">
                  {can(
                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                    "THEM"
                  ) && (
                    <Copy
                      onClick={onOpenCopy.bind(null, {
                        record,
                      })}
                      size={16}
                      strokeWidth={1.5}
                      className="text-sm cursor-pointer"
                    />
                  )}
                </Tooltip>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM, "XOA") && (
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDeleteMultil(record),
                    }}
                  />
                )}
              </Row>
            )}
            columns={[
              {
                title: "Điểm hệ 10 từ",
                dataIndex: "base10Min",
                align: "center",
              },
              {
                title: "Điểm hệ 10 đến",
                dataIndex: "base10Max",
                align: "center",
              },
              {
                title: "Điểm hệ 4",
                dataIndex: "base4",
                align: "center",
              },
              {
                title: "Điểm chữ",
                align: "center",
                dataIndex: "letter",
              },
              // {
              //     title: 'Trạng thái',
              //     align: 'center',
              //     render: (value, record) => {
              //         return !record?.active ? (
              //             <Tag color="error">Không áp dụng</Tag>
              //         ) : (
              //             <Tag color="success">Đang áp dụng</Tag>
              //         )
              //     },
              // },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                          "THEM"
                        ) && (
                          <EditIcon
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                          "THEM"
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
            defaultExpandAll={expandAll}
            headerTitleKey={"name"}
            currentPage={currentPage}
            childrenFieldName="scoreConverts"
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

TrainingFieldPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
