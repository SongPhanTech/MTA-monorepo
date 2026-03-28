import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingForm } from "@workspace/db/client"
import {
  useCreateTrainingForm,
  useFindUniqueTrainingForm,
  useUpdateTrainingForm,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutRoom = TrainingForm
const PutTrainingFormModal = () => {
  const [form] = Form.useForm<PutRoom>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingFormModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateTrainingForm()
  const { mutateAsync: update } = useUpdateTrainingForm()
  async function onOk(value: PutRoom) {
    try {
      showSpinner()
      if (id) {
        await update({
          data: {
            ...value,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            ...value,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingForm"],
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

  const { data } = useFindUniqueTrainingForm(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [data])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa hình thức huấn luyện" : "Thêm mới hình thức huấn luyện"}
      className="w-[45vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã hình thức huấn luyện" required>
          <Input placeholder="Nhập mã hình thức huấn luyện" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên hình thức huấn luyện" required>
          <Input placeholder="Nhập tên hình thức huấn luyện" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {id && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutTrainingFormModal
