import CommentList from "@components/commons/comment-list"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import ExportCriteriaEvaluation from "@components/modal/export-criteria-evaluation"
import { getRejectedBy, getStatusConfig } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type CriterionPeriod,
  type EvaluationCriterion,
  type EvaluationCriterionComment,
  type StandardPeriod,
} from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Badge, Button, Collapse, Form, message, Tag } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { getDeadlineStatus } from "@/utils/getDeadlineStatus"
import { queryClient } from "@api/index"
import ImportCriteriaEvaluation from "@components/modal/import-criteria-evaluation"

export type DataTabEvaluationCriterionType = StandardPeriod & {
  criteria: (CriterionPeriod & {
    evaluationCriterion?:
      | (EvaluationCriterion & {
          evaluationCriterionComments?: (EvaluationCriterionComment & {
            reviewer?: { fullname?: string | null }
          })[]
          lecturer?: { userProfile?: { fullname?: string | null } } | null
        })
      | null
  })[]
}

export type PutRequirementCriterion = {
  criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({
  data,
  readOnly = false,
}: {
  data: DataTabEvaluationCriterionType
  readOnly?: boolean
}) => {
  const [form] = Form.useForm<PutRequirementCriterion>()
  const [showCommentsCriterionId, setShowCommentsCriterionId] = useState<string | null>(null)
  const [activeCollapseKeys, setActiveCollapseKeys] = useState<string[]>([])

  const { onOpen: openViewMinhChung } = useDisclosure<{ evidenceId: string }>({
    tag: "ViewMinhChungModal",
  })
  const { can } = useAbility()

  const canEdit =
    can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA, "THEM") &&
    !readOnly

  const { hideSpinner, showSpinner } = useSpinner()

  const currentStatus =
    data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK

  // Lưu đánh giá tiêu chí
  const handleSubmit = async () => {
    const dataSubmit = form.getFieldsValue()

    let listSqlTransaction: any[] = []

    // Cập nhật các tiêu chí
    if (dataSubmit?.criteria && dataSubmit.criteria.length > 0) {
      listSqlTransaction = dataSubmit.criteria.map(
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
                currentSituation: i.evaluationCriterion.currentSituation || "",
                strengths: i.evaluationCriterion.strengths || "",
                weakness: i.evaluationCriterion.weakness || "",
                actionPlan: i.evaluationCriterion.actionPlan || "",
                score: i.evaluationCriterion.score || "",
              },
            },
          }
        }
      )
    }

    try {
      showSpinner()
      const res = await sqlTransaction(listSqlTransaction)
      if (res.status !== 200) {
        message.error("Có lỗi xảy ra, vui lòng thử lại")
        return
      }
      message.success("Lưu đánh giá tiêu chí thành công")
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

  // Nộp phiếu đánh giá tiêu chí — tự động lưu nội dung trước khi đổi trạng thái
  const handleCriterionSubmit = async (
    criterionId: string,
    fieldIndex: number,
    rawDescription?: string | null
  ) => {
    const allCriteria = form.getFieldValue("criteria")
    const criterionData = allCriteria?.[fieldIndex]?.evaluationCriterion
    const desc =
      rawDescription ??
      data?.criteria?.[fieldIndex]?.evaluationCriterion?.description ??
      criterionData?.description
    const rejectedBy = getRejectedBy(desc)
    const isAdvisoryRejected = rejectedBy === "ADVISORY_BOARD"
    const targetStatus = isAdvisoryRejected
      ? $Enums.EvaluationStatus.APPROVED
      : $Enums.EvaluationStatus.SUBMITTED

    try {
      showSpinner()
      const res = await sqlTransaction([
        {
          model: "EvaluationCriterion",
          operation: "update",
          data: {
            where: { id: criterionId },
            data: {
              currentSituation: criterionData?.currentSituation || "",
              strengths: criterionData?.strengths || "",
              weakness: criterionData?.weakness || "",
              actionPlan: criterionData?.actionPlan || "",
              score: criterionData?.score || "",
              status: targetStatus,
            },
          },
        },
      ])

      if (res.status !== 200) {
        message.error("Có lỗi xảy ra, vui lòng thử lại")
        return
      }

      if (isAdvisoryRejected) {
        message.success("Đã nộp lại phiếu đánh giá tiêu chí lên Ban tư vấn phê duyệt")
      } else {
        message.success("Đã nộp phiếu đánh giá tiêu chí lên Trưởng ban thư ký phê duyệt")
      }

      queryClient.invalidateQueries({
        queryKey: ["zenstack", "EvaluationPeriod"],
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
            description: item.evaluationCriterion?.description || "",
          },
        })),
      })
    }
  }, [data, form])

  useEffect(() => {
    if (data && currentStatus === $Enums.EvaluationStatus.REVISION) {
      const criteriaWithComments = data.criteria
        .filter((item) => {
          const hasComments =
            item.evaluationCriterion?.evaluationCriterionComments &&
            item.evaluationCriterion.evaluationCriterionComments.length > 0
          return hasComments
        })
        .map((item) => item.id)

      if (criteriaWithComments.length > 0) {
        setActiveCollapseKeys(criteriaWithComments)
      }
    }
  }, [data, currentStatus])

  const headerSection = (
    <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
      <span className="text-sm font-bold text-green-700">
        {(() => {
          const colonIdx = data?.name?.indexOf(": ")
          if (colonIdx !== undefined && colonIdx !== -1) {
            return (
              <>
                <span className="font-bold">{data?.name?.substring(0, colonIdx + 1)} </span>
                <span className="font-normal">{data?.name?.substring(colonIdx + 2)}</span>
              </>
            )
          }
          return data?.name
        })()}
      </span>
      <div className="flex gap-2 mr-2">
        <ExportCriteriaEvaluation data={data} />
        {canEdit && <ImportCriteriaEvaluation data={data} />}
        <Button type="primary" size="small" onClick={handleSubmit} disabled={!canEdit}>
          Lưu đánh giá
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-230px)]">
      {headerSection}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        <Form form={form} layout="vertical" className="form-evidence">
          <Form.List name="criteria">
            {(fields) => (
              <>
                {fields.map(({ key, name }, idx: number) => {
                  const item = data.criteria[name]
                  const criterionStatus =
                    item.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
                  const isCriterionReadOnly =
                    !canEdit ||
                    criterionStatus === $Enums.EvaluationStatus.SUBMITTED ||
                    criterionStatus === $Enums.EvaluationStatus.APPROVED ||
                    criterionStatus === $Enums.EvaluationStatus.COMPLETED
                  const criterionDeadline = item.evaluationCriterion?.deadline
                  const criterionDeadlineStatus = criterionDeadline
                    ? getDeadlineStatus(criterionDeadline)
                    : null
                  const rejectedBy = getRejectedBy(item.evaluationCriterion?.description)
                  const criterionStatusConfig = getStatusConfig(criterionStatus, rejectedBy)
                  const isAdvisoryRejected = rejectedBy === "ADVISORY_BOARD"
                  return (
                    <div key={key} style={{ marginBottom: 24 }}>
                      <Collapse
                        activeKey={activeCollapseKeys}
                        onChange={(keys) =>
                          setActiveCollapseKeys(Array.isArray(keys) ? keys : [keys])
                        }
                        items={[
                          {
                            label: (
                              <div className="flex flex-col w-full pr-2 gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="cursor-pointer flex-1">
                                    {(() => {
                                      const colonIdx = item?.name?.indexOf(": ")
                                      if (colonIdx !== undefined && colonIdx !== -1) {
                                        return (
                                          <>
                                            <span className="font-bold">
                                              {item?.name?.substring(0, colonIdx + 1)}{" "}
                                            </span>
                                            <span>{item?.name?.substring(colonIdx + 2)}</span>
                                          </>
                                        )
                                      }
                                      return <span className="font-bold">{item?.name}</span>
                                    })()}
                                  </div>
                                  <div
                                    className="flex gap-2 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.evaluationCriterion && (
                                      <Badge
                                        count={
                                          item.evaluationCriterion?.evaluationCriterionComments
                                            ?.length || 0
                                        }
                                        showZero
                                        offset={[-5, 5]}
                                      >
                                        <Button
                                          type="primary"
                                          className="bg-yellow-400"
                                          size="small"
                                          onClick={() => {
                                            const criterionId = item.evaluationCriterion?.id
                                            const isClosing =
                                              showCommentsCriterionId === criterionId

                                            setShowCommentsCriterionId(
                                              isClosing ? null : criterionId || null
                                            )

                                            if (
                                              !isClosing &&
                                              !activeCollapseKeys.includes(item.id)
                                            ) {
                                              setActiveCollapseKeys([
                                                ...activeCollapseKeys,
                                                item.id,
                                              ])
                                            }
                                          }}
                                        >
                                          {showCommentsCriterionId === item.evaluationCriterion?.id
                                            ? "Đóng đánh giá"
                                            : "Xem đánh giá"}
                                        </Button>
                                      </Badge>
                                    )}
                                    {item.evaluationCriterion &&
                                      canEdit &&
                                      item.evaluationCriterion.status !==
                                        $Enums.EvaluationStatus.SUBMITTED &&
                                      item.evaluationCriterion.status !==
                                        $Enums.EvaluationStatus.APPROVED &&
                                      item.evaluationCriterion.status !==
                                        $Enums.EvaluationStatus.COMPLETED && (
                                        <Button
                                          type="primary"
                                          className={
                                            isAdvisoryRejected
                                              ? "!bg-[#0f8a4b] hover:!bg-[#0c703d]"
                                              : "bg-blue-500"
                                          }
                                          size="small"
                                          onClick={() =>
                                            handleCriterionSubmit(
                                              item.evaluationCriterion?.id ?? "",
                                              name,
                                              item.evaluationCriterion?.description
                                            )
                                          }
                                        >
                                          {item.evaluationCriterion.status ===
                                          $Enums.EvaluationStatus.REVISION
                                            ? isAdvisoryRejected
                                              ? "Nộp cho Ban tư vấn"
                                              : "Nộp cho Thư ký"
                                            : "Nộp phiếu"}
                                        </Button>
                                      )}
                                  </div>
                                </div>
                                <div className="flex gap-3 items-center mt-1 flex-wrap">
                                  <span className="text-xs text-gray-500">
                                    Người viết phiếu:{" "}
                                    {item.evaluationCriterion?.lecturer?.userProfile?.fullname ||
                                      "Chưa phân công"}
                                  </span>
                                  {criterionDeadline && criterionDeadlineStatus && (
                                    <Tag color={criterionDeadlineStatus.color}>
                                      Hạn: {dayjs(criterionDeadline).format("DD/MM/YYYY")}
                                      {criterionDeadlineStatus.text &&
                                        ` (${criterionDeadlineStatus.text})`}
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
                                    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                                      <CommentList
                                        comments={
                                          item.evaluationCriterion?.evaluationCriterionComments ||
                                          []
                                        }
                                      />
                                    </div>
                                  )}

                                <Form.Item
                                  label="1. Mô tả hiện trạng"
                                  name={[name, "evaluationCriterion", "currentSituation"]}
                                >
                                  <RichTextEditor
                                    id={item.id}
                                    editable={!isCriterionReadOnly}
                                    stickyToolbar={false}
                                    onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label="2. Điểm mạnh"
                                  name={[name, "evaluationCriterion", "strengths"]}
                                >
                                  <RichTextEditor
                                    id={item.id}
                                    editable={!isCriterionReadOnly}
                                    stickyToolbar={false}
                                    onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label="3. Điểm tồn tại"
                                  name={[name, "evaluationCriterion", "weakness"]}
                                >
                                  <RichTextEditor
                                    id={item.id}
                                    editable={!isCriterionReadOnly}
                                    stickyToolbar={false}
                                    onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label="4. Kế hoạch hành động"
                                  name={[name, "evaluationCriterion", "actionPlan"]}
                                >
                                  <RichTextEditor
                                    id={item.id}
                                    editable={!isCriterionReadOnly}
                                    defaultTable={true}
                                    stickyToolbar={false}
                                    onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                  />
                                </Form.Item>
                                <Form.Item
                                  label="5. Tự đánh giá"
                                  name={[name, "evaluationCriterion", "score"]}
                                >
                                  <RichTextEditor
                                    id={item.id}
                                    editable={!isCriterionReadOnly}
                                    stickyToolbar={false}
                                    onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
                                  />
                                </Form.Item>
                              </>
                            ),
                          },
                        ]}
                        bordered={true}
                        expandIconPosition="end"
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

export default CriteriaEvaluationSubPage
