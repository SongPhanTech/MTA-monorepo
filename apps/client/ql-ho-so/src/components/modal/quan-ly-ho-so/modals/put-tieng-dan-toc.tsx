import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { TiengDanToc } from "@workspace/db"
import { useFindManyDM_DanToc } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutTiengDanTocModal() {
  const [form] = Form.useForm<TiengDanToc>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<TiengDanToc> & { onSave: (val: TiengDanToc) => void }
  >({
    tag: "PutTiengDanTocModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data = [] } = useFindManyDM_DanToc()

  // Load dữ liệu khi edit
  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: TiengDanToc) {
    try {
      showSpinner()

      const dataToSave: TiengDanToc = {
        ...values,
      }

      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật tiếng dân tộc thành công" : "Thêm mới tiếng dân tộc thành công"
      )
      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      hideSpinner()
    }
  }

  const isEdit = input && Object.keys(input).some((key) => key !== "onSave")

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={isEdit ? "Cập nhật trình độ tiếng dân tộc" : "Thêm mới trình độ tiếng dân tộc"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tiếng dân tộc" name="danTocId" required form={form}>
          <Select
            placeholder="Chọn tiếng dân tộc"
            options={data.map((i) => ({
              label: i.sTen,
              value: i.Id,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Mức độ nghe" name="nghe" required form={form}>
          <Input placeholder="Nhập mức độ nghe" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Mức độ nói" name="noi" required form={form}>
          <Input placeholder="Nhập mức độ nói" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Mức độ viết" name="viet" required form={form}>
          <Input placeholder="Nhập mức độ viết" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
