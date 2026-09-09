import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons"
import { useStore } from "@tanstack/react-store"
import { evaluationPeriodStore } from ".."
import {
  useFindFirstEvaluationCouncilMember,
  useFindUniqueEvaluationPeriod,
  useFindUniqueLecturer,
  useUpdateEvaluationPeriod,
} from "@workspace/db/hooks"
import { $Enums } from "@workspace/db/client"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import useSpinner from "@hooks/spinner"
import { queryClient } from "@api/index"
import ExportReport from "./export-report"
import StandarReportsSubPage from "@components/sub-pages/tu-danh-gia-ctdt/standar-reports"
import type { DataTabEvaluationCriterionType } from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports"
import { useSession } from "@workspace/auth/react"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"

type SumaryReportFormType = {
  overviewProblem?: string | null
  overviewGeneral?: string | null
  overviewResults?: string | null
  conclude?: string | null
  conclusionStrengths?: string | null
  conclusionWeaknesses?: string | null
  conclusionPlans?: string | null
  conclusionProgramName?: string | null
  conclusionProgramCode?: string | null
  conclusionEvaluationResult?: string | null
  conclusionSignDate?: string | null
  conclusionSignTitle?: string | null
  conclusionSignPosition?: string | null
  conclusionSignerName?: string | null
  appendixDatabase?: string | null
  appendixDocuments?: string | null
  appendixEvidences?: string | null
}

const parseDescription = (rawDesc?: string | null) => {
  if (!rawDesc) {
    return {
      feedback: "",
      conclusionStrengths: "",
      conclusionWeaknesses: "",
      conclusionPlans: "",
      conclusionProgramName: "",
      conclusionProgramCode: "",
      conclusionEvaluationResult: "",
      conclusionSignDate: "",
      conclusionSignTitle: "",
      conclusionSignPosition: "",
      conclusionSignerName: "",
      conclusionSummaryTable: {} as Record<string, "Đ" | "K">,
      appendixDatabase: "",
      appendixDocuments: "",
      appendixEvidences: "",
    }
  }
  try {
    const parsed = JSON.parse(rawDesc)
    if (typeof parsed === "object" && parsed !== null) {
      return {
        feedback: parsed.feedback || "",
        conclusionStrengths: parsed.conclusionStrengths || "",
        conclusionWeaknesses: parsed.conclusionWeaknesses || "",
        conclusionPlans: parsed.conclusionPlans || "",
        conclusionProgramName: parsed.conclusionProgramName || "",
        conclusionProgramCode: parsed.conclusionProgramCode || "",
        conclusionEvaluationResult: parsed.conclusionEvaluationResult || "",
        conclusionSignDate: parsed.conclusionSignDate || "",
        conclusionSignTitle: parsed.conclusionSignTitle || "",
        conclusionSignPosition: parsed.conclusionSignPosition || "",
        conclusionSignerName: parsed.conclusionSignerName || "",
        conclusionSummaryTable: (parsed.conclusionSummaryTable || {}) as Record<string, "Đ" | "K">,
        appendixDatabase: parsed.appendixDatabase || "",
        appendixDocuments: parsed.appendixDocuments || "",
        appendixEvidences: parsed.appendixEvidences || "",
      }
    }
  } catch {
    return {
      feedback: rawDesc,
      conclusionStrengths: "",
      conclusionWeaknesses: "",
      conclusionPlans: "",
      conclusionProgramName: "",
      conclusionProgramCode: "",
      conclusionEvaluationResult: "",
      conclusionSignDate: "",
      conclusionSignTitle: "",
      conclusionSignPosition: "",
      conclusionSignerName: "",
      conclusionSummaryTable: {} as Record<string, "Đ" | "K">,
      appendixDatabase: "",
      appendixDocuments: "",
      appendixEvidences: "",
    }
  }
  return {
    feedback: "",
    conclusionStrengths: "",
    conclusionWeaknesses: "",
    conclusionPlans: "",
    conclusionProgramName: "",
    conclusionProgramCode: "",
    conclusionEvaluationResult: "",
    conclusionSignDate: "",
    conclusionSignTitle: "",
    conclusionSignPosition: "",
    conclusionSignerName: "",
    conclusionSummaryTable: {} as Record<string, "Đ" | "K">,
    appendixDatabase: "",
    appendixDocuments: "",
    appendixEvidences: "",
  }
}

const SumaryReport = () => {
  const [form] = Form.useForm<SumaryReportFormType>()
  const [rejectForm] = Form.useForm<{ feedback: string }>()
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const [summaryTable, setSummaryTable] = useState<Record<string, "Đ" | "K">>({})

  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "f1218263-341e-40c4-b269-a711a0186c74"
  const { can } = useAbility()

  const { data: lecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: idProfile || "",
      },
    },
    {
      enabled: !!idProfile,
    }
  )

  const { data: councilMember } = useFindFirstEvaluationCouncilMember(
    {
      where: {
        lecturerId: lecturer?.id || "",
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId || "",
        },
      },
      include: {
        evaluationCouncil: true,
      },
    },
    {
      enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
    }
  )

  const isHeadSecretary = councilMember?.role?.includes(
    $Enums.EvaluationMemberRole.HEAD_SECRETARY
  )
  const isAdvisoryBoard = councilMember?.role?.includes(
    $Enums.EvaluationMemberRole.ADVISORY_BOARD
  )
  const isAdmin = can(
    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
    "THEM"
  )

  const canEdit = isHeadSecretary || isAdmin

  const { onOpen: openViewMinhChung } = useDisclosure<{ evidenceId: string }>({
    tag: "ViewMinhChungModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()

  const onFinish = async (values: SumaryReportFormType) => {
    try {
      if (!values) return
      showSpinner()
      const currentDesc = parseDescription(data?.description)
      const updatedDesc = JSON.stringify({
        ...currentDesc,
        conclusionStrengths: values.conclusionStrengths || "",
        conclusionWeaknesses: values.conclusionWeaknesses || "",
        conclusionPlans: values.conclusionPlans || "",
        conclusionProgramName: values.conclusionProgramName || "",
        conclusionProgramCode: values.conclusionProgramCode || "",
        conclusionEvaluationResult: values.conclusionEvaluationResult || "",
        conclusionSignDate: values.conclusionSignDate || "",
        conclusionSignTitle: values.conclusionSignTitle || "",
        conclusionSignPosition: values.conclusionSignPosition || "",
        conclusionSignerName: values.conclusionSignerName || "",
        conclusionSummaryTable: summaryTable,
        appendixDatabase: values.appendixDatabase || "",
        appendixDocuments: values.appendixDocuments || "",
        appendixEvidences: values.appendixEvidences || "",
      })

      const combinedConclude = [
        values.conclusionStrengths
          ? `<h3>1. Tóm tắt những điểm mạnh và những điểm cần phát huy của CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionStrengths}`
          : "",
        values.conclusionWeaknesses
          ? `<h3>2. Tóm tắt những điểm tồn tại và những vấn đề cần cải tiến chất lượng của CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionWeaknesses}`
          : "",
        values.conclusionPlans
          ? `<h3>3. Tóm tắt các kế hoạch cải tiến chất lượng CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionPlans}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")

      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          overviewProblem: values.overviewProblem,
          overviewGeneral: values.overviewGeneral,
          overviewResults: values.overviewResults,
          conclude: combinedConclude || values.conclude,
          description: updatedDesc,
        },
      })

      message.success("Lưu báo cáo thành công")
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
    } catch {
      message.error("Lưu báo cáo thất bại")
      return
    } finally {
      hideSpinner()
    }
  }

  const { data } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        description: true,
        overviewProblem: true,
        overviewGeneral: true,
        overviewResults: true,
        conclude: true,
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
    }
  )

  const isCouncilApproval =
    data?.status === $Enums.EvaluationPeriodStatus.COUNCIL_APPROVAL
  const isCompleted = data?.status === $Enums.EvaluationPeriodStatus.COMPLETED
  const isReadOnly = isCouncilApproval || isCompleted || !canEdit

  const handleToggleEvaluation = (criterionId: string, choice: "Đ" | "K") => {
    if (isReadOnly) return
    setSummaryTable((prev) => {
      const next = { ...prev }
      if (next[criterionId] === choice) {
        delete next[criterionId]
      } else {
        next[criterionId] = choice
      }
      return next
    })
  }

  const handleSelectAllPassed = () => {
    if (isReadOnly || !standardsData?.standards) return
    const next: Record<string, "Đ" | "K"> = {}
    standardsData.standards.forEach((std: any) => {
      std.criteria?.forEach((c: any) => {
        next[c.id] = "Đ"
      })
    })
    setSummaryTable(next)
    message.success("Đã chọn Đạt (Đ) cho tất cả các tiêu chí")
  }

  const handleClearAll = () => {
    if (isReadOnly) return
    setSummaryTable({})
    message.info("Đã xóa tất cả kết quả đánh giá")
  }

  const handleSubmitForApproval = async () => {
    try {
      showSpinner()
      const values = form.getFieldsValue()
      const currentDesc = parseDescription(data?.description)
      const updatedDesc = JSON.stringify({
        ...currentDesc,
        conclusionStrengths: values.conclusionStrengths || "",
        conclusionWeaknesses: values.conclusionWeaknesses || "",
        conclusionPlans: values.conclusionPlans || "",
        conclusionProgramName: values.conclusionProgramName || "",
        conclusionProgramCode: values.conclusionProgramCode || "",
        conclusionEvaluationResult: values.conclusionEvaluationResult || "",
        conclusionSignDate: values.conclusionSignDate || "",
        conclusionSignTitle: values.conclusionSignTitle || "",
        conclusionSignPosition: values.conclusionSignPosition || "",
        conclusionSignerName: values.conclusionSignerName || "",
        conclusionSummaryTable: summaryTable,
        appendixDatabase: values.appendixDatabase || "",
        appendixDocuments: values.appendixDocuments || "",
        appendixEvidences: values.appendixEvidences || "",
      })

      const combinedConclude = [
        values.conclusionStrengths
          ? `<h3>1. Tóm tắt những điểm mạnh và những điểm cần phát huy của CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionStrengths}`
          : "",
        values.conclusionWeaknesses
          ? `<h3>2. Tóm tắt những điểm tồn tại và những vấn đề cần cải tiến chất lượng của CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionWeaknesses}`
          : "",
        values.conclusionPlans
          ? `<h3>3. Tóm tắt các kế hoạch cải tiến chất lượng CTĐT (tổng hợp theo từng tiêu chuẩn).</h3>${values.conclusionPlans}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")

      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          overviewProblem: values.overviewProblem,
          overviewGeneral: values.overviewGeneral,
          overviewResults: values.overviewResults,
          conclude: combinedConclude || values.conclude,
          description: updatedDesc,
          status: $Enums.EvaluationPeriodStatus.COUNCIL_APPROVAL,
        },
      })

      message.success("Đã hoàn thành và gửi báo cáo cho Ban tư vấn phê duyệt")
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
    } catch {
      message.error("Gửi duyệt báo cáo thất bại")
    } finally {
      hideSpinner()
    }
  }

  const handleApproveReport = async () => {
    try {
      showSpinner()
      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          status: $Enums.EvaluationPeriodStatus.COMPLETED,
        },
      })

      message.success("Phê duyệt bản báo cáo tự đánh giá cuối cùng thành công")
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
    } catch {
      message.error("Phê duyệt báo cáo thất bại")
    } finally {
      hideSpinner()
    }
  }

  const confirmSubmitForApproval = () => {
    Modal.confirm({
      title: "Xác nhận gửi duyệt báo cáo",
      content:
        "Bạn có chắc chắn muốn hoàn thành và gửi báo cáo cho Ban tư vấn phê duyệt không?",
      okText: "Gửi duyệt",
      cancelText: "Hủy",
      centered: true,
      okButtonProps: {
        className: "!bg-[#0f8a4b] hover:!bg-[#0c703d] text-white border-none",
      },
      onOk: handleSubmitForApproval,
    })
  }

  const confirmApproveReport = () => {
    Modal.confirm({
      title: "Xác nhận phê duyệt",
      content:
        "Bạn có chắc chắn muốn phê duyệt bản báo cáo tự đánh giá cuối cùng này? Sau khi duyệt, đợt đánh giá sẽ hoàn thành.",
      okText: "Phê duyệt",
      cancelText: "Hủy",
      centered: true,
      okButtonProps: {
        className: "!bg-[#0f8a4b] hover:!bg-[#0c703d] text-white border-none",
      },
      onOk: handleApproveReport,
    })
  }

  const handleRejectReport = async (values: { feedback: string }) => {
    try {
      if (!values.feedback?.trim()) {
        message.error("Vui lòng nhập ý kiến nhận xét / yêu cầu chỉnh sửa")
        return
      }
      showSpinner()
      const currentDesc = parseDescription(data?.description)
      const updatedDesc = JSON.stringify({
        ...currentDesc,
        feedback: values.feedback.trim(),
      })

      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          status: $Enums.EvaluationPeriodStatus.CONSOLIDATION,
          description: updatedDesc,
        },
      })

      message.success("Đã gửi yêu cầu chỉnh sửa và trả lại báo cáo thành công")
      setIsRejectModalOpen(false)
      rejectForm.resetFields()
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
    } catch {
      message.error("Gửi yêu cầu chỉnh sửa thất bại")
    } finally {
      hideSpinner()
    }
  }

  const { data: standardsData } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
      },
      include: {
        standards: {
          include: {
            criteria: {
              include: {
                evaluationCriterion: {
                  where: {
                    status: $Enums.EvaluationStatus.COMPLETED,
                  },
                  include: {
                    lecturer: {
                      include: {
                        userProfile: {
                          select: {
                            fullname: true,
                          },
                        },
                      },
                    },
                    evaluationCriterionComments: {
                      include: {
                        reviewer: {
                          select: {
                            fullname: true,
                          },
                        },
                      },
                      orderBy: {
                        createdAt: "desc",
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (data) {
      const parsed = parseDescription(data?.description)
      form.setFieldsValue({
        overviewProblem: data?.overviewProblem,
        overviewGeneral: data?.overviewGeneral,
        overviewResults: data?.overviewResults,
        conclude: data?.conclude,
        conclusionStrengths: parsed.conclusionStrengths || data?.conclude || "",
        conclusionWeaknesses: parsed.conclusionWeaknesses || "",
        conclusionPlans: parsed.conclusionPlans || "",
        conclusionProgramName: parsed.conclusionProgramName || "",
        conclusionProgramCode: parsed.conclusionProgramCode || "",
        conclusionEvaluationResult: parsed.conclusionEvaluationResult || "",
        conclusionSignDate: parsed.conclusionSignDate || "Hà Nội, ngày    tháng    năm 20...",
        conclusionSignTitle: parsed.conclusionSignTitle || "CHỦ TỊCH HỘI ĐỒNG",
        conclusionSignPosition: parsed.conclusionSignPosition || "PHÓ GIÁM ĐỐC",
        conclusionSignerName: parsed.conclusionSignerName || "",
        appendixDatabase: parsed.appendixDatabase,
        appendixDocuments: parsed.appendixDocuments,
        appendixEvidences: parsed.appendixEvidences,
      })
      setSummaryTable(parsed.conclusionSummaryTable || {})
    }
  }, [data, form])

  return (
    <div className="h-[calc(100vh-160px)] overflow-y-auto">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="flex items-center justify-between sticky top-0 z-50 bg-white py-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-3">
            <Typography.Title level={4} className="!mb-0">
              Báo cáo {data?.name}
            </Typography.Title>
            {isCompleted && (
              <Tag color="success">Đã phê duyệt</Tag>
            )}
            {isCouncilApproval && (
              <Tag color="processing">Chờ Ban tư vấn phê duyệt</Tag>
            )}
            {!isCompleted && !isCouncilApproval && (
              <Tag color="warning">Đang soạn thảo</Tag>
            )}
          </div>

          <div className="flex items-center gap-2 mr-3">
            {selectedEvaluationPeriodId && (
              <ExportReport id={selectedEvaluationPeriodId} variant="button" />
            )}

            {!isReadOnly && canEdit && (
              <>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => form.submit()}
                >
                  Lưu báo cáo
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  className="!bg-[#0f8a4b] hover:!bg-[#0c703d] text-white border-none"
                  onClick={confirmSubmitForApproval}
                >
                  Gửi phê duyệt
                </Button>
              </>
            )}

            {(isAdvisoryBoard || isAdmin) && isCouncilApproval && (
              <>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  Yêu cầu chỉnh sửa
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  className="!bg-[#0f8a4b] hover:!bg-[#0c703d] text-white border-none"
                  onClick={confirmApproveReport}
                >
                  Phê duyệt báo cáo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Thông báo trạng thái */}
        {isCompleted && (
          <Alert
            type="success"
            showIcon
            message="Báo cáo tự đánh giá đã được Ban tư vấn phê duyệt hoàn tất."
            className="mb-4"
          />
        )}
        {isCouncilApproval && (
          <Alert
            type="info"
            showIcon
            message="Báo cáo đã hoàn thành và đang trong quá trình chờ Ban tư vấn phê duyệt cuối cùng."
            className="mb-4"
          />
        )}
        {!isCompleted &&
          !isCouncilApproval &&
          parseDescription(data?.description).feedback && (
            <Alert
              type="warning"
              showIcon
              message="Ý kiến nhận xét từ Ban tư vấn (Yêu cầu chỉnh sửa)"
              description={
                <div className="whitespace-pre-wrap font-medium">
                  {parseDescription(data?.description).feedback}
                </div>
              }
              className="mb-4"
            />
          )}

        <Typography.Title level={5}>Phần Ⅰ. KHÁI QUÁT </Typography.Title>
        <Form.Item label="1. Đặt vấn đề" name="overviewProblem">
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item label="2. Tổng quan chung" name="overviewGeneral">
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item
          label="3. Kết quả rà soát việc đáp ứng quy định về chuẩn chương trình đào tạo"
          name="overviewResults"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Typography.Title level={5}>
          Phần Ⅱ. TỰ ĐÁNH GIÁ THEO CÁC TIÊU CHUẨN, TIÊU CHÍ
        </Typography.Title>
        {standardsData && standardsData.standards.length > 0 && (
          <Tabs
            tabPosition="left"
            tabBarStyle={{ height: "100%", overflow: "auto" }}
            items={standardsData.standards.map((standard: DataTabEvaluationCriterionType) => ({
              key: standard.id,
              label: `Tiêu chuẩn ${standard.order}`,
              children: <StandarReportsSubPage key={standard.id} data={standard} readOnly />,
            }))}
          />
        )}
        <Typography.Title level={5}>Phần Ⅲ. KẾT LUẬN </Typography.Title>
        <Form.Item
          label="1. Tóm tắt những điểm mạnh và những điểm cần phát huy của CTĐT (tổng hợp theo từng tiêu chuẩn)."
          name="conclusionStrengths"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item
          label="2. Tóm tắt những điểm tồn tại và những vấn đề cần cải tiến chất lượng của CTĐT (tổng hợp theo từng tiêu chuẩn)."
          name="conclusionWeaknesses"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item
          label="3. Tóm tắt các kế hoạch cải tiến chất lượng CTĐT (tổng hợp theo từng tiêu chuẩn)."
          name="conclusionPlans"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>

        <div className="mt-6 mb-8 border-t border-gray-200 pt-5">
          <Typography.Title level={5} className="!mb-3 text-gray-800">
            4. Tổng hợp kết quả TĐG CTĐT.
          </Typography.Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Form.Item
              label={<span className="font-semibold text-gray-700">Tên CTĐT:</span>}
              name="conclusionProgramName"
              className="!mb-0"
            >
              <Input
                placeholder="Nhập tên chương trình đào tạo..."
                disabled={isReadOnly}
              />
            </Form.Item>
            <Form.Item
              label={<span className="font-semibold text-gray-700">Mã CTĐT:</span>}
              name="conclusionProgramCode"
              className="!mb-0"
            >
              <Input
                placeholder="Nhập mã chương trình đào tạo..."
                disabled={isReadOnly}
              />
            </Form.Item>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end my-3">
              <div className="flex gap-2">
                <Button size="small" type="primary" ghost onClick={handleSelectAllPassed}>
                  Chọn tất cả Đạt (Đ)
                </Button>
                <Button size="small" danger ghost onClick={handleClearAll}>
                  Xóa tất cả
                </Button>
              </div>
            </div>
          )}

          <div className="border border-gray-300 rounded-lg overflow-x-auto shadow-sm bg-white">
            <table className="w-full border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-100 text-gray-900 border-b border-gray-300">
                  <th
                    rowSpan={2}
                    className="border border-gray-300 px-3 py-2 text-center font-bold min-w-[280px]"
                  >
                    Tiêu chuẩn, tiêu chí
                  </th>
                  <th
                    colSpan={2}
                    className="border border-gray-300 px-3 py-2 text-center font-bold w-[120px]"
                  >
                    Kết quả đánh giá
                  </th>
                  <th
                    colSpan={4}
                    className="border border-gray-300 px-3 py-2 text-center font-bold"
                  >
                    Tổng hợp theo tiêu chuẩn
                  </th>
                </tr>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-300 text-xs font-semibold">
                  <th className="border border-gray-300 px-2 py-2 text-center w-[60px] text-red-600">
                    K
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-[60px] text-green-700">
                    Đ
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-[90px]">
                    Số tiêu chí K
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-[120px]">
                    Tỷ lệ số tiêu chí K (%)
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-[90px]">
                    Số tiêu chí Đ
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-[120px]">
                    Tỷ lệ số tiêu chí Đ (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {!standardsData?.standards || standardsData.standards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      Chưa có dữ liệu tiêu chuẩn, tiêu chí của đợt đánh giá
                    </td>
                  </tr>
                ) : (
                  standardsData.standards.map((std: any) => {
                    const criteria = std.criteria || []
                    const totalCrit = criteria.length
                    const countD = criteria.filter((c: any) => summaryTable[c.id] === "Đ").length
                    const countK = criteria.filter((c: any) => summaryTable[c.id] === "K").length
                    const rateD = totalCrit > 0 ? ((countD / totalCrit) * 100).toFixed(1) : "0.0"
                    const rateK = totalCrit > 0 ? ((countK / totalCrit) * 100).toFixed(1) : "0.0"
                    const rowSpanCount = totalCrit + 1

                    return (
                      <Fragment key={std.id}>
                        <tr className="bg-blue-50/50 font-bold border-b border-gray-300">
                          <td className="border border-gray-300 px-3 py-2 text-gray-900 italic">
                            Tiêu chuẩn {std.order}: {std.name}
                          </td>
                          <td className="border border-gray-300 bg-gray-100/60"></td>
                          <td className="border border-gray-300 bg-gray-100/60"></td>
                          <td
                            rowSpan={rowSpanCount}
                            className="border border-gray-300 px-2 py-2 text-center font-bold text-red-600 align-middle bg-white"
                          >
                            {countK}
                          </td>
                          <td
                            rowSpan={rowSpanCount}
                            className="border border-gray-300 px-2 py-2 text-center font-semibold text-red-600 align-middle bg-white"
                          >
                            {rateK}%
                          </td>
                          <td
                            rowSpan={rowSpanCount}
                            className="border border-gray-300 px-2 py-2 text-center font-bold text-green-700 align-middle bg-white"
                          >
                            {countD}
                          </td>
                          <td
                            rowSpan={rowSpanCount}
                            className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-700 align-middle bg-white"
                          >
                            {rateD}%
                          </td>
                        </tr>

                        {criteria.map((crit: any) => {
                          const val = summaryTable[crit.id]
                          return (
                            <tr
                              key={crit.id}
                              className="hover:bg-gray-50/80 transition-colors border-b border-gray-200"
                            >
                              <td className="border border-gray-300 px-3 py-1.5 pl-6 text-gray-800">
                                Tiêu chí {std.order}.{crit.order}: {crit.name}
                              </td>
                              <td
                                className={`border border-gray-300 text-center select-none transition-colors ${
                                  !isReadOnly ? "cursor-pointer" : ""
                                } ${
                                  val === "K"
                                    ? "bg-red-100 text-red-700 font-bold"
                                    : "hover:bg-red-50/50"
                                }`}
                                onClick={() => handleToggleEvaluation(crit.id, "K")}
                              >
                                <Radio
                                  checked={val === "K"}
                                  disabled={isReadOnly}
                                  className="pointer-events-none"
                                />
                              </td>
                              <td
                                className={`border border-gray-300 text-center select-none transition-colors ${
                                  !isReadOnly ? "cursor-pointer" : ""
                                } ${
                                  val === "Đ"
                                    ? "bg-green-100 text-green-700 font-bold"
                                    : "hover:bg-green-50/50"
                                }`}
                                onClick={() => handleToggleEvaluation(crit.id, "Đ")}
                              >
                                <Radio
                                  checked={val === "Đ"}
                                  disabled={isReadOnly}
                                  className="pointer-events-none"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 bg-gray-50/80 p-3 rounded-lg border border-gray-200">
            <span className="font-bold text-gray-800 text-sm">
              Tự đánh giá CTĐT:
            </span>
            <Form.Item name="conclusionEvaluationResult" className="!mb-0">
              <Radio.Group disabled={isReadOnly}>
                <Radio value="Đạt">
                  <span className="font-semibold text-green-700">Đạt</span>
                </Radio>
                <Radio value="Đạt có điều kiện">
                  <span className="font-semibold text-amber-700">Đạt có điều kiện</span>
                </Radio>
                <Radio value="Không đạt">
                  <span className="font-semibold text-red-600">Không đạt</span>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Khung chữ ký */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="flex justify-center">
              <div className="w-full max-w-sm bg-gray-50/70 p-4 rounded-lg border border-gray-200 space-y-2">
                <Form.Item name="conclusionSignDate" className="!mb-2">
                <Input
                  placeholder="Hà Nội, ngày    tháng    năm 20..."
                  className="text-center italic"
                  disabled={isReadOnly}
                />
              </Form.Item>
              <Form.Item name="conclusionSignTitle" className="!mb-2">
                <Input
                  placeholder="CHỦ TỊCH HỘI ĐỒNG"
                  className="text-center font-bold uppercase"
                  disabled={isReadOnly}
                />
              </Form.Item>
              <div className="py-6 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 rounded my-2 bg-white">
                (Ký, ghi rõ họ tên)
              </div>
              <Form.Item name="conclusionSignPosition" className="!mb-2">
                <Input
                  placeholder="PHÓ GIÁM ĐỐC"
                  className="text-center font-bold uppercase"
                  disabled={isReadOnly}
                />
              </Form.Item>
              <Form.Item name="conclusionSignerName" className="!mb-0">
                <Input
                  className="text-center font-bold text-base text-gray-900"
                  disabled={isReadOnly}
                />
              </Form.Item>
            </div>
          </div>
        </div>
      </div>

        <Typography.Title level={5}>Phần Ⅳ. PHỤ LỤC</Typography.Title>
        <Form.Item
          label={
            <span className="font-semibold text-gray-800">
              1. Cơ sở dữ liệu kiểm định chất lượng CTĐT
            </span>
          }
          name="appendixDatabase"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item
          label={
            <span className="font-semibold text-gray-800">
              2. Các tư liệu, tài liệu liên quan
            </span>
          }
          name="appendixDocuments"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
        <Form.Item
          label={
            <span className="font-semibold text-gray-800">
              3. Danh mục minh chứng sử dụng trong quá trình TĐG và viết báo cáo TĐG
            </span>
          }
          name="appendixEvidences"
        >
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>
      </Form>

      {/* Modal Ban tư vấn yêu cầu chỉnh sửa */}
      <Modal
        title="Yêu cầu chỉnh sửa báo cáo tự đánh giá"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false)
          rejectForm.resetFields()
        }}
        onOk={() => rejectForm.submit()}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectReport}>
          <Form.Item
            label="Ý kiến nhận xét / Nội dung cần chỉnh sửa"
            name="feedback"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập ý kiến nhận xét / yêu cầu chỉnh sửa!",
              },
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Nhập chi tiết các nội dung, số liệu, tiêu chuẩn/tiêu chí cần giảng viên và trưởng ban thư ký chỉnh sửa, hoàn thiện lại..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SumaryReport
