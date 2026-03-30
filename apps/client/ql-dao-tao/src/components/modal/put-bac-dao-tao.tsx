import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { type DiplomaType, DiplomaTypeEnum } from "@workspace/db/client"
import {
  useCreateDiplomaType,
  useFindUniqueDiplomaType,
  useUpdateDiplomaType,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useDiplomaTypeOptions } from "@hooks/diplomaType"
export type PutDiplomaTypeFormType = DiplomaType
dayjs.locale("vi")
const PutDiplomaType = () => {
  const [form] = Form.useForm<PutDiplomaTypeFormType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutDiplomaType",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { options: diplomaTypeOptions } = useDiplomaTypeOptions()
  const { mutateAsync: createDiplomaType } = useCreateDiplomaType()
  const { mutateAsync: updateDiplomaType } = useUpdateDiplomaType()
  async function onOk(output?: PutDiplomaTypeFormType) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        code: output.code,
        name: output.name.trim(),
        englishName: output.englishName,
        description: output.description,
        type: output.type,
      }
      if (id) {
        await updateDiplomaType({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createDiplomaType({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["DiplomaType"],
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

  const { data: initialValue } = useFindUniqueDiplomaType(
    {
      where: { id },
    },
    { enabled: !!id }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    } else {
      form.setFieldsValue({
        type: DiplomaTypeEnum.ENGINEER,
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
      title={id ? "Chỉnh sửa bậc đào tạo" : "Thêm mới bậc đào tạo"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã bậc đào tạo">
          <Input placeholder="Nhập mã bậc đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên bậc đào tạo" required>
          <Input placeholder="Nhập tên bậc đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="englishName" label="Tên tiếng anh">
          <Input placeholder="Nhập tên tiếng anh" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="type" label="Loại văn bằng">
          <Select
            placeholder="Chọn loại văn bằng"
            options={diplomaTypeOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            defaultValue={DiplomaTypeEnum.ENGINEER}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutDiplomaType
