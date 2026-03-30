import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingTime } from "@workspace/db/client"
import {
  useCreateTrainingTime,
  useFindUniqueTrainingTime,
  useUpdateTrainingTime,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutRoom = TrainingTime
const PutTrainingTimeModal = () => {
  const [form] = Form.useForm<PutRoom>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingTimeModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateTrainingTime()
  const { mutateAsync: update } = useUpdateTrainingTime()
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
        queryKey: ["TrainingTime"],
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

  const { data } = useFindUniqueTrainingTime(
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
      title={id ? "Chỉnh sửa thời gian đào tạo" : "Thêm mới thời gian đào tạo"}
      className="w-[45vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã thời gian đào tạo" required>
          <Input placeholder="Nhập mã thời gian đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên thời gian đào tạo" required>
          <Input placeholder="Nhập tên thời gian đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"active"} label="Trạng thái" required>
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Đang hoạt động</Radio>
            <Radio value={false}>Ngừng hoạt động</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutTrainingTimeModal
