import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Room } from "@workspace/db/client"
import { useCreateRoom, useFindUniqueRoom, useUpdateRoom } from "@workspace/db/hooks"
import { Checkbox, Col, Form, Input, InputNumber, message, Radio } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutRoom = Room
const PutRoomModal = () => {
  const [form] = Form.useForm<PutRoom>()
  const { isOpen, onClose, input } = useDisclosure<{
    buildingId: string
    buildingCode: string
    id?: string
  }>({
    tag: "PutRoomModal",
    onClose: form.resetFields,
  })

  const id = input?.id
  const buildingId = input?.buildingId
  const buildingCode = input?.buildingCode
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateRoom()
  const { mutateAsync: update } = useUpdateRoom()
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
            buildingId,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["Room"],
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

  const { data } = useFindUniqueRoom(
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
        trainingRoom: true,
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
      title={id ? "Chỉnh sửa phòng" : "Thêm mới phòng"}
      className="w-[45vw]"
      formProps={{
        onValuesChange: (changedValues) => {
          if (changedValues.name) {
            form.setFieldsValue({
              code: `${buildingCode} ${changedValues.name}`
                .toUpperCase()
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replace(/ /g, "-")
                .trim(),
            })
          }
        },
      }}
    >
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên phòng" required>
          <Input placeholder="Nhập tên phòng" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="code" label="Mã phòng" required>
          <Input placeholder="Nhập mã phòng" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="capacity" label="Số chỗ ngồi" required>
          <InputNumber min={0} type="number" className="w-full" placeholder="Số chỗ ngồi" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="examCapacity" label="Số chỗ ngồi thi">
          <InputNumber min={0} type="number" className="w-full" placeholder="Số chỗ ngồi thi" />
        </FormItem>
      </Col>
      <Col span={6}>
        <FormItem
          form={form}
          layout="horizontal"
          name="trainingRoom"
          label="Phòng học"
          valuePropName="checked"
        >
          <Checkbox />
        </FormItem>
      </Col>
      <Col span={6}>
        <FormItem
          form={form}
          layout="horizontal"
          name="laboratoryRoom"
          label="Phòng thí nghiệm"
          valuePropName="checked"
        >
          <Checkbox />
        </FormItem>
      </Col>
      <Col span={6}>
        <FormItem
          form={form}
          layout="horizontal"
          name="computerRoom"
          label="Phòng máy"
          valuePropName="checked"
        >
          <Checkbox />
        </FormItem>
      </Col>
      <Col span={6}>
        <FormItem
          form={form}
          layout="horizontal"
          name="examRoom"
          label="Phòng thi"
          valuePropName="checked"
        >
          <Checkbox />
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

export default PutRoomModal
