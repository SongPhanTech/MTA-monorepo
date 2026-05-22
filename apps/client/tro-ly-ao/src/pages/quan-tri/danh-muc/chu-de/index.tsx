import { CheckOutlined, EditOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import DefaultLayout from "@layouts/default-layout"
// import { formatDateReadable } from '@lib/utils'
import {
  useCountTopic,
  useDeleteManyDocumentTopic,
  useDeleteManyPrompt,
  useDeleteTopic,
  useFindManyTopic,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { TRO_LY_AO_PERMISSION } from "@workspace/router"
import { Button, Input, message, Select, Tooltip } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTopics } from "@/hooks/useTopics"

function Page() {
  const { can } = useAbility()
  const { isSystemTopic } = useTopics()
  const [filters, setFilters] = useState<{
    search: string
    isPinned?: boolean | null
  }>({
    search: "",
    isPinned: null,
  })
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10, total: 10 },
  })

  const { onOpen: openPutTopic } = useDisclosure<string>({
    tag: "PutTopic",
  })

  const whereCondition = {
    AND: [
      {
        OR: [
          {
            name: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
          {
            type: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        ],
      },
      ...(filters.isPinned !== null ? [{ isPinned: filters.isPinned }] : []),
    ],
  }

  const { data: totalCountTopic = 0 } = useCountTopic({
    where: whereCondition,
  })

  const { data: topics = [] } = useFindManyTopic({
    where: whereCondition,
    skip: (tableParams.pagination.current - 1) * tableParams.pagination.pageSize,
    take: tableParams.pagination.pageSize,
    orderBy: {
      createdAt: "desc",
    },
  })

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: 1,
        total: totalCountTopic,
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.isPinned, totalCountTopic])

  const { mutateAsync: deleteTopic } = useDeleteTopic()
  const { mutateAsync: deletePrompts } = useDeleteManyPrompt()
  const { mutateAsync: deleteDocumentTopics } = useDeleteManyDocumentTopic()

  const handleDeleteTopic = async (id: string) => {
    if (!id) return

    try {
      await deleteDocumentTopics({
        where: {
          topicId: id,
        },
      })
      await deletePrompts({
        where: {
          topicId: id,
        },
      })
      await deleteTopic({ where: { id } })
      message.success("Xoá chủ đề thành công")
    } catch (_error) {
      message.error("Xoá chủ đề thất bại")
    }
  }

  return (
    <div className="h-full">
      <div className="flex gap-4 h-full overflow-hidden">
        <div className="flex-1 overflow-auto pr-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-xl font-semibold text-gray-700">Quản lý chủ đề</span>
            </div>
            {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_CHU_DE, "THEM") && (
              <Button onClick={() => openPutTopic()} type="primary">
                Thêm mới
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Tìm kiếm theo tên, mô tả..."
              allowClear
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              onPressEnter={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.currentTarget.value,
                }))
              }
              style={{ width: 400 }}
            />
            <Select
              placeholder="Ghim"
              allowClear
              value={filters.isPinned}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isPinned: value,
                }))
              }
              style={{ width: 200 }}
              options={[
                { label: "Đã ghim", value: true },
                { label: "Chưa ghim", value: false },
              ]}
            />
          </div>
          <Table
            rowKey="id"
            scroll={{ x: 1000 }}
            columns={[
              {
                title: "STT",
                dataIndex: "index",
                width: 60,
                align: "center",
                render: (_, __, index) =>
                  (tableParams.pagination.current - 1) * tableParams.pagination.pageSize +
                  index +
                  1,
              },
              {
                title: "Tên chủ đề",
                dataIndex: "name",
                width: 350,
                render: (value) => <span className="font-medium text-gray-900">{value}</span>,
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                width: 400,
                render: (value: string) =>
                  value?.length > 100 ? `${value.slice(0, 100)}...` : value || "Chưa có mô tả",
              },
              {
                title: "Ghim",
                dataIndex: "isPinned",
                width: 80,
                align: "center",
                render: (value: boolean) =>
                  value && <CheckOutlined className="text-green-600 text-lg" />,
              },
              // {
              //     title: 'Ngày tạo',
              //     dataIndex: 'createdAt',
              //     width: 150,
              //     align: 'center',
              //     render: (value) => formatDateReadable(value),
              // },
              {
                title: "Thao tác",
                key: "action",
                align: "center",
                width: 100,
                fixed: "right",
                render: (_, record) => (
                  <div className="flex items-center justify-center gap-2">
                    {!isSystemTopic(record.type) && (
                      <>
                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_CHU_DE, "SUA") && (
                          <Tooltip title="Chỉnh sửa" placement="leftTop">
                            <EditOutlined
                              onClick={() => openPutTopic(record.id)}
                              className="text-blue-700 cursor-pointer text-lg"
                            />
                          </Tooltip>
                        )}
                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_CHU_DE, "XOA") && (
                          <DeleteIcon
                            popConfirm={{
                              title: "Xác nhận xoá chủ đề?",
                              description: "Hành động này sẽ không thể hoàn tác.",
                              onConfirm: () => handleDeleteTopic(record.id),
                            }}
                          />
                        )}
                      </>
                    )}
                    {isSystemTopic(record.type) && (
                      <span className="text-gray-400 text-sm">Chức năng</span>
                    )}
                  </div>
                ),
              },
            ]}
            data={topics || []}
            pagination={{
              ...tableParams.pagination,
              total: totalCountTopic,
            }}
            onChange={(pagination) =>
              setTableParams({
                pagination: {
                  current: pagination.current ?? 1,
                  pageSize: pagination.pageSize ?? 10,
                  total: pagination.total ?? 0,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      permission={TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_CHU_DE}
      breadcrumbList={[{ title: "Quản trị" }, { title: "Chủ đề" }]}
    >
      {page}
    </DefaultLayout>
  )
}

export default Page
