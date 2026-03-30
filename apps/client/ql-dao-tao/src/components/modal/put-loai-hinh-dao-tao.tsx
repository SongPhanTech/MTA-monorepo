import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingType } from "@workspace/db/client"
import {
  useCreateTrainingType,
  useFindUniqueTrainingType,
  useUpdateTrainingType,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

dayjs.locale("vi")
const PutTrainingTypeModal = () => {
  const [form] = Form.useForm<TrainingType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingTypeModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createTrainingType } = useCreateTrainingType()
  const { mutateAsync: updateTrainingType } = useUpdateTrainingType()
  async function onOk({ ...rest }: TrainingType) {
    try {
      showSpinner()
      if (id) {
        await updateTrainingType({
          data: {
            ...rest,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingType({
          data: {
            ...rest,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingType"],
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

  const { data: level } = useFindUniqueTrainingType(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      form.setFieldsValue({
        ...level,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa loại hình đào tạo" : "Thêm mới loại hình đào tạo"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên loại hình đào tạo" required>
          <Input placeholder="Nhập tên loại hình đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {id && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái">
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

export default PutTrainingTypeModal
