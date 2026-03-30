import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountRequirementCriterionCatalog,
  useFindManyRequirementCriterionCatalog,
  useUpdateRequirementCriterionCatalog,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function RequirementCriterionCatalog() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const criterionCatalogId = router.query.id as string
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    order: undefined,
  })

  const where = useMemo(
    () => ({
      criterionCatalogId,
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }),
    [filters.name, criterionCatalogId]
  )

  const { data, refetch } = useFindManyRequirementCriterionCatalog({
    where,
    orderBy: [
      ...emptyObjectIf(
        [
          {
            order: filters.order,
          },
        ],
        !!filters.order
      ),
      { order: "desc" },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountRequirementCriterionCatalog({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen: onOpenPutRequirementCriterionCatalog } = useDisclosure<{
    id: string
    criterionCatalogId: string
  }>({
    tag: "PutRequirementCriterionCatalog",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateRequirementCriterionCatalog } = useUpdateRequirementCriterionCatalog()
  async function handleDeleteRequirementCriterionCatalog(id: string) {
    try {
      showSpinner()
      await updateRequirementCriterionCatalog({
        where: { id },
        data: { deletedAt: new Date() },
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
          <Row gutter={[16, 16]} align="top">
            {/* Thêm mới */}
            <Col span={24}>
              <Flex justify="end">
                {can(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                  "THEM"
                ) && (
                  <Button
                    type="primary"
                    onClick={() => {
                      onOpenPutRequirementCriterionCatalog({
                        id: "",
                        criterionCatalogId,
                      })
                    }}
                  >
                    <BookPlus />
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
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 30,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Thứ tự",
                dataIndex: "order",
                width: 200,
                align: "center",
                type: "order",
              },
              {
                title: "Yêu cầu",
                dataIndex: "name",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Câu hỏi",
                dataIndex: "questions",
                width: 200,
                align: "center",
                render: (value) => (
                  <div className="text-left">
                    {value?.map((item: any, index: number) => (
                      <div key={`${index + 1}`}>- {item}</div>
                    ))}
                  </div>
                ),
              },
              {
                title: "Mô tả",
                width: 200,
                align: "center",
                dataIndex: "description",
                render: (value: string) => {
                  return (
                    <Tooltip title={value}>
                      <div className="line-clamp-2">{value}</div>
                    </Tooltip>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
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
                              onOpenPutRequirementCriterionCatalog({
                                id: record?.id,
                                criterionCatalogId,
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
                                handleDeleteRequirementCriterionCatalog(record?.id)
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

RequirementCriterionCatalog.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        {
          title: "QL tự đánh giá CTĐT",
        },
        {
          title: "Tiêu chuẩn, tiêu chí",
          href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
        },
        {
          title: "Danh mục yêu cầu",
        },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
