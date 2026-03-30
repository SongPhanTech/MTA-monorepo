import TableIndexCollapse from "@components/commons/table-collapse-index"
import type { FilterProps } from "@components/commons/typeFilter"
import { store } from "@components/features/tieu-chuan-tieu-chi/sidebar"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import { useStore } from "@tanstack/react-store"
import { emptyObjectIf } from "@workspace/constant"
import { $Enums } from "@workspace/db/client"
import {
  useCountStandardCatalog,
  useDeleteCriterionCatalog,
  useDeleteStandardCatalog,
  useFindManyEvaluationStandardSet,
  useFindManyStandardCatalog,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tooltip, Typography } from "antd"
import { BookPlus, FolderClosed } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ContentTrainingProgram = () => {
  const { can, canSome } = useAbility()
  const [filters, setFilters] = useState<FilterProps>({
    order: undefined,
    name: "",
    searchText: "",
    scoreScalesId: undefined,
  })

  const selectedStandardSetId = useStore(store, (s) => s.selectedStandardSetId)

  const { data: evaluationStandardSets = [] } = useFindManyEvaluationStandardSet({
    where: {
      deletedAt: null,
      objectType: $Enums.StandardCatalogType.PROGRAM,
    },
  })

  const where = useMemo(
    () => ({
      objectType: $Enums.StandardCatalogType.PROGRAM,
      standardSetId: selectedStandardSetId,
      deletedAt: null,
      ...(filters.searchText && {
        name: {
          contains: filters.searchText,
          mode: "insensitive" as const,
        },
      }),
      ...(filters.name && {
        criteria: {
          some: {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          },
        },
      }),
      ...(filters.scoreScalesId && {
        criteria: {
          some: {
            scoreScaleId: Array.isArray(filters.scoreScalesId)
              ? filters.scoreScalesId.length > 1
                ? { in: filters.scoreScalesId }
                : { equals: filters.scoreScalesId[0] }
              : { equals: filters.scoreScalesId },
          },
        },
      }),
    }),
    [filters.searchText, filters.name, filters.scoreScalesId, selectedStandardSetId]
  )

  const { data, isLoading } = useFindManyStandardCatalog({
    where,
    include: {
      criteria: {
        where: {
          ...(filters.name && filters.name !== ""
            ? {
                name: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(filters.scoreScalesId && {
            scoreScaleId: Array.isArray(filters.scoreScalesId)
              ? filters.scoreScalesId.length > 1
                ? { in: filters.scoreScalesId }
                : { equals: filters.scoreScalesId[0] }
              : { equals: filters.scoreScalesId },
          }),
        },
        orderBy: [
          ...emptyObjectIf(
            [
              {
                order: filters.order,
              },
            ],
            !!filters.order
          ),
          { order: "asc" },
        ],
      },
    },
    orderBy: [{ order: "asc" }],
  })

  const { data: count } = useCountStandardCatalog({
    where: {
      ...where,
    },
  })

  const selectedStandardSet = evaluationStandardSets.find((set) => set.id === selectedStandardSetId)

  const { onOpen: onOpenPutStandardCatalog } = useDisclosure<{
    id: string
    count: number
    objectType?: $Enums.StandardCatalogType
    standardSetId?: string
  }>({
    tag: "PutStandardCatalog",
  })

  const { onOpen: onOpenPutCriterionCatalog } = useDisclosure<{
    id: string
    standardId: string
  }>({
    tag: "PutCriterionCatalog",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: deleteStandardCatalog } = useDeleteStandardCatalog()
  async function handleDeleteStandardCatalog(id: string) {
    try {
      showSpinner()
      await deleteStandardCatalog({
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

  const { mutateAsync: deleteCriterionCatalog } = useDeleteCriterionCatalog()
  async function handleDeleteCriterionCatalog(id: string) {
    try {
      showSpinner()
      await deleteCriterionCatalog({
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

  return (
    <div>
      {!selectedStandardSet ? (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <FolderClosed className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chọn bộ tiêu chuẩn - tiêu chí chương trình đào tạo
          </h3>
          <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
            Vui lòng chọn một bộ tiêu chuẩn - tiêu chí chương trình đào tạo
          </p>
        </div>
      ) : (
        <Row gutter={[16, 0]}>
          <Col span={24}>
            <Flex justify="space-between" align="center">
              <Typography.Title level={4}>
                Danh mục tiêu chuẩn - tiêu chí chương trình đào tạo
              </Typography.Title>

              {can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                "THEM"
              ) && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    onOpenPutStandardCatalog({
                      id: "",
                      count: count || 0,
                      objectType: $Enums.StandardCatalogType.PROGRAM,
                      standardSetId: selectedStandardSetId,
                    })
                  }}
                >
                  <BookPlus />
                  Thêm mới
                </Button>
              )}
            </Flex>
          </Col>

          <Col span={24}>
            <TableIndexCollapse
              rowKey="id"
              headerTitleKey={({ order, name }) => `${[order, name].filter(Boolean).join(" - ")}`}
              className="w-full mt-2"
              loading={isLoading}
              scroll={{ y: "calc(100vh - 200px)" }}
              childrenFieldName="criteria"
              defaultExpandAll
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
              }}
              headerRight={(record) => (
                <div className="flex px-3 gap-2.5 items-center justify-end">
                  {can(
                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                    "THEM"
                  ) && (
                    <CreateIcon
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPutCriterionCatalog({
                          id: "",
                          standardId: record?.id,
                        })
                      }}
                      title="Thêm mới tiêu chuẩn"
                      className="text-green-600 cursor-pointer"
                    />
                  )}
                  {can(
                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                    "SUA"
                  ) && (
                    <EditIcon
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPutStandardCatalog({
                          id: record?.id,
                          count: count || 0,
                          standardSetId: selectedStandardSetId,
                        })
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                  )}
                  {can(
                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                    "XOA"
                  ) &&
                    (() => {
                      const hasCriteria = record?.criteria?.length > 0

                      return (
                        <Tooltip
                          placement="top"
                          title={hasCriteria ? "Không thể xóa vì tiêu chuẩn đã có tiêu chí" : ""}
                        >
                          <DeleteIcon
                            disabled={hasCriteria}
                            className={
                              hasCriteria ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            }
                            popConfirm={
                              hasCriteria
                                ? undefined
                                : {
                                    onConfirm: (e) => {
                                      handleDeleteStandardCatalog(record?.id)
                                      e?.stopPropagation()
                                    },
                                    onCancel: (e) => {
                                      e?.stopPropagation()
                                    },
                                  }
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          />
                        </Tooltip>
                      )
                    })()}
                </div>
              )}
              columns={[
                {
                  title: "Tiêu chí",
                  dataIndex: "name",
                  type: "input",
                },
                {
                  title: "Thao tác",
                  align: "center",
                  width: 120,
                  hidden: !canSome(
                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                    "SUA",
                    "XOA"
                  ),
                  render: (_, record) => {
                    if (record?.id) {
                      return (
                        <Row className="justify-center gap-2">
                          {can(
                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                            "SUA"
                          ) && (
                            <EditIcon
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenPutCriterionCatalog({
                                  id: record?.id,
                                  standardId: record?.standardId,
                                })
                              }}
                              className="text-sm text-blue-700 cursor-pointer"
                            />
                          )}
                          {can(
                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                            "XOA"
                          ) && (
                            <DeleteIcon
                              popConfirm={{
                                onConfirm: (e) => {
                                  handleDeleteCriterionCatalog(record?.id)
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
                    return ""
                  },
                },
              ]}
              data={data}
              pagination={false}
            />
          </Col>
        </Row>
      )}
    </div>
  )
}

export default ContentTrainingProgram
