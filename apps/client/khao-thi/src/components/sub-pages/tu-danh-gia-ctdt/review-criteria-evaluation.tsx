import CommentList from "@components/commons/comment-list"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import { getRejectedBy, getStatusConfig } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { DataReviewCriteriaEvaluationType } from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-evaluation"
import { useSession } from "@workspace/auth/react"
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Badge, Button, Card, Collapse, Form, message, Tag } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"

export type PutRequirementCriterion = {
  criteria: Record<string, any>
}

const ReviewCriteriaEvaluationSubpage = ({
  data,
  onRefetch,
}: {
  data: DataReviewCriteriaEvaluationType
  onRefetch: () => void
}) => {
  const { hideSpinner, showSpinner } = useSpinner()
  const [showCommentsCriterionId, setShowCommentsCriterionId] = useState<string | null>(null)
  const [openCollapseKeys, setOpenCollapseKeys] = useState<Record<string, boolean>>({})

  const [form] = Form.useForm<PutRequirementCriterion>()
  const [commentForm] = Form.useForm<{ crossReview: string }>()

  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "f1218263-341e-40c4-b269-a711a0186c74"

  const handleSendCrossReview = async (evaluationCriterionId: string) => {
    try {
      const values = await commentForm.validateFields()

      if (!values.crossReview) {
        message.error("Vui lòng nhập ý kiến phản biện")
        return
      }

      showSpinner()

      const listSqlTransaction: any[] = [
        {
          model: "EvaluationCriterionComment",
          operation: "create",
          data: {
            data: {
              reviewerId: idProfile,
              evaluationCriterionId: evaluationCriterionId,
              content: values.crossReview,
            },
          },
        },
        {
          model: "EvaluationCriterion",
          operation: "update",
          data: {
            where: {
              id: evaluationCriterionId,
            },
            data: {
              status: $Enums.EvaluationStatus.REVISION,
              description: JSON.stringify({ rejectedBy: "SECRETARY" }),
            },
          },
        },
      ]

      const res = await sqlTransaction(listSqlTransaction)
      if (res.status !== 200) {
        message.error("Có lỗi xảy ra, vui lòng thử lại")
        return
      }

      message.success("Gửi ý kiến phản biện thành công")
      commentForm.resetFields()
      setShowCommentsCriterionId(null)
      onRefetch()
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  const handleSubmitCross = async () => {
    try {
      showSpinner()
      const dataSubmit = form.getFieldsValue()

      let listSqlTransaction: any[] = []

      if (dataSubmit.criteria && dataSubmit.criteria.length > 0) {
        listSqlTransaction = [
          ...dataSubmit.criteria.map(
            (
              i: CriterionPeriod & {
                evaluationCriterion: EvaluationCriterion
              }
            ) => {
              return {
                model: "EvaluationCriterion",
                operation: "update",
                data: {
                  where: {
                    id: i.evaluationCriterion.id,
                    criterionPeriodId: i.evaluationCriterion.criterionPeriodId,
                  },
                  data: {
                    status: $Enums.EvaluationStatus.APPROVED,
                  },
                },
              }
            }
          ),
        ]
      }

      const res = await sqlTransaction(listSqlTransaction)

      if (res.status !== 200) {
        message.error("Có lỗi xảy ra, vui lòng thử lại")
        return
      }

      message.success("Phê duyệt tất cả tiêu chí thành công")
      onRefetch()
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        criteria: data?.criteria?.map((item) => ({
          ...item,
          evaluationCriterion: {
            id: item.evaluationCriterion?.id,
            criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
            currentSituation: item.evaluationCriterion?.currentSituation || "",
            strengths: item.evaluationCriterion?.strengths || "",
            weakness: item.evaluationCriterion?.weakness || "",
            actionPlan: item.evaluationCriterion?.actionPlan || "",
            score: item.evaluationCriterion?.score || "",
          },
        })),
      })
    }
  }, [data, form])

  const hasApprovableItems = data.criteria.some(
    (c) =>
      c.evaluationCriterion &&
      c.evaluationCriterion.status !== $Enums.EvaluationStatus.PENDING &&
      c.evaluationCriterion.status !== $Enums.EvaluationStatus.COMPLETED &&
      c.evaluationCriterion.status !== $Enums.EvaluationStatus.APPROVED
  )

  return (
    <div className="flex flex-col h-[calc(100vh-230px)]">
      <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
        <span className="text-sm font-bold text-green-700">
          Tiêu chuẩn {data.order}: {data.name}
        </span>
        {hasApprovableItems && (
          <div className="flex gap-2 mr-2">
            <Button type="primary" size="small" onClick={handleSubmitCross}>
              Phê duyệt tất cả
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        <Form form={form} layout="vertical" className="form-evidence">
          <Form.List name="criteria">
            {(fields) => (
              <>
                {fields.map(({ key, name }, idx: number) => {
                  const item = data.criteria[name]
                  const criterionStatus =
                    item.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
                  const rejectedBy = getRejectedBy(item.evaluationCriterion?.description)
                  const criterionStatusConfig = getStatusConfig(criterionStatus, rejectedBy)
                  const reviewDeadline = item.evaluationCriterion?.deadlineReview
                  const deadlineStatus = reviewDeadline ? getDeadlineStatus(reviewDeadline) : null
                  const evaluatorName = item.evaluationCriterion?.lecturer?.userProfile?.fullname
                  return (
                    <div key={key} style={{ marginBottom: 24 }}>
                      <Collapse
                        items={[
                          {
                            label: (
                              <div
                                className="flex flex-col w-full pr-2 gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenCollapseKeys((prev) => ({
                                        ...prev,
                                        [item.id]: !prev[item.id],
                                      }))
                                    }}
                                    className="cursor-pointer flex-1"
                                  >
                                    <span className="font-bold">
                                      Tiêu chí {data.order}.{item.order}:{" "}
                                    </span>
                                    {item?.name}
                                  </div>
                                  {item.evaluationCriterion &&
                                    criterionStatus !== $Enums.EvaluationStatus.PENDING &&
                                    criterionStatus !== $Enums.EvaluationStatus.APPROVED && (
                                      <Badge
                                        count={
                                          item.evaluationCriterion?.evaluationCriterionComments
                                            ?.length || 0
                                        }
                                        size="small"
                                      >
                                        <Button
                                          type="primary"
                                          size="small"
                                          className="bg-yellow-400"
                                          onClick={() => {
                                            const id = item.evaluationCriterion?.id
                                            const isOpen = showCommentsCriterionId === id
                                            setShowCommentsCriterionId(isOpen ? null : id || null)
                                            if (!isOpen && id) {
                                              setOpenCollapseKeys((prev) => ({
                                                ...prev,
                                                [item.id]: true,
                                              }))
                                            }
                                          }}
                                        >
                                          {showCommentsCriterionId === item.evaluationCriterion?.id
                                            ? "Đóng"
                                            : "Gửi ý kiến phản biện"}
                                        </Button>
                                      </Badge>
                                    )}
                                </div>
                                <div className="flex gap-3 items-center mt-1 flex-wrap">
                                  <span className="text-xs text-gray-500">
                                    Người viết phiếu: {evaluatorName || "Chưa phân công"}
                                  </span>
                                  {reviewDeadline && deadlineStatus && (
                                    <Tag color={deadlineStatus.color}>
                                      Hạn: {dayjs(reviewDeadline).format("DD/MM/YYYY")}
                                      {deadlineStatus.text && ` (${deadlineStatus.text})`}
                                    </Tag>
                                  )}
                                  <span className="text-xs text-gray-500">Trạng thái:</span>
                                  <Tag color={criterionStatusConfig.color} className="text-xs">
                                    {criterionStatusConfig.text}
                                  </Tag>
                                </div>
                              </div>
                            ),
                            key: item.id,
                            children: (
                              <>
                                {item.evaluationCriterion &&
                                  showCommentsCriterionId === item.evaluationCriterion?.id && (
                                    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                                      <Card>
                                        <div className="flex justify-end gap-2 mb-4">
                                          <Button
                                            type="primary"
                                            onClick={() => {
                                              if (item.evaluationCriterion?.id) {
                                                handleSendCrossReview(item.evaluationCriterion.id)
                                              }
                                            }}
                                          >
                                            Gửi ý kiến
                                          </Button>
                                        </div>

                                        {item.evaluationCriterion?.evaluationCriterionComments &&
                                          item.evaluationCriterion.evaluationCriterionComments
                                            .length > 0 && (
                                            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                                              <CommentList
                                                comments={
                                                  item.evaluationCriterion
                                                    .evaluationCriterionComments
                                                }
                                              />
                                            </div>
                                          )}

                                        <Form form={commentForm} layout="vertical">
                                          <Form.Item
                                            label="Gửi ý kiến phản biện"
                                            name="crossReview"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Vui lòng nhập ý kiến phản biện",
                                              },
                                            ]}
                                          >
                                            <RichTextEditor />
                                          </Form.Item>
                                        </Form>
                                      </Card>
                                    </div>
                                  )}

                                <Form.Item
                                  label="1. Mô tả hiện trạng"
                                  name={[name, "evaluationCriterion", "currentSituation"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="2. Điểm mạnh"
                                  name={[name, "evaluationCriterion", "strengths"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="3. Điểm tồn tại"
                                  name={[name, "evaluationCriterion", "weakness"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="4. Kế hoạch hành động"
                                  name={[name, "evaluationCriterion", "actionPlan"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>
                                <Form.Item
                                  label="5. Tự đánh giá"
                                  name={[name, "evaluationCriterion", "score"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>
                              </>
                            ),
                          },
                        ]}
                        bordered={true}
                        expandIconPosition="end"
                        className="bg-transparent mb-6"
                        activeKey={openCollapseKeys[item.id] ? [item.id] : []}
                        onChange={(keys) =>
                          setOpenCollapseKeys((prev) => ({
                            ...prev,
                            [item.id]: keys.includes(item.id),
                          }))
                        }
                      />
                    </div>
                  )
                })}
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </div>
  )
}

export default ReviewCriteriaEvaluationSubpage
