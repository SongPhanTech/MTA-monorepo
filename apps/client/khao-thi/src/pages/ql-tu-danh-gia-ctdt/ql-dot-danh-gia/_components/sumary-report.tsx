import { Button, Form, message, Typography } from "antd"
import { useStore } from "@tanstack/react-store"
import { evaluationPeriodStore } from ".."
import { useFindUniqueEvaluationPeriod, useUpdateEvaluationPeriod } from "@workspace/db/hooks"
import type { Prisma } from "@workspace/db/client"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import { useEffect } from "react"
import useSpinner from "@hooks/spinner"
import { queryClient } from "@api/index"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import ExportReport from "./export-report"

type SumaryReportEvaluationPeriodType = Prisma.EvaluationPeriodGetPayload<{
  select: {
    overviewProblem: true
    overviewGeneral: true
    overviewResults: true
    conclude: true
  }
}>

const SumaryReport = () => {
  const [form] = Form.useForm<SumaryReportEvaluationPeriodType>()
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { can } = useAbility()

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()

  const onFinish = async (values: SumaryReportEvaluationPeriodType) => {
    console.log(values)
    try {
      if (!values) return
      showSpinner()
      await updateEvaluationPeriod({
        where: {
          id: selectedEvaluationPeriodId,
        },
        data: {
          overviewProblem: values.overviewProblem,
          overviewGeneral: values.overviewGeneral,
          overviewResults: values.overviewResults,
          conclude: values.conclude,
        },
      })

      message.success("Lưu báo cáo thành công")
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
    } catch (error) {
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
        name: true,
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

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        overviewProblem: data?.overviewProblem,
        overviewGeneral: data?.overviewGeneral,
        overviewResults: data?.overviewResults,
        conclude: data?.conclude,
      })
    }
  }, [data, form.setFieldsValue])

  return (
    <div className="h-[calc(100vh-160px)] overflow-y-auto">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="flex items-center justify-between sticky top-0 z-50 bg-white">
          <Typography.Title level={4} className="!mb-0">
            Báo cáo {data?.name}
          </Typography.Title>
          <div className="flex items-center gap-2 mr-3">
            {selectedEvaluationPeriodId && (
              <ExportReport id={selectedEvaluationPeriodId} variant="button" />
            )}
            <Button type="primary" htmlType="submit">
              Lưu báo cáo
            </Button>
          </div>
        </div>
        <Typography.Title level={5}>Phần Ⅰ. KHÁI QUÁT </Typography.Title>
        <Form.Item label="1. Đặt vấn đề" name="overviewProblem">
          <RichTextEditor />
        </Form.Item>
        <Form.Item label="2. Tổng quan chung" name="overviewGeneral">
          <RichTextEditor />
        </Form.Item>
        <Form.Item
          label="3. Kết quả rà soát việc đáp ứng quy định về chuẩn chương trình đào tạo"
          name="overviewResults"
        >
          <RichTextEditor />
        </Form.Item>
        <Typography.Title level={5}>Phần Ⅲ. KẾT LUẬN </Typography.Title>
        <Form.Item name="conclude">
          <RichTextEditor />
        </Form.Item>
      </Form>
    </div>
  )
}

export default SumaryReport
