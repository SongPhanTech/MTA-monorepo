import CommentList from "@components/commons/comment-list"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import type { DataTabType } from "@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis"
import {
  DEADLINE_OPTIONS,
  EVALUATION_CRITERION_STATUS_OPTIONS,
  getStatusEvaluation,
} from "@constants/constants"
import { formatDate } from "@lib/utils"
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from "@workspace/db"
import type { $Enums } from "@workspace/db/client"
import { Badge, Button, Empty, Tag } from "antd"
import dayjs from "dayjs"
import { MessageCircle } from "lucide-react"
import { useState } from "react"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"

const CriteriaAnalysisPeriodSubPage = ({
  data,
  handleViewAll,
}: {
  data: DataTabType
  idx: number
  refetch: () => void
  handleViewAll: () => void
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<$Enums.EvaluationCriterionStatus | null>(null)
  const [deadlineFilter, setDeadlineFilter] = useState<string | null>(null)

  const toggleCommentRow = (recordId: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    )
  }

  const filteredCriteria = data?.criteria?.filter((item) => {
    if (!item.analysisCriterions) return false

    if (statusFilter && item.analysisCriterions.status !== statusFilter) {
      return false
    }

    if (deadlineFilter && item.analysisCriterions.deadline) {
      const now = dayjs()
      const deadlineDate = dayjs(item.analysisCriterions.deadline)
      const daysUntilDeadline = deadlineDate.diff(now, "day")

      if (deadlineFilter === "overdue" && daysUntilDeadline >= 0) return false
      if (deadlineFilter === "near" && (daysUntilDeadline < 0 || daysUntilDeadline > 3))
        return false
      if (deadlineFilter === "normal" && daysUntilDeadline <= 3) return false
    } else if (deadlineFilter && !item.analysisCriterions.deadline) {
      return false
    }

    return true
  })

  return (
    <div className="h-[calc(100vh-230px)] overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base">
          {(() => {
            const colonIdx = data?.name?.indexOf(": ")
            if (colonIdx !== undefined && colonIdx !== -1) {
              return (
                <>
                  <span className="font-bold">{data?.name?.substring(0, colonIdx + 1)} </span>
                  <span>{data?.name?.substring(colonIdx + 2)}</span>
                </>
              )
            }
            return <span className="font-bold">{data?.name}</span>
          })()}
        </div>
        <div className="flex gap-2">
          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            style={{ width: 200, height: 27 }}
            options={EVALUATION_CRITERION_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
          />
          <Select
            allowClear
            placeholder="Lọc theo hạn"
            style={{ width: 150, height: 27 }}
            options={DEADLINE_OPTIONS}
            value={deadlineFilter}
            onChange={(value) => setDeadlineFilter(value)}
          />
          {/* <Button type="primary" size="small" onClick={handleViewAll}>
            Xuất file
          </Button> */}
        </div>
      </div>
      {!filteredCriteria || filteredCriteria.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-50px)]">
          <Empty description="Không có dữ liệu" />
        </div>
      ) : (
        filteredCriteria?.map((item, idx: number) => {
          if (!item.analysisCriterions) return null
          const status = item.analysisCriterions?.status
          const statusConfig = getStatusEvaluation(status)
          const deadline = item.analysisCriterions?.deadline
          const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

          return (
            <div key={item.id} className="ml-4 mb-6">
              <div className="mb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-base flex items-start gap-2 mb-2">
                      {(() => {
                        const colonIdx = item?.name?.indexOf(": ")
                        if (colonIdx !== undefined && colonIdx !== -1) {
                          return (
                            <>
                              <span className="font-bold whitespace-nowrap">
                                {item?.name?.substring(0, colonIdx + 1)}
                              </span>
                              <span className="flex-1">{item?.name?.substring(colonIdx + 2)}</span>
                            </>
                          )
                        }
                        return <span className="flex-1 font-bold">{item?.name}</span>
                      })()}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      (
                      <span className="text-sm text-gray-600">
                        Người thực hiện:{" "}
                        {item?.analysisCriterions?.lecturer?.userProfile?.fullname ||
                          "Chưa phân công"}
                      </span>
                      )
                      {deadline && deadlineStatus && (
                        <Tag color={deadlineStatus.color}>
                          Hạn: {formatDate(deadline)}
                          {deadlineStatus.text && ` (${deadlineStatus.text})`}
                        </Tag>
                      )}
                      <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Table
                  rowKey="id"
                  columns={[
                    {
                      title: "STT",
                      width: 30,
                      align: "center",
                      render: (_, __, index) => index + 1,
                    },
                    {
                      title: "Phân tích tiêu chí",
                      children: [
                        {
                          title: "Các yêu cầu",
                          dataIndex: "name",
                          width: 150,
                          type: "input",
                        },
                        {
                          title: "Các câu hỏi đặt ra",
                          dataIndex: "questions",
                          width: 150,
                          render: (questions: string[]) => {
                            return (
                              <div className="flex flex-col gap-2">
                                {questions?.map((question: string) => {
                                  return <div key={question}>- {question}</div>
                                })}
                              </div>
                            )
                          },
                        },
                      ],
                    },
                    {
                      title: "Thông tin minh chứng",
                      children: [
                        {
                          title: "Tên minh chứng",
                          width: 200,
                          align: "left",
                          render: (record: { evidences: AnalysisFormEvidence[] }) => {
                            return record?.evidences.length ? (
                              <div className="flex flex-col gap-2">
                                {record?.evidences?.map(
                                  (
                                    evidence: AnalysisFormEvidence & {
                                      evidence?: Evidence
                                    }
                                  ) => {
                                    return <div key={evidence.id}>- {evidence?.evidence?.name}</div>
                                  }
                                )}
                              </div>
                            ) : (
                              ""
                            )
                          },
                        },
                        {
                          title: "Nơi thu thập",
                          width: 120,
                          render: (record: RequirementCriterion) => {
                            return record?.evidencePlaces || ""
                          },
                        },
                        {
                          title: "Phương pháp thu thập",
                          width: 120,
                          render: (record: RequirementCriterion) => {
                            return record?.collectionMethod || ""
                          },
                        },
                      ],
                    },
                    {
                      title: "Thao tác",
                      width: 50,
                      align: "center",
                      render: (__, record) => {
                        const commentCount = record.evaluationCriterionComment?.length || 0

                        return (
                          <div className="flex gap-2 items-center justify-center">
                            {commentCount > 0 && (
                              <Badge count={commentCount} size="small">
                                <MessageCircle
                                  size={16}
                                  strokeWidth={1.5}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCommentRow(record.id)
                                  }}
                                />
                              </Badge>
                            )}
                          </div>
                        )
                      },
                    },
                  ]}
                  data={item?.analysisCriterions?.requirementCriterions || []}
                  pagination={false}
                  expandable={{
                    expandedRowKeys: expandedRowKeys,
                    expandedRowRender: (record) => {
                      return (
                        <div>
                          <CommentList
                            comments={record.evaluationCriterionComment || []}
                            lecturerUserProfileId={
                              item.analysisCriterions?.lecturer?.userProfileId ||
                              item.analysisCriterions?.lecturer?.userProfile?.id
                            }
                          />
                        </div>
                      )
                    },
                    rowExpandable: (record) =>
                      (record?.evaluationCriterionComment?.length || 0) > 0,
                    onExpand: (_, record) => {
                      toggleCommentRow(record.id)
                    },
                    expandIconColumnIndex: -1,
                  }}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default CriteriaAnalysisPeriodSubPage
