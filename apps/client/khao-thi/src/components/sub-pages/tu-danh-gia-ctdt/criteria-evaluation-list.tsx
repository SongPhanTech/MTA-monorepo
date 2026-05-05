import CommentList from "@components/commons/comment-list"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import ExportAllCriteriaEvaluation from "@components/modal/export-all-criteria-evaluation"
import { getStatusConfig } from "@constants/constants"
import type { DataTabEvaluationCriterionType } from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports"
import { $Enums } from "@workspace/db/client"
import { Badge, Button, Collapse, Form, Tag } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"

export type PutRequirementCriterion = {
  criteria: Record<string, any>
  opening: string
  conclusion: string
}

export default function CriteriaEvaluationListSubPage({
  data,
  allStandards,
}: {
  data: DataTabEvaluationCriterionType
  allStandards?: DataTabEvaluationCriterionType[]
}) {
  const [form] = Form.useForm<PutRequirementCriterion>()
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})

  const { onOpen: openViewMinhChung } = useDisclosure<{ evidenceId: string }>({
    tag: "ViewMinhChungModal",
  })

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        opening: data?.opening || "",
        conclusion: data?.conclusion || "",
        criteria: data?.criteria?.map((item) => ({
          ...item,
          evaluationCriterion: {
            id: item.evaluationCriterion?.id,
            criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
            currentSituation: item.evaluationCriterion?.currentSituation || "",
            strengths: item.evaluationCriterion?.strengths || "",
            weakness: item.evaluationCriterion?.weakness || "",
            actionPlan: item.evaluationCriterion?.actionPlan || "",
          },
        })),
      })
    }
  }, [data, form])

  const renderCriterionHeader = (criterion: any, index: number) => {
    const evaluationCriterion = criterion?.evaluationCriterion
    const lecturer = evaluationCriterion?.lecturer
    const reviewer = evaluationCriterion?.reviewer
    const status = evaluationCriterion?.status
    const deadline = evaluationCriterion?.deadline
    const statusConfig = getStatusConfig(status || $Enums.EvaluationStatus.LOCK)
    const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null
    const commentsCount = evaluationCriterion?.evaluationCriterionComments?.length || 0

    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div>
            {(() => {
              const colonIdx = criterion?.name?.indexOf(": ")
              if (colonIdx !== undefined && colonIdx !== -1) {
                return (
                  <>
                    <span className="font-bold">
                      {criterion?.name?.substring(0, colonIdx + 1)}{" "}
                    </span>
                    <span>{criterion?.name?.substring(colonIdx + 2)}</span>
                  </>
                )
              }
              return <span className="font-bold">{criterion?.name}</span>
            })()}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Tag color="blue">Người viết: {lecturer?.userProfile?.fullname || "Chưa phân công"}</Tag>
          <Tag color="purple">
            Người phản biện: {reviewer?.lecturer?.userProfile?.fullname || "Chưa phân công"}
          </Tag>
          {deadline && deadlineStatus && (
            <Tag color={deadlineStatus.color}>
              Hạn: {dayjs(deadline).format("DD/MM/YYYY")}
              {deadlineStatus.text && ` (${deadlineStatus.text})`}
            </Tag>
          )}
          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          <Badge count={commentsCount} showZero size="small">
            <Button
              type="link"
              size="small"
              className="text-xs p-0"
              onClick={(e) => {
                e.stopPropagation()
                setShowComments((prev) => ({
                  ...prev,
                  [criterion.id]: !prev[criterion.id],
                }))
              }}
            >
              Xem đánh giá
            </Button>
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-230px)]">
      {/* Header with export button */}
      <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-end items-center gap-2 mb-4">
        {/* {allStandards && allStandards.length > 0 && (
          <ExportAllCriteriaEvaluation standards={allStandards} />
        )} */}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        <Form form={form} layout="vertical" className="form-evidence">
          {/* Danh sách tiêu chí */}
          <Form.List name="criteria">
            {() => (
              <>
                {data?.criteria?.map((criterion, index) => (
                  <div key={criterion.id} style={{ marginBottom: 24 }}>
                    <Collapse
                      items={[
                        {
                          label: renderCriterionHeader(criterion, index),
                          key: criterion.id,
                          children: (
                            <>
                              {/* Comments section */}
                              {showComments[criterion.id] && (
                                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                                  <CommentList
                                    comments={
                                      criterion?.evaluationCriterion?.evaluationCriterionComments ||
                                      []
                                    }
                                  />
                                </div>
                              )}

                              <Form.Item
                                label="1. Mô tả hiện trạng"
                                name={[index, "evaluationCriterion", "currentSituation"]}
                              >
                                <RichTextEditor
                                  id={`${criterion.id}-currentSituation`}
                                  editable={false}
                                  onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                />
                              </Form.Item>

                              <Form.Item
                                label="2. Điểm mạnh"
                                name={[index, "evaluationCriterion", "strengths"]}
                              >
                                <RichTextEditor
                                  id={`${criterion.id}-strengths`}
                                  editable={false}
                                  onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                />
                              </Form.Item>

                              <Form.Item
                                label="3. Điểm tồn tại"
                                name={[index, "evaluationCriterion", "weakness"]}
                              >
                                <RichTextEditor
                                  id={`${criterion.id}-weakness`}
                                  editable={false}
                                  onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                />
                              </Form.Item>

                              <Form.Item
                                label="4. Kế hoạch hành động"
                                name={[index, "evaluationCriterion", "actionPlan"]}
                              >
                                <RichTextEditor
                                  id={`${criterion.id}-actionPlan`}
                                  editable={false}
                                  onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                />
                              </Form.Item>
                            </>
                          ),
                        },
                      ]}
                      bordered={true}
                      expandIconPosition="end"
                      className="bg-transparent mb-6"
                    />
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </div>
  )
}
