import CommentList from "@components/commons/comment-list"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import ExportCriteriaAnalysis from "@components/modal/export-criteria-analysis"
import ImportCriteriaAnalysis from "@components/modal/import-criteria-analysis"
import {
  DEADLINE_OPTIONS,
  EVALUATION_CRITERION_STATUS_OPTIONS,
  getRejectedBy,
  getStatusEvaluation,
} from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from "@workspace/db"
import {
  $Enums,
  type AnalysisCriterion,
  type CriterionPeriod,
  type EvaluationCriterionComment,
  type StandardPeriod,
} from "@workspace/db/client"
import { useUpdateAnalysisCriterion } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Badge, Button, Empty, message, Popconfirm, Tag } from "antd"
import dayjs from "dayjs"
import { MessageCircle } from "lucide-react"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"

export type DataTabType = StandardPeriod & {
  criteria: (CriterionPeriod & {
    analysisCriterions?:
      | (AnalysisCriterion & {
          lecturer?: {
            userProfile?: { id?: string; fullname?: string | null } | null
            userProfileId?: string
          } | null
          requirementCriterions: (RequirementCriterion & {
            evidences: (AnalysisFormEvidence & {
              evidence: Evidence
            })[]
            evaluationCriterionComment?: EvaluationCriterionComment[]
          })[]
          evaluationCriterionComments?: EvaluationCriterionComment[]
        })
      | null
  })[]
}

const CriteriaAnalysisSubPage = ({
  data,
  userRole,
  idx,
  refetch,
}: {
  data: DataTabType
  userRole: "P13" | "GV"
  idx: number
  refetch: () => void
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<$Enums.EvaluationCriterionStatus | null>(null)
  const [deadlineFilter, setDeadlineFilter] = useState<string | null>(null)
  const { can } = useAbility()

  const { onOpen } = useDisclosure<{
    id?: string
    analysisCriterionId?: string
    refetch?: () => void
    count?: number
  }>({
    tag: "PutTieuChiMinhChungModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const toggleCommentRow = (recordId: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    )
  }

  const { mutateAsync: updateCriterion } = useUpdateAnalysisCriterion()

  const handleSubmitCriterion = async (
    analysisCriterionId: string,
    description?: string | null
  ) => {
    try {
      showSpinner()
      const rejectedBy = getRejectedBy(description)
      const isAdvisoryRejected = rejectedBy === "ADVISORY_BOARD"
      const targetStatus = isAdvisoryRejected
        ? $Enums.EvaluationCriterionStatus.APPROVED
        : $Enums.EvaluationCriterionStatus.SUBMITTED

      await updateCriterion({
        where: {
          id: analysisCriterionId,
        },
        data: {
          status: targetStatus,
        },
      })

      if (isAdvisoryRejected) {
        message.success("Đã nộp lại phiếu phân tích tiêu chí lên Ban tư vấn phê duyệt.")
      } else {
        message.success("Đã nộp phiếu phân tích tiêu chí lên Trưởng ban thư ký phê duyệt.")
      }
      refetch()
    } catch (error) {
      message.error("Nộp tiêu chí thất bại. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const handleSubmitAllCriteria = async () => {
    try {
      showSpinner()
      const criteriaToSubmit = filteredCriteria?.filter((item) => {
        const status = item.analysisCriterions?.status
        return (
          status !== $Enums.EvaluationCriterionStatus.SUBMITTED &&
          status !== $Enums.EvaluationCriterionStatus.APPROVED &&
          status !== $Enums.EvaluationCriterionStatus.COMPLETED
        )
      })

      if (!criteriaToSubmit || criteriaToSubmit.length === 0) {
        message.warning("Không có tiêu chí nào để nộp.")
        return
      }

      await Promise.all(
        criteriaToSubmit.map((item) => {
          const rejectedBy = getRejectedBy(item.analysisCriterions?.description)
          const targetStatus =
            rejectedBy === "ADVISORY_BOARD"
              ? $Enums.EvaluationCriterionStatus.APPROVED
              : $Enums.EvaluationCriterionStatus.SUBMITTED
          return updateCriterion({
            where: {
              id: item.analysisCriterions?.id,
            },
            data: {
              status: targetStatus,
            },
          })
        })
      )

      message.success(`Nộp thành công ${criteriaToSubmit.length} tiêu chí.`)
      refetch()
    } catch (error) {
      message.error("Nộp tiêu chí thất bại. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
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

  const hasSubmittableCriteria = filteredCriteria?.some((item) => {
    const status = item.analysisCriterions?.status
    return (
      status !== $Enums.EvaluationCriterionStatus.APPROVED &&
      status !== $Enums.EvaluationCriterionStatus.COMPLETED &&
      status !== $Enums.EvaluationCriterionStatus.SUBMITTED &&
      status !== $Enums.EvaluationCriterionStatus.REVISION
    )
  })

  return (
    <div className="h-[calc(100vh-230px)] overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base text-green-700">
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
          {userRole !== "P13" &&
            can(
              KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
              "THEM"
            ) &&
            hasSubmittableCriteria && (
              <Popconfirm
                title="Xác nhận nộp tất cả tiêu chí"
                description="Bạn chắc chắn muốn nộp tất cả tiêu chí này?"
                onConfirm={handleSubmitAllCriteria}
                okText="Đồng ý"
                cancelText="Hủy"
                placement="topRight"
              >
                <Button type="primary" size="small">
                  Nộp tất cả
                </Button>
              </Popconfirm>
            )}
          {userRole !== "P13" &&
            can(
              KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
              "THEM"
            ) && <ImportCriteriaAnalysis data={data} refetch={refetch} />}
          <ExportCriteriaAnalysis data={data} idx={idx} />
        </div>
      </div>
      {!filteredCriteria || filteredCriteria.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-50px)]">
          <Empty description="Không có dữ liệu" />
        </div>
      ) : (
        filteredCriteria?.map((item) => {
          if (!item.analysisCriterions) return null
          const status = item.analysisCriterions?.status
          const rejectedBy = getRejectedBy(item.analysisCriterions?.description)
          const statusConfig = getStatusEvaluation(status, rejectedBy)
          const deadline = item.analysisCriterions?.deadline
          const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null
          const isAdvisoryRejected = rejectedBy === "ADVISORY_BOARD"
          const submitBtnText =
            status === $Enums.EvaluationCriterionStatus.REVISION
              ? isAdvisoryRejected
                ? "Nộp cho Ban tư vấn"
                : "Nộp cho Thư ký"
              : "Nộp tiêu chí"
          const confirmTitle =
            status === $Enums.EvaluationCriterionStatus.REVISION
              ? isAdvisoryRejected
                ? "Bạn chắc chắn muốn nộp lại tiêu chí này lên Ban tư vấn phê duyệt?"
                : "Bạn chắc chắn muốn nộp lại tiêu chí này lên Trưởng ban thư ký phê duyệt?"
              : "Bạn chắc chắn muốn nộp tiêu chí này?"

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
                      {userRole === "P13" && (
                        <span className="text-sm text-gray-600">
                          Người thực hiện:{" "}
                          {item?.analysisCriterions?.lecturer?.userProfile?.fullname ||
                            "Chưa phân công"}
                        </span>
                      )}
                      {deadline && deadlineStatus && (
                        <Tag color={deadlineStatus.color}>
                          Hạn: {formatDate(deadline)}
                          {deadlineStatus.text && ` (${deadlineStatus.text})`}
                        </Tag>
                      )}
                      <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                    </div>
                  </div>
                  {userRole !== "P13" && (
                    <div className="flex gap-2 flex-shrink-0">
                      {can(
                        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                        "THEM"
                      ) &&
                        status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                        status !== $Enums.EvaluationCriterionStatus.COMPLETED &&
                        status !== $Enums.EvaluationCriterionStatus.SUBMITTED && (
                          <Popconfirm
                            title="Xác nhận nộp tiêu chí"
                            description={confirmTitle}
                            onConfirm={() => {
                              const id = item.analysisCriterions?.id
                              if (id) {
                                handleSubmitCriterion(
                                  id,
                                  item.analysisCriterions?.description
                                )
                              }
                            }}
                            okText="Đồng ý"
                            cancelText="Hủy"
                            placement="topRight"
                          >
                            <Button
                              type="primary"
                              size="small"
                              className={
                                isAdvisoryRejected
                                  ? "!bg-[#0f8a4b] hover:!bg-[#0c703d]"
                                  : "bg-blue-500"
                              }
                            >
                              {submitBtnText}
                            </Button>
                          </Popconfirm>
                        )}

                      {can(
                        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                        "THEM"
                      ) &&
                        status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                        status !== $Enums.EvaluationCriterionStatus.COMPLETED &&
                        status !== $Enums.EvaluationCriterionStatus.SUBMITTED && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() =>
                              onOpen({
                                analysisCriterionId: item.analysisCriterions?.id,
                                refetch: refetch,
                                count: item.analysisCriterions?.requirementCriterions?.length || 0,
                              })
                            }
                          >
                            Thêm mới
                          </Button>
                        )}
                    </div>
                  )}
                </div>
                {item?.analysisCriterions?.evaluationCriterionComments &&
                  item.analysisCriterions.evaluationCriterionComments.filter(
                    (c) => !c.requirementCriterionId
                  ).length > 0 && (
                    <div className="my-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <MessageCircle size={15} />
                        Ý kiến yêu cầu chỉnh sửa tiêu chí:
                      </div>
                      <CommentList
                        comments={item.analysisCriterions.evaluationCriterionComments.filter(
                          (c) => !c.requirementCriterionId
                        )}
                        lecturerUserProfileId={
                          item.analysisCriterions?.lecturer?.userProfileId ||
                          item.analysisCriterions?.lecturer?.userProfile?.id
                        }
                      />
                    </div>
                  )}
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
                            {can(
                              KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                              "SUA"
                            ) &&
                              status !== $Enums.EvaluationCriterionStatus.SUBMITTED &&
                              status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                              status !== $Enums.EvaluationCriterionStatus.COMPLETED && (
                                <EditIcon
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen({
                                      id: record.id,
                                      analysisCriterionId: record.analysisCriterionId,
                                      refetch: refetch,
                                    })
                                  }}
                                  className="text-sm text-blue-700 cursor-pointer"
                                />
                              )}

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
                    onExpand: (expanded, record) => {
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

export default CriteriaAnalysisSubPage
