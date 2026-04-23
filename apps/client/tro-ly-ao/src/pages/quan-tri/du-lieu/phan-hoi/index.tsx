import { CommentOutlined, EyeOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import DefaultLayout from "@layouts/default-layout"
import { formatDateReadable } from "@lib/utils"
import { $Enums } from "@workspace/db"
import {
  useCountConversationFeedback,
  useDeleteConversationFeedback,
  useFindManyConversationFeedback,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { TRO_LY_AO_PERMISSION } from "@workspace/router"
import { Button, DatePicker, Empty, Input, Modal, Rate, Select, Tooltip, message } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useMemo, useState } from "react"

const { RangePicker } = DatePicker

// Map FeedbackRating enum -> số sao (1..5)
const STAR_BY_RATING: Record<$Enums.FeedbackRating, number> = {
  VERY_BAD: 1,
  BAD: 2,
  NORMAL: 3,
  GOOD: 4,
  VERY_GOOD: 5,
}

const RATING_OPTIONS: { label: string; value: $Enums.FeedbackRating }[] = [
  { label: "Rất không hài lòng (1★)", value: $Enums.FeedbackRating.VERY_BAD },
  { label: "Không hài lòng (2★)", value: $Enums.FeedbackRating.BAD },
  { label: "Bình thường (3★)", value: $Enums.FeedbackRating.NORMAL },
  { label: "Hài lòng (4★)", value: $Enums.FeedbackRating.GOOD },
  { label: "Rất hài lòng (5★)", value: $Enums.FeedbackRating.VERY_GOOD },
]

type FeedbackFilter = {
  comment: string
  rating?: $Enums.FeedbackRating
  range?: [Dayjs, Dayjs]
}

type SelectedFeedback = {
  id: string
  rating: $Enums.FeedbackRating
  comment?: string | null
  conversationNameSnapshot?: string | null
  topicNameSnapshot?: string | null
  messagesSnapshot?: any
  createdAt: string | Date
  conversationId?: string | null
}

function Page() {
  const { can } = useAbility()
  const [params, setParams] = useState({
    pagination: { current: 1, pageSize: 10, total: 0 },
  })
  const [filter, setFilter] = useState<FeedbackFilter>({ comment: "" })
  const [selected, setSelected] = useState<SelectedFeedback | null>(null)

  const where = useMemo(() => {
    const w: any = {}
    if (filter.comment) {
      w.comment = { contains: filter.comment, mode: "insensitive" }
    }
    if (filter.rating) {
      w.rating = filter.rating
    }
    if (filter.range && filter.range[0] && filter.range[1]) {
      w.createdAt = {
        gte: filter.range[0].startOf("day").toDate(),
        lte: filter.range[1].endOf("day").toDate(),
      }
    }
    return w
  }, [filter])

  const { data: total = 0 } = useCountConversationFeedback({ where })

  const { data: feedbacks = [] } = useFindManyConversationFeedback({
    where,
    orderBy: { createdAt: "desc" },
    skip: (params.pagination.current - 1) * params.pagination.pageSize,
    take: params.pagination.pageSize,
  })

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, total },
    }))
  }, [total])

  const { mutateAsync: deleteFeedback } = useDeleteConversationFeedback()

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xoá phản hồi",
      content: "Bạn có chắc muốn xoá phản hồi này?",
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await deleteFeedback({ where: { id } })
          message.success("Đã xoá phản hồi")
        } catch (e) {
          console.error(e)
          message.error("Xoá phản hồi thất bại")
        }
      },
    })
  }

  return (
    <div className="h-full">
      <div className="flex gap-4 h-full overflow-hidden">
        <div className="flex-1 overflow-auto pr-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-semibold text-gray-700">
              Phản hồi hội thoại người dùng
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Input
              placeholder="Tìm theo nội dung phản hồi"
              allowClear
              onPressEnter={(e) =>
                setFilter((prev) => ({ ...prev, comment: e.currentTarget.value }))
              }
              onChange={(e) => {
                if (!e.target.value) {
                  setFilter((prev) => ({ ...prev, comment: "" }))
                }
              }}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Mức đánh giá"
              allowClear
              style={{ width: 220 }}
              value={filter.rating}
              onChange={(value) => setFilter((prev) => ({ ...prev, rating: value }))}
              options={RATING_OPTIONS}
            />
            <RangePicker
              format="DD/MM/YYYY"
              onChange={(range) =>
                setFilter((prev) => ({
                  ...prev,
                  range: (range as [Dayjs, Dayjs]) || undefined,
                }))
              }
            />
          </div>
          <Table
            scroll={{ x: 1200 }}
            columns={[
              {
                title: "STT",
                dataIndex: "index",
                width: 60,
                align: "center",
                render: (_, __, index) =>
                  (params.pagination.current - 1) * params.pagination.pageSize + index + 1,
              },
              {
                title: "Hội thoại",
                dataIndex: "conversationNameSnapshot",
                width: 280,
                render: (value: string | null, record: any) => (
                  <div>
                    <div className="truncate max-w-[260px]">
                      {value || <span className="text-gray-400">(Không có tiêu đề)</span>}
                    </div>
                    {!record.conversationId && (
                      <div className="text-xs text-orange-500 mt-1">Hội thoại đã bị xoá</div>
                    )}
                  </div>
                ),
              },
              {
                title: "Chủ đề",
                dataIndex: "topicNameSnapshot",
                width: 160,
                render: (value: string | null) => value || "—",
              },
              {
                title: "Đánh giá",
                dataIndex: "rating",
                width: 180,
                align: "center",
                render: (value: $Enums.FeedbackRating) => (
                  <Rate disabled value={STAR_BY_RATING[value]} />
                ),
              },
              {
                title: "Nội dung phản hồi",
                dataIndex: "comment",
                width: 320,
                render: (value: string | null) =>
                  value ? (
                    <Tooltip title={value} placement="topLeft">
                      <span>{value.length > 120 ? `${value.slice(0, 120)}...` : value}</span>
                    </Tooltip>
                  ) : (
                    <span className="text-gray-400">—</span>
                  ),
              },
              {
                title: "Người gửi",
                dataIndex: "createdBy",
                width: 160,
                render: (value: string | null, record: any) =>
                  value ? (
                    <span className="text-xs">SSO: {String(value).slice(0, 8)}...</span>
                  ) : record.sessionId ? (
                    <span className="text-xs text-gray-500">
                      Khách: {String(record.sessionId).slice(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  ),
              },
              {
                title: "Ngày gửi",
                dataIndex: "createdAt",
                width: 160,
                render: (value: string | Date) => formatDateReadable(value),
              },
              {
                title: "Thao tác",
                dataIndex: "action",
                width: 120,
                align: "center",
                fixed: "right",
                render: (_: any, record: any) => (
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip title="Xem chi tiết">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => setSelected(record as SelectedFeedback)}
                      />
                    </Tooltip>
                    {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_PHAN_HOI, "XOA") && (
                      <Tooltip title="Xoá">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteIcon />}
                          onClick={() => handleDelete(record.id)}
                        />
                      </Tooltip>
                    )}
                  </div>
                ),
              },
            ]}
            data={feedbacks as any}
            pagination={{
              ...params.pagination,
              onChange: (page, pageSize) =>
                setParams({
                  pagination: {
                    current: page,
                    pageSize,
                    total: params.pagination.total,
                  },
                }),
            }}
          />
        </div>
      </div>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        title={
          <span>
            <CommentOutlined className="mr-2" />
            Chi tiết phản hồi
          </span>
        }
        width={800}
      >
        {selected && (
          <div className="space-y-3">
            <div>
              <span className="font-medium">Hội thoại: </span>
              <span>{selected.conversationNameSnapshot || "(Không có tiêu đề)"}</span>
              {!selected.conversationId && (
                <span className="ml-2 text-xs text-orange-500">(đã bị xoá)</span>
              )}
            </div>
            {selected.topicNameSnapshot && (
              <div>
                <span className="font-medium">Chủ đề: </span>
                <span>{selected.topicNameSnapshot}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Đánh giá: </span>
              <Rate disabled value={STAR_BY_RATING[selected.rating]} />
            </div>
            <div>
              <span className="font-medium">Ngày gửi: </span>
              <span>{formatDateReadable(selected.createdAt)}</span>
            </div>
            {selected.comment && (
              <div>
                <div className="font-medium mb-1">Nội dung phản hồi:</div>
                <div className="px-3 py-2 bg-gray-50 rounded whitespace-pre-wrap">
                  {selected.comment}
                </div>
              </div>
            )}
            <div>
              <div className="font-medium mb-2">Lịch sử hội thoại (snapshot):</div>
              {Array.isArray(selected.messagesSnapshot) && selected.messagesSnapshot.length > 0 ? (
                <div className="max-h-[400px] overflow-auto space-y-2 pr-1">
                  {selected.messagesSnapshot.map((m: any, i: number) => {
                    const isUser = m.sender === $Enums.MessageSender.USER
                    return (
                      <div
                        key={m.id || i}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-wrap text-sm ${
                            isUser ? "bg-blue-100 text-gray-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            {isUser ? "Người dùng" : "Trợ lý"}
                            {m.createdAt && (
                              <span className="ml-2">
                                {dayjs(m.createdAt).format("HH:mm DD/MM/YYYY")}
                              </span>
                            )}
                          </div>
                          {m.content || <span className="text-gray-400">(trống)</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Empty description="Không có dữ liệu hội thoại được lưu" />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout breadcrumbList={[{ title: "Dữ liệu" }, { title: "Phản hồi hội thoại" }]}>
      {page}
    </DefaultLayout>
  )
}

export default Page
