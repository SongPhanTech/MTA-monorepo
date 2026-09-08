import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
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
import { useEffect, useState } from "react"
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
  appendixDatabase?: string | null
  appendixDocuments?: string | null
  appendixEvidences?: string | null
}

const parseDescription = (rawDesc?: string | null) => {
  if (!rawDesc) {
    return {
      feedback: "",
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
        appendixDatabase: parsed.appendixDatabase || "",
        appendixDocuments: parsed.appendixDocuments || "",
        appendixEvidences: parsed.appendixEvidences || "",
      }
    }
  } catch {
    return {
      feedback: rawDesc,
      appendixDatabase: "",
      appendixDocuments: "",
      appendixEvidences: "",
    }
  }
  return {
    feedback: "",
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
        appendixDatabase: values.appendixDatabase || "",
        appendixDocuments: values.appendixDocuments || "",
        appendixEvidences: values.appendixEvidences || "",
      })

      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          overviewProblem: values.overviewProblem,
          overviewGeneral: values.overviewGeneral,
          overviewResults: values.overviewResults,
          conclude: values.conclude,
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

  const handleSubmitForApproval = async () => {
    try {
      showSpinner()
      const values = form.getFieldsValue()
      const currentDesc = parseDescription(data?.description)
      const updatedDesc = JSON.stringify({
        ...currentDesc,
        appendixDatabase: values.appendixDatabase || "",
        appendixDocuments: values.appendixDocuments || "",
        appendixEvidences: values.appendixEvidences || "",
      })

      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          overviewProblem: values.overviewProblem,
          overviewGeneral: values.overviewGeneral,
          overviewResults: values.overviewResults,
          conclude: values.conclude,
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
        appendixDatabase: parsed.appendixDatabase,
        appendixDocuments: parsed.appendixDocuments,
        appendixEvidences: parsed.appendixEvidences,
      })
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
        <Form.Item name="conclude">
          <RichTextEditor
            editable={!isReadOnly}
            onEvidenceClick={(id) => openViewMinhChung({ evidenceId: id })}
          />
        </Form.Item>

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
