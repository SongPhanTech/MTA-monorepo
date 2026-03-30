import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { AcademicActionConfig } from "@workspace/db/client"
import {
  useCreateAcademicActionConfig,
  useFindUniqueAcademicActionConfig,
  useUpdateAcademicActionConfig,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useAcademicActionTypeOption } from "@hooks/academicActionType"
export type PutAcademicActionConfigFromType = AcademicActionConfig

type AcademicActionConfigInput = {
  id: string
  trainingCourseId: string
}

dayjs.locale("vi")
const PutAcademicActionConfig = () => {
  const [form] = Form.useForm<PutAcademicActionConfigFromType>()
  const { options: academicActionTypeOptions } = useAcademicActionTypeOption()
  const { isOpen, onClose, input } = useDisclosure<AcademicActionConfigInput>({
    tag: "PutAcademicActionConfig",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createAcademicActionConfig } = useCreateAcademicActionConfig()
  const { mutateAsync: updateAcademicActionConfig } = useUpdateAcademicActionConfig()
  async function onOk(output: PutAcademicActionConfigFromType) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.trainingCourseId) {
        message.error("Thiếu mã khoá đào tạo")
        hideSpinner()
        return
      }
      const data = {
        ...output,
        trainingCourseId: input.trainingCourseId,
      }
      if (input?.id) {
        await updateAcademicActionConfig({ data, where: { id: input?.id } })
        message.success("Cập nhật thành công")
      } else {
        await createAcademicActionConfig({ data })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["AcademicActionConfig"],
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

  const { data: initialValue } = useFindUniqueAcademicActionConfig(
    {
      where: { id: input?.id },
    },
    { enabled: !!input?.id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    } else {
      form.setFieldsValue({ active: true })
    }
  }, [initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa cấu hình xử lý" : "Thêm mới cấu hình xử lý"}
    >
      <Col span={12}>
        <FormItem form={form} label="Loại hành động xử lý" name="actionType" required>
          <Select
            placeholder="Chọn trường được đánh giá"
            options={academicActionTypeOptions}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên cấu hình" required>
          <Input placeholder="Nhập tên cấu hình" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {input?.id && (
        <Col span={12}>
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

export default PutAcademicActionConfig
