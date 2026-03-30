import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ExamBank } from "@workspace/db"
import { useCreateExamBank, useFindUniqueExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutExamBankType = ExamBank
const PutExamBank = () => {
  const [form] = Form.useForm<PutExamBankType>()
  const { isOpen, onClose, input } = useDisclosure<{ examId: string; id: string }>({
    tag: "PutExamBank",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createExamBank } = useCreateExamBank()
  const { mutateAsync: updateExamBank } = useUpdateExamBank()
  async function onOk(output?: PutExamBankType) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.examId) {
        message.error("Thiếu mã kỳ thi")
        hideSpinner()
        return
      }
      const data = {
        examId: input?.examId,
        examCode: output?.examCode,
      }
      if (input?.id) {
        await updateExamBank({
          data,
          where: {
            id: input.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createExamBank({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["ExamBank"],
      })
      onClose()
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

  const { data: initialValue } = useFindUniqueExamBank(
    {
      where: { id: input?.id },
    },
    {
      enabled: !!input?.id,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    }
  }, [initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa đề thi" : "Thêm mới đề thi"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="examCode" label="Mã đề thi" required>
          <Input placeholder="Nhập mã đề thi" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutExamBank
