import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DisciplinaryWarningReason } from "@workspace/db/client"
import {
  useCreateDisciplinaryWarningReason,
  useFindUniqueDisciplinaryWarningReason,
  useUpdateDisciplinaryWarningReason,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
export type PutDisciplinaryWarningReasonFormType = DisciplinaryWarningReason
dayjs.locale("vi")
const PutDisciplinaryWarningReason = () => {
  const [form] = Form.useForm<PutDisciplinaryWarningReasonFormType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutDisciplinaryWarningReason",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDisciplinaryWarningReason } = useCreateDisciplinaryWarningReason()
  const { mutateAsync: updateDisciplinaryWarningReason } = useUpdateDisciplinaryWarningReason()
  async function onOk(output?: PutDisciplinaryWarningReasonFormType) {
    if (!output) return

    if (
      output.severityLevel === undefined ||
      output.severityLevel < 0 ||
      output.severityLevel > 4
    ) {
      message.error("Mức nâng phải từ 0 đến 4")
      return
    }

    try {
      showSpinner()
      const data = {
        name: output.name.trim(),
        severityLevel: output.severityLevel,
        description: output.description,
        active: output.active,
      }
      if (id) {
        await updateDisciplinaryWarningReason({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createDisciplinaryWarningReason({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["DisciplinaryWarningReason"],
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

  const { data: initialValue } = useFindUniqueDisciplinaryWarningReason(
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
        active: true,
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
      title={id ? "Chỉnh sửa cảnh cáo học đường" : "Thêm mới cảnh cáo học đường"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên cảnh cáo học đường" required>
          <Input placeholder="Nhập tên cảnh cáo học đường" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="severityLevel" label="Mức nâng (0-4)" required>
          <InputNumber type="number" placeholder="Nhập mức nâng" className="w-full" step={1} />
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

export default PutDisciplinaryWarningReason
