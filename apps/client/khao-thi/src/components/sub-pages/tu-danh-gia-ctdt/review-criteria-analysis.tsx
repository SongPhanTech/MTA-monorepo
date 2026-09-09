import CommentList from "@components/commons/comment-list"
import DatePicker from "@components/commons/date-picker"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import {
  DEADLINE_OPTIONS,
  getRejectedBy,
  getStatusEvaluation,
} from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import type { ReviewDataTabType } from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis"
import { useSession } from "@workspace/auth/react"
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import {
  useCreateEvaluationCriterionComment,
  useUpdateAnalysisCriterion,
  useUpdateEvaluationCriterion,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Badge, Button, Empty, Form, Input, message, Modal, Popconfirm, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { FileEdit, MessageCircle } from "lucide-react"
import { useState } from "react"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"

type CommentType = {
  comment: Record<
    string,
    {
      content?: string
      newDeadline?: Date
    }
  >
}

type Props = {
  data: ReviewDataTabType
  idx: number
  userRole?: "SECRETARY" | "ADVISORY_BOARD"
  refetch?: () => void
}

const ReviewCriteriaAnalysisSubPage = ({
  data,
  idx,
  userRole = "SECRETARY",
  refetch,
}: Props) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [deadlineFilter, setDeadlineFilter] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingCriterion, setRejectingCriterion] = useState<{
    analysisCriterionId: string
    criterionName: string
    isOverdue: boolean
  } | null>(null)
  const [rejectForm] = Form.useForm<{ content: string; newDeadline?: any }>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "f1218263-341e-40c4-b269-a711a0186c74"
  const { can } = useAbility()
  const [form] = Form.useForm<CommentType>()

  const { mutateAsync: updateAnalysisCriterion } = useUpdateAnalysisCriterion()
  const { mutateAsync: createEvaluationCriterionComment } = useCreateEvaluationCriterionComment()
  const { mutateAsync: updateEvaluationCriterion } = useUpdateEvaluationCriterion()

  const handleConfirmRejectCriterion = async () => {
    try {
      const values = await rejectForm.validateFields()
      if (!rejectingCriterion) return
      showSpinner()

      const updateData: {
        status: $Enums.EvaluationCriterionStatus
        deadline?: string
        description?: string
      } = {
        status: $Enums.EvaluationCriterionStatus.REVISION,
        description: JSON.stringify({
          rejectedBy: userRole === "ADVISORY_BOARD" ? "ADVISORY_BOARD" : "SECRETARY",
        }),
      }

      if (rejectingCriterion.isOverdue && values.newDeadline) {
        updateData.deadline = dayjs(values.newDeadline).toISOString()
      }

      await updateAnalysisCriterion({
        where: {
          id: rejectingCriterion.analysisCriterionId,
        },
        data: updateData,
      })

      await createEvaluationCriterionComment({
        data: {
          reviewerId: idProfile,
          analysisCriterionId: rejectingCriterion.analysisCriterionId,
          content: values.content,
        },
      })

      setRejectModalOpen(false)
      rejectForm.resetFields()
      setRejectingCriterion(null)
      refetch?.()
      message.success(
        userRole === "ADVISORY_BOARD"
          ? "Ban tư vấn đã yêu cầu chỉnh sửa tiêu chí (trả lại cho GV)."
          : "Trưởng ban thư ký đã yêu cầu chỉnh sửa tiêu chí (trả lại cho GV)."
      )
    } catch (error) {
      if ((error as any)?.errorFields) return
      message.error("Gửi yêu cầu chỉnh sửa tiêu chí thất bại, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  const toggleCommentRow = (recordId: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    )
  }

  const handleRejectCriterionAnalysis = async (
    analysisCriterionId: string,
    requirementCriterionId: string,
    isOverdue: boolean
  ) => {
    try {
      const values = await form.validateFields([
        ["comment", requirementCriterionId, "content"],
        ["comment", requirementCriterionId, "newDeadline"],
      ])
      if (!values) return
      showSpinner()

      const commentData = values.comment[requirementCriterionId]

      const filteredCommentData = Object.entries(commentData).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>
      )

      const updateData: {
        status: $Enums.EvaluationCriterionStatus
        deadline?: string
        description?: string
      } = {
        status: $Enums.EvaluationCriterionStatus.REVISION,
        description: JSON.stringify({
          rejectedBy: userRole === "ADVISORY_BOARD" ? "ADVISORY_BOARD" : "SECRETARY",
        }),
      }

      if (isOverdue && filteredCommentData?.newDeadline) {
        updateData.deadline = dayjs(filteredCommentData.newDeadline).toISOString()
      }

      await updateAnalysisCriterion({
        where: {
          id: analysisCriterionId,
        },
        data: updateData,
      })

      await createEvaluationCriterionComment({
        data: {
          reviewerId: idProfile,
          requirementCriterionId: requirementCriterionId,
          analysisCriterionId: analysisCriterionId,
          content: filteredCommentData?.content,
        },
      })

      form.resetFields([
        ["comment", requirementCriterionId, "content"],
        ["comment", requirementCriterionId, "newDeadline"],
      ])
      toggleCommentRow(requirementCriterionId)
      message.success("Gửi yêu cầu chỉnh sửa tiêu chí thành công (trả lại cho GV)")
    } catch (error) {
      message.error("Gửi yêu cầu chỉnh sửa tiêu chí thất bại, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  const handleApproveCriterionAnalysisFinal = async (
    analysisCriterionId: string,
    criterionPeriodId?: string
  ) => {
    try {
      showSpinner()
      if (userRole === "ADVISORY_BOARD") {
        await updateAnalysisCriterion({
          where: {
            id: analysisCriterionId,
          },
          data: {
            status: $Enums.EvaluationCriterionStatus.COMPLETED,
          },
        })

        if (criterionPeriodId) {
          await updateEvaluationCriterion({
            where: {
              criterionPeriodId: criterionPeriodId,
            },
            data: {
              status: $Enums.EvaluationStatus.PENDING,
            },
          })
        }

        message.success("Ban tư vấn phê duyệt tiêu chí thành công, đã mở khoá phiếu đánh giá")
      } else {
        await updateAnalysisCriterion({
          where: {
            id: analysisCriterionId,
          },
          data: {
            status: $Enums.EvaluationCriterionStatus.APPROVED,
          },
        })

        message.success("Phê duyệt tiêu chí thành công, đã chuyển Ban tư vấn duyệt")
      }
    } catch (error) {
      message.error("Phê duyệt tiêu chí thất bại, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  const shouldShowApproveAllButton = () => {
    if (
      !can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA, "DUYET")
    ) {
      return false
    }

    const requiredStatus =
      userRole === "ADVISORY_BOARD"
        ? $Enums.EvaluationCriterionStatus.APPROVED
        : $Enums.EvaluationCriterionStatus.SUBMITTED

    return filteredCriteria?.some((item) => {
      const status = item.analysisCriterions?.status
      return status === requiredStatus
    })
  }

  const handleSubmitedAll = async () => {
    try {
      showSpinner()

      if (!filteredCriteria || filteredCriteria.length === 0) {
        message.warning("Không có tiêu chí nào để phê duyệt")
        return
      }

      const requiredStatus =
        userRole === "ADVISORY_BOARD"
          ? $Enums.EvaluationCriterionStatus.APPROVED
          : $Enums.EvaluationCriterionStatus.SUBMITTED

      const approvableCriteria = filteredCriteria.filter((item) => {
        const status = item.analysisCriterions?.status
        return status === requiredStatus
      })

      if (approvableCriteria.length === 0) {
        message.warning("Không có tiêu chí nào đủ điều kiện để phê duyệt")
        return
      }

      if (userRole === "ADVISORY_BOARD") {
        await Promise.all(
          approvableCriteria
            .filter((item) => item.analysisCriterions?.id)
            .map((item) =>
              Promise.all([
                updateAnalysisCriterion({
                  where: {
                    id: item.analysisCriterions?.id as string,
                  },
                  data: {
                    status: $Enums.EvaluationCriterionStatus.COMPLETED,
                  },
                }),
                updateEvaluationCriterion({
                  where: {
                    criterionPeriodId: item.id,
                  },
                  data: {
                    status: $Enums.EvaluationStatus.PENDING,
                  },
                }),
              ])
            )
        )
        message.success(`Ban tư vấn phê duyệt thành công ${approvableCriteria.length} tiêu chí`)
      } else {
        await Promise.all(
          approvableCriteria
            .filter((item) => item.analysisCriterions?.id)
            .map((item) =>
              updateAnalysisCriterion({
                where: {
                  id: item.analysisCriterions?.id as string,
                },
                data: {
                  status: $Enums.EvaluationCriterionStatus.APPROVED,
                },
              })
            )
        )
        message.success(`Phê duyệt thành công ${approvableCriteria.length} tiêu chí, đã chuyển Ban tư vấn duyệt`)
      }
    } catch (error) {
      message.error("Phê duyệt tiêu chí thất bại. Vui lòng thử lại.")
      console.error("Error approving all criteria:", error)
    } finally {
      hideSpinner()
    }
  }

  const filteredCriteria = data?.criteria?.filter((item) => {
    if (!item.analysisCriterions) return false

    if (deadlineFilter && item.analysisCriterions.deadline) {
      const now = dayjs()
      const deadlineDate = dayjs(item.analysisCriterions.deadline)
      const daysUntilDeadline = deadlineDate.diff(now, "day")

      if (deadlineFilter === "overdue" && daysUntilDeadline >= 0) return false
      if (deadlineFilter === "near" && (daysUntilDeadline < 0 || daysUntilDeadline > 3))
        return false
    } else if (deadlineFilter && !item.analysisCriterions.deadline) {
      return false
    }

    return true
  })

  return (
    <div className="h-[calc(100vh-230px)] overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base">
          <span className="font-bold">Tiêu chuẩn {idx}: </span>
          <span>{data?.name}</span>
        </div>
        <div className="flex gap-2">
          <Select
            allowClear
            placeholder="Lọc theo hạn"
            style={{ width: 150, height: 27 }}
            options={DEADLINE_OPTIONS}
            value={deadlineFilter}
            onChange={(value) => setDeadlineFilter(value)}
          />
          {shouldShowApproveAllButton() && (
            <Popconfirm
              title="Xác nhận phê duyệt tất cả tiêu chí?"
              description="Bạn có chắc chắn muốn phê duyệt tất cả tiêu chí này?"
              onConfirm={handleSubmitedAll}
              okText="Đồng ý"
              cancelText="Hủy"
              placement="topRight"
            >
              <Button type="primary" size="small">
                Phê duyệt tất cả
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
      {!filteredCriteria || filteredCriteria.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-50px)]">
          <Empty description="Không có dữ liệu" />
        </div>
      ) : (
        filteredCriteria?.map((item) => {
          return (
            <div key={item.id} className="ml-4 mb-6">
              <div className="mb-3">
                <div className="text-base">
                  <span className="font-bold">
                    Tiêu chí {idx}.{item.order}:{" "}
                  </span>
                  <span>{item?.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">
                    Người thực hiện:{" "}
                    {item?.analysisCriterions?.lecturer?.userProfile?.fullname || "Chưa phân công"}
                  </span>

                  {item?.analysisCriterions?.deadline && (
                    <Tag color={getDeadlineStatus(item.analysisCriterions.deadline).color}>
                      Hạn: {formatDate(item.analysisCriterions.deadline)}
                      {getDeadlineStatus(item.analysisCriterions.deadline).text &&
                        ` (${getDeadlineStatus(item.analysisCriterions.deadline).text})`}
                    </Tag>
                  )}
                  {item?.analysisCriterions?.status && (
                    <Tag
                      color={
                        getStatusEvaluation(
                          item.analysisCriterions.status,
                          getRejectedBy(item.analysisCriterions.description)
                        )?.color
                      }
                    >
                      {
                        getStatusEvaluation(
                          item.analysisCriterions.status,
                          getRejectedBy(item.analysisCriterions.description)
                        )?.label
                      }
                    </Tag>
                  )}
                  {((userRole === "ADVISORY_BOARD" &&
                    item?.analysisCriterions?.status ===
                      $Enums.EvaluationCriterionStatus.APPROVED) ||
                    (userRole !== "ADVISORY_BOARD" &&
                      item?.analysisCriterions?.status ===
                        $Enums.EvaluationCriterionStatus.SUBMITTED)) &&
                    can(
                      KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                      "DUYET"
                    ) && (
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          danger
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            const deadline = item?.analysisCriterions?.deadline
                            const isOverdue = deadline
                              ? dayjs(deadline).diff(dayjs(), "day") < 0
                              : false
                            setRejectingCriterion({
                              analysisCriterionId: item.analysisCriterions?.id as string,
                              criterionName: `Tiêu chí ${idx}.${item.order}: ${item.name}`,
                              isOverdue: !!isOverdue,
                            })
                            rejectForm.resetFields()
                            setRejectModalOpen(true)
                          }}
                        >
                          Yêu cầu chỉnh sửa
                        </Button>
                        <Popconfirm
                          placement="topLeft"
                          title={
                            userRole === "ADVISORY_BOARD"
                              ? "Xác nhận Ban tư vấn phê duyệt tiêu chí này?"
                              : "Xác nhận phê duyệt tiêu chí và chuyển Ban tư vấn duyệt?"
                          }
                          okText="Đồng ý"
                          cancelText="Hủy"
                          onConfirm={(e) => {
                            e?.stopPropagation()
                            handleApproveCriterionAnalysisFinal(
                              item.analysisCriterions?.id as string,
                              item.id
                            )
                          }}
                          onCancel={(e) => {
                            e?.stopPropagation()
                          }}
                        >
                          <Button
                            type="primary"
                            size="small"
                            className={
                              userRole === "ADVISORY_BOARD"
                                ? "!bg-[#0f8a4b] hover:!bg-[#0c703d] text-white border-none"
                                : ""
                            }
                          >
                            Phê duyệt tiêu chí
                          </Button>
                        </Popconfirm>
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
                          item.analysisCriterions?.lecturer?.userProfileId
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
                          width: 200,
                          align: "left",
                        },
                        {
                          title: "Các câu hỏi đặt ra",
                          dataIndex: "questions",
                          width: 200,
                          align: "left",
                          render: (questions: string[]) => {
                            return (
                              <div className="flex flex-col gap-1">
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
                              <div className="flex flex-col gap-1">
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
                          width: 150,
                          align: "center",
                          render: (record: RequirementCriterion) => {
                            return record?.evidencePlaces || ""
                          },
                        },
                        {
                          title: "Phương pháp thu thập",
                          width: 150,
                          align: "center",
                          render: (record: RequirementCriterion) => {
                            return record?.collectionMethod || ""
                          },
                        },
                      ],
                    },
                    {
                      title: "Thao tác",
                      width: 100,
                      align: "center",
                      hidden:
                        !can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                          "DUYET"
                        ) ||
                        (userRole === "ADVISORY_BOARD"
                          ? item.analysisCriterions?.status !==
                            $Enums.EvaluationCriterionStatus.APPROVED
                          : item.analysisCriterions?.status !==
                            $Enums.EvaluationCriterionStatus.SUBMITTED),
                      render: (__, record) => {
                        return (
                          <div className="flex gap-2 items-center justify-center">
                            <Tooltip title="Yêu cầu chỉnh sửa">
                              <Badge
                                count={record?.evaluationCriterionComment?.length || 0}
                                size="small"
                              >
                                <FileEdit
                                  size={16}
                                  strokeWidth={1.5}
                                  className={"text-blue-600 cursor-pointer"}
                                  onClick={() => {
                                    toggleCommentRow(record.id)
                                  }}
                                />
                              </Badge>
                            </Tooltip>
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
                      const deadline = item?.analysisCriterions?.deadline
                      const isOverdue = deadline && dayjs(deadline).diff(dayjs(), "day") < 0

                      const previousComments = record?.evaluationCriterionComment || []

                      return (
                        <div className="space-y-4">
                          {previousComments.length > 0 && (
                            <CommentList
                              comments={previousComments}
                              lecturerUserProfileId={
                                item.analysisCriterions?.lecturer?.userProfileId
                              }
                            />
                          )}

                          <Form form={form} layout="vertical">
                            <Form.Item
                              label="Yêu cầu chỉnh sửa"
                              name={["comment", record.id, "content"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Vui lòng nhập yêu cầu chỉnh sửa",
                                },
                              ]}
                            >
                              <RichTextEditor />
                            </Form.Item>
                            {isOverdue && (
                              <Form.Item
                                label="Gia hạn mới"
                                name={["comment", record.id, "newDeadline"]}
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng chọn ngày gia hạn mới",
                                  },
                                ]}
                              >
                                <DatePicker
                                  format="DD/MM/YYYY"
                                  placeholder="Chọn ngày gia hạn"
                                  disabledDate={(current) =>
                                    current && current < dayjs().startOf("day")
                                  }
                                  className="w-full"
                                />
                              </Form.Item>
                            )}
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                onClick={() => {
                                  form.resetFields([
                                    ["comment", record.id, "content"],
                                    ["comment", record.id, "newDeadline"],
                                  ])
                                  toggleCommentRow(record.id)
                                }}
                              >
                                Hủy
                              </Button>
                              <Button
                                type="primary"
                                onClick={() =>
                                  handleRejectCriterionAnalysis(
                                    record.analysisCriterionId,
                                    record.id,
                                    !!isOverdue
                                  )
                                }
                              >
                                Gửi yêu cầu
                              </Button>
                            </div>
                          </Form>
                        </div>
                      )
                    },
                    rowExpandable: (record) =>
                      expandedRowKeys.includes(record.id) ||
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

      <Modal
        title="Yêu cầu chỉnh sửa tiêu chí"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false)
          rejectForm.resetFields()
          setRejectingCriterion(null)
        }}
        onOk={handleConfirmRejectCriterion}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <div className="mb-3 text-sm font-semibold text-gray-800">
          {rejectingCriterion?.criterionName}
        </div>
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="Lý do / Nội dung yêu cầu chỉnh sửa"
            name="content"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập lý do / nội dung yêu cầu chỉnh sửa",
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập nội dung nhận xét hoặc yêu cầu giảng viên chỉnh sửa, bổ sung..."
            />
          </Form.Item>
          {rejectingCriterion?.isOverdue && (
            <Form.Item
              label="Gia hạn mới"
              name="newDeadline"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ngày gia hạn mới",
                },
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày gia hạn"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                className="w-full"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default ReviewCriteriaAnalysisSubPage
