import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { store } from "@pages/thiet-lap-de-thi/khung-de"
import { useStore } from "@tanstack/react-store"
import type { ExamMatrix } from "@workspace/db"
import {
  useCreateExamMatrix,
  useFindUniqueExamMatrix,
  useUpdateExamMatrix,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutMaTranDeInputType = ExamMatrix

const PutMaTranDeModal = () => {
  const [form] = Form.useForm<PutMaTranDeInputType>()
  const { examFrameworkId } = useStore(store)

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
  }>({
    tag: "PutMaTranDeModal",
    onClose: form.resetFields,
  })

  const { mutateAsync: createExamMatrix } = useCreateExamMatrix()
  const { mutateAsync: updateExamMatrix } = useUpdateExamMatrix()

  const { data: examMatrixData } = useFindUniqueExamMatrix(
    {
      where: { id: input?.id || "" },
    },
    {
      enabled: !!input?.id,
    }
  )

  useEffect(() => {
    if (examMatrixData && input?.id) {
      form.setFieldsValue({
        code: examMatrixData.code,
        name: examMatrixData.name,
      })
    }
  }, [examMatrixData, input?.id, form])

  const onOk = async (values: PutMaTranDeInputType) => {
    try {
      if (!values || !examFrameworkId) return

      if (input?.id) {
        await updateExamMatrix({
          where: {
            id: input.id,
          },
          data: {
            code: values.code,
            name: values.name,
          },
        })
        message.success("Cập nhật ma trận đề thành công!")
      } else {
        await createExamMatrix({
          data: {
            code: values.code,
            name: values.name,
            examFrameworkId,
          },
        })
        message.success("Thêm mới ma trận đề thành công!")
      }

      queryClient.invalidateQueries({
        queryKey: ["ExamMatrix"],
      })

      onClose()
    } catch (error) {
      message.error(input?.id ? "Cập nhật ma trận đề thất bại!" : "Thêm mới ma trận đề thất bại!")
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      title={input?.id ? "Cập nhật ma trận đề" : "Thêm mới ma trận đề"}
      onCancel={onClose}
      onFinish={onOk}
      className="w-[50vw] top-5"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã ma trận đề">
          <Input placeholder="Nhập mã ma trận đề" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên ma trận đề" required>
          <Input placeholder="Nhập tên ma trận đề" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutMaTranDeModal
