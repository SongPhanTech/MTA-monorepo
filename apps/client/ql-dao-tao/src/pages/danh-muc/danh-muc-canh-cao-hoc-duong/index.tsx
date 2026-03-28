import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountDisciplinaryWarningReason,
  useFindManyDisciplinaryWarningReason,
  useUpdateDisciplinaryWarningReason,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function DisciplinaryWarningReason() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    severityLevel: undefined,
  })
  const { data = [] } = useFindManyDisciplinaryWarningReason({
    where: {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: [
      ...emptyObjectIf(
        [
          {
            severityLevel: filters.severityLevel,
          },
        ],
        !!filters.severityLevel
      ),
      { name: "asc" },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountDisciplinaryWarningReason({
    where: {
      ...(filters.name && filters.name !== ""
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

  const { onOpen: onOpenPutDisciplinaryWarningReason } = useDisclosure<string>({
    tag: "PutDisciplinaryWarningReason",
  })

  const handleModal = () => {
    onOpenPutDisciplinaryWarningReason()
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateDisciplinaryWarningReason } = useUpdateDisciplinaryWarningReason()
  async function handleDeleteDisciplinaryWarningReason(id: string) {
    try {
      showSpinner()
      await updateDisciplinaryWarningReason({
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
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                  "THEM"
                ) && (
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
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
                title: "Mức nâng",
                dataIndex: "severityLevel",
                width: 200,
                align: "center",
                type: "order",
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
                title: "Trạng thái",
                align: "center",
                width: 130,
                fixed: "right",
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                  "SUA",
                  "XOA"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={() => onOpenPutDisciplinaryWarningReason(record?.id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: () => handleDeleteDisciplinaryWarningReason(record?.id),
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

DisciplinaryWarningReason.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
