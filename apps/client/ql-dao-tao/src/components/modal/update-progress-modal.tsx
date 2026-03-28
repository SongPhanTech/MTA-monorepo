import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Prisma } from "@workspace/db/"
import { useUpdateManyThesisProject } from "@workspace/db/hooks"
import { Col, Form, InputNumber, message, Select } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

export interface UpdateProgressForm {
  progress?: number
  isEligibleForDefense: boolean
}

export const UpdateProgressModal = () => {
  const [form] = Form.useForm()
  const { isOpen, onClose, input } = useDisclosure<{
    selectedRowKeys: string[]
    type: "FIRST" | "SECOND"
    onSuccess?: () => void
  }>({
    tag: "UpdateProgressModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateManyThesisProject } = useUpdateManyThesisProject()

  async function onOk(output?: UpdateProgressForm) {
    if (!output || !input?.selectedRowKeys.length) return

    try {
      showSpinner()

      const dataToUpdate: Prisma.ThesisProjectUncheckedUpdateManyInput = {
        isEligibleForDefense: output.isEligibleForDefense,
      }

      if (input.type === "FIRST") {
        dataToUpdate.firstCheckProgress = output.progress
      } else {
        dataToUpdate.secondCheckProgress = output.progress
      }

      await updateManyThesisProject({
        where: { id: { in: input.selectedRowKeys } },
        data: dataToUpdate,
      })

      message.success("Cập nhật thành công")
      input.onSuccess?.()
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={`Cập nhật tiến độ kiểm tra lần ${input?.type === "FIRST" ? "1" : "2"}`}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem
          form={form}
          name="progress"
          label={`Tiến độ kiểm tra lần ${input?.type === "FIRST" ? "1" : "2"} (%)`}
          required
        >
          <InputNumber min={0} max={100} placeholder="Nhập tiến độ" className="w-full" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem
          form={form}
          name="isEligibleForDefense"
          label="Đủ điều kiện bảo vệ"
          initialValue={true}
        >
          <Select
            placeholder="Chọn trạng thái"
            options={[
              { label: "Đủ điều kiện", value: true },
              { label: "Không đủ điều kiện", value: false },
            ]}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default UpdateProgressModal
