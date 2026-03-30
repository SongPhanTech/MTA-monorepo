import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Building } from "@workspace/db/client"
import { useCreateBuilding, useFindUniqueBuilding, useUpdateBuilding } from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutTrainingLocation = Building
const PutBuildingModal = () => {
  const [form] = Form.useForm<PutTrainingLocation>()
  const { isOpen, onClose, input } = useDisclosure<{
    trainingLocationId: string
    id?: string
  }>({
    tag: "PutBuildingModal",
    onClose: form.resetFields,
  })

  const id = input?.id
  const trainingLocationId = input?.trainingLocationId
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateBuilding()
  const { mutateAsync: update } = useUpdateBuilding()
  async function onOk(value: PutTrainingLocation) {
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
            trainingLocationId: trainingLocationId,
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["TrainingLocation"],
      })
      queryClient.invalidateQueries({
        queryKey: ["Building"],
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

  const { data } = useFindUniqueBuilding(
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
      title={id ? "Chỉnh sửa toà nhà" : "Thêm mới toà nhà"}
      className="w-[45vw]"
    >
      <Col span={8}>
        <FormItem form={form} name="code" label="Mã toà nhà" required>
          <Input placeholder="Nhập mã toà nhà" />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="name" label="Tên toà nhà" required>
          <Input placeholder="Nhập tên toà nhà" />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="floor" label="Số tầng">
          <InputNumber
            type="number"
            className="w-full"
            step={1}
            min={0}
            placeholder="Nhập số tầng"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"active"} label="Trạng thái">
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Đang hoạt động</Radio>
            <Radio value={false}>Ngừng hoạt động</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutBuildingModal
