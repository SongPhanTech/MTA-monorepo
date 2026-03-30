import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DocumentFile } from "@workspace/db/client"
import {
  useCountNotification,
  useFindManyNotification,
  useUpdateNotification,
} from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import Link from "next/link"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function ThongBao() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_searchText, _setSearchText] = useState<string>("")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const { data = [], refetch } = useFindManyNotification({
    where: {},
    include: {
      attachments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountNotification({
    where: {
      code: { contains: filters.code, mode: "insensitive" },
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
    tag: "PutNotificationModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateNotification } = useUpdateNotification()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateNotification({
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
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={4}>
              <Flex justify="end" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_BAO, "THEM") && (
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
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tiêu đề thông báo",
                dataIndex: "title",
                type: "input",
              },
              {
                title: "Nội dung thông báo",
                dataIndex: "content",
                type: "input",
                render: (value) => (
                  <div
                    className="max-h-10 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                ),
              },
              {
                title: "Ngày đăng",
                align: "center",
                width: 120,
                dataIndex: "publishedAt",
                type: "date",
                render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Ngày hết hạn",
                align: "center",
                width: 120,
                dataIndex: "expiresAt",
                type: "date",
                render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Tài liệu đính kèm",
                width: 180,
                dataIndex: "attachments",
                type: "date",
                render: (_, record) =>
                  record.attachments && record.attachments.length > 0 ? (
                    <p className="flex flex-col gap-1">
                      {record.attachments.map((item: DocumentFile) => (
                        <Link href={getMinioUrl(item.path)} className="line-clamp-1">
                          - {item.name}
                        </Link>
                      ))}
                    </p>
                  ) : (
                    "Không có tài liệu"
                  ),
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                dataIndex: "active",
                type: "date",
                render: (value) =>
                  value ? <Tag color="green">Hiển thị</Tag> : <Tag color="red">Không hiển thị</Tag>,
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                hidden: !canSome(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_BAO, "SUA", "XOA"),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_BAO, "SUA") && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_BAO, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

ThongBao.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
