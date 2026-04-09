import Select from "@components/commons/select"
import TableCollapse from "@components/commons/tableCollapse"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { type Prisma, RankingContext, type TrainingCourse } from "@workspace/db/client"
import {
  useCountTrainingCourse,
  useDeleteAcademicRankingConvert,
  useDeleteManyAcademicRankingConvert,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Input, message, Row, Tag, Tooltip } from "antd"
import _ from "lodash"
import { Copy, Search } from "lucide-react"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface FilterProps {
  searchText: string | undefined
  active: string | undefined
}

const DataActive = [
  { value: "true", name: "Đang áp dụng" },
  { value: "false", name: "Không áp dụng" },
  { value: "all", name: "Tất cả" },
]

export default function AcademicRankingConvertPage() {
  const { can, canSome } = useAbility()
  const [expandAll, setExpandAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    active: "true",
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const where: Prisma.TrainingCourseWhereInput = useMemo(
    () => ({
      active: true,
      academicRankingConvert: {
        some: {
          ...(filters.active === "true" ? { active: true } : {}),
          ...(filters.active === "false" ? { active: false } : {}),
          ...(filters.searchText && filters.searchText.trim() !== ""
            ? {
                OR: [
                  {
                    AND: [
                      {
                        base10Min: {
                          lte: Number(filters.searchText) || 0,
                        },
                      },
                      {
                        base10Max: {
                          gte: Number(filters.searchText) || 9999,
                        },
                      },
                    ],
                  },
                  {
                    classification: {
                      contains: filters.searchText,
                    },
                  },
                ],
              }
            : {}),
        },
      },
      trainingObjectTypeId,
      deletedAt: null,
    }),
    [filters, trainingObjectTypeId]
  )

  const { data = [], refetch } = useFindManyTrainingCourse({
    where,
    include: {
      academicRankingConvert: {
        where: {
          context: RankingContext.STUDYING,
          ...(filters.active === "true" ? { active: true } : {}),
          ...(filters.active === "false" ? { active: false } : {}),
          ...(filters.searchText && filters.searchText.trim() !== ""
            ? {
                OR: [
                  {
                    AND: [
                      {
                        base10Min: {
                          lte: Number(filters.searchText) || 0,
                        },
                      },
                      {
                        base10Max: {
                          gte: Number(filters.searchText) || 9999,
                        },
                      },
                    ],
                  },
                  {
                    classification: {
                      contains: filters.searchText,
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ rankOrder: "asc" }, { base10Max: "desc" }],
      },
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: count } = useCountTrainingCourse({ where: { ...where, deletedAt: null } })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<{ id: string }>({
    tag: "PutAcademicRanking",
  })

  const { onOpen: onOpenCopy } = useDisclosure<{ record: TrainingCourse }>({
    tag: "PutCloneAcademicRanking",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: deleteAcademicRanking } = useDeleteAcademicRankingConvert()
  const { mutateAsync: deleteManyAcademicRanking } = useDeleteManyAcademicRankingConvert()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await deleteAcademicRanking({
        where: { id },
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

      await deleteManyAcademicRanking({
        where: {
          trainingCourseId: record.id,
          context: RankingContext.STUDYING,
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
                <Input
                  id="search"
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  placeholder="Tìm kiếm điểm"
                  style={{
                    width: 300,
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
                {/* <Select
                  id="active"
                  placeholder="Chọn trạng thái"
                  style={{ width: 200 }}
                  options={DataActive.map((item) => ({
                    label: item.name,
                    value: item.value === undefined ? undefined : item.value.toString(),
                  }))}
                  onChange={(value) => handleFilterChange("active", value)}
                /> */}
              </Flex>
            </Col>
            <Col span={6}>
              <Flex justify="end" className="gap-2">
                <Button onClick={() => setExpandAll(!expandAll)}>
                  {expandAll ? "Thu gọn" : "Mở rộng"}
                </Button>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC, "THEM") && (
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
            defaultExpandAll={expandAll}
            headerRight={(record) => (
              <Row className="justify-center gap-2 mr-2">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC, "THEM") &&
                  record.academicRankingConvert.length > 0 && (
                    <Tooltip title="Nhân bản">
                      <Copy
                        onClick={onOpenCopy.bind(null, { record })}
                        size={16}
                        strokeWidth={1.5}
                        className="text-sm cursor-pointer"
                      />
                    </Tooltip>
                  )}

                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC, "XOA") && (
                  <DeleteIcon
                    disabled={!record.academicRankingConvert.length}
                    title="Xóa xếp loại của khoá"
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
                title: "Điểm hệ 4 từ",
                dataIndex: "base4Min",
                align: "center",
              },
              {
                title: "Điểm hệ 4 đến",
                dataIndex: "base4Max",
                align: "center",
              },
              {
                title: "Xếp loại",
                dataIndex: "classification",
                width: 120,
              },
              // {
              //   title: "Trạng thái",
              //   align: "center",
              //   render: (record) => {
              //     return !record?.active ? (
              //       <Tag color="error">Không áp dụng</Tag>
              //     ) : (
              //       <Tag color="success">Đang áp dụng</Tag>
              //     )
              //   },
              // },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC, "SUA") && (
                          <EditIcon
                            onClick={() => onOpen({ id })}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC, "XOA") && (
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
            headerTitleKey={"name"}
            currentPage={currentPage}
            childrenFieldName="academicRankingConvert"
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

AcademicRankingConvertPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
