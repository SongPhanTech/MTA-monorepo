import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountDiplomaType,
  useFindManyDiplomaType,
  useUpdateDiplomaType,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function DiplomaType() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    englishName: "",
  })

  const where = useMemo(
    () => ({
      ...(filters.code && filters.code !== ""
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.englishName && filters.englishName !== ""
        ? {
            englishName: {
              contains: filters.englishName,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }),
    [filters.code, filters.name, filters.englishName]
  )

  const { data = [], refetch } = useFindManyDiplomaType({
    where,
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
    orderBy: {
      createdAt: "desc",
    },
  })

  const { data: count } = useCountDiplomaType({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen: onOpenPutDiplomaType } = useDisclosure<string>({
    tag: "PutDiplomaType",
  })

  const handleModal = () => {
    onOpenPutDiplomaType()
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateDiplomaType } = useUpdateDiplomaType()
  async function handleDeleteDiplomaType(id: string) {
    try {
      showSpinner()
      await updateDiplomaType({
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
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DANH_MUC_VAN_BANG, "THEM") && (
                  <Button onClick={handleModal} type="primary">
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
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã bậc",
                dataIndex: "code",
                align: "center",
                width: 150,
                fixed: "left",
                type: "input",
              },
              {
                title: "Tên",
                dataIndex: "name",
                width: 200,
                align: "center",
                fixed: "left",
                type: "input",
              },
              {
                title: "Tên tiếng anh",
                dataIndex: "englishName",
                width: 200,
                align: "center",
                type: "input",
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DANH_MUC_VAN_BANG,
                  "SUA",
                  "XOA"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DANH_MUC_VAN_BANG,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPutDiplomaType(record?.id)
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DANH_MUC_VAN_BANG,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: (e) => {
                                handleDeleteDiplomaType(record?.id)
                                e?.stopPropagation()
                              },
                              onCancel: (e) => {
                                e?.stopPropagation()
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
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

DiplomaType.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
