import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import type { $Enums, EvaluationStandardSet } from "@workspace/db/client"
import {
  useCreateEvaluationStandardSet,
  useFindUniqueEvaluationStandardSet,
  useUpdateEvaluationStandardSet,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const PutBoTieuChuanModal = () => {
  const [form] = Form.useForm<EvaluationStandardSet>()

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    objectType: $Enums.StandardCatalogType
  }>({
    tag: "PutBoTieuChuanModal",
    onClose: () => {
      form.resetFields()
    },
  })


  const { data: initialValue } = useFindUniqueEvaluationStandardSet(
    {
      where: {
        id: input?.id || "",
        standards: {
          some: {
            objectType: input?.objectType,
            deletedAt: null,
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { mutateAsync: createEvaluationStandardSet } = useCreateEvaluationStandardSet()
  const { mutateAsync: updateEvaluationStandardSet } = useUpdateEvaluationStandardSet()

  const onOk = async (output: EvaluationStandardSet) => {
    try {
      if (!output || !input?.objectType) return

      if (input?.id) {
        await updateEvaluationStandardSet({
          where: {
            id: input.id,
          },
          data: {
            code: output.code,
            name: output.name,
          },
        })
      } else {
        await createEvaluationStandardSet({
          data: {
            code: output.code,
            name: output.name,
            objectType: input.objectType,
          },
        })
      }

      message.success(
        input?.id ? "Cập nhật bộ tiêu chuẩn thành công" : "Tạo bộ tiêu chuẩn thành công"
      )

      onClose()
    } catch (error) {
      message.error(input?.id ? "Cập nhật bộ tiêu chuẩn thất bại" : "Tạo bộ tiêu chuẩn thất bại")
      return
    }
  }

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue(initialValue)
    }
  }, [initialValue, form])

  return (
    <PutFormModal
      open={isOpen}
      onCancel={onClose}
      title={input?.id ? "Cập nhật bộ tiêu chuẩn" : "Tạo bộ tiêu chuẩn mới"}
      onFinish={onOk}
      className="w-[50vw]"
      form={form}
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã bộ tiêu chuẩn">
          <Input placeholder="Nhập mã bộ tiêu chuẩn" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên bộ tiêu chuẩn" required>
          <Input placeholder="Nhập tên bộ tiêu chuẩn" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutBoTieuChuanModal
