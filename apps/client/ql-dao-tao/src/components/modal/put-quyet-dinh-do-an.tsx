import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Decision, DocumentFile } from "@workspace/db/client"
import { useCreateDecision, useFindUniqueDecision, useUpdateDecision } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import Select from "@components/commons/select"
import { useDecisionTypeOptions } from "@hooks/decisionType"
export type PutDecision = Decision & {
  documentFile: DocumentFile[]
}
dayjs.locale("vi")

type DecisionInput = {
  thesisProjectId: string
  decisionId: string
}

const PutDecision = () => {
  const [form] = Form.useForm<PutDecision>()
  const [document, setDocument] = useState<DocumentFile[]>([])
  const { decisionTypeOptions } = useDecisionTypeOptions()
  const { isOpen, onClose, input } = useDisclosure<DecisionInput>({
    tag: "PutDecision",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDecision } = useCreateDecision()
  const { mutateAsync: updateDecision } = useUpdateDecision()
  async function onOk(output?: PutDecision) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.thesisProjectId) {
        message.error("Không tìm thấy mẫ đồ án")
        hideSpinner()
        return
      }
      const data = {
        issueDate: output.issueDate,
        description: output?.description,
        type: output.type,
      }
      if (input?.decisionId) {
        await updateDecision({
          data: {
            ...data,
            documentFile: {
              upsert: (output.documentFile || [])
                .filter((file) => !!file.id)
                .map((file) => ({
                  where: { id: file.id },
                  create: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                    decisionId: { connect: { id: input.decisionId } },
                  },
                  update: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                })),
              create: (output.documentFile || [])
                .filter((file) => !file.id)
                .map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              disconnect: document
                .filter((existing) => !output.documentFile?.some((f) => f.id === existing.id))
                .map((file) => ({ id: file.id })),
            },
          },
          where: {
            id: input?.decisionId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createDecision({
          data: {
            ...data,
            thesisProjectId: input.thesisProjectId,
            documentFile: {
              create: (output.documentFile || []).map((file) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
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

  const { data: decision } = useFindUniqueDecision(
    {
      where: { id: input?.decisionId },
      include: { documentFile: true },
    },
    { enabled: !!input?.decisionId }
  )

  useEffect(() => {
    if (decision) {
      form.setFieldsValue({
        ...decision,
        issueDate: decision.issueDate ? dayjs(decision.issueDate) : undefined,
      })
      setDocument(decision.documentFile)
    } else {
      form.setFieldsValue({
        active: true,
        documentFile: [],
      })
      setDocument([])
    }
  }, [decision, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.decisionId ? "Sửa quyết định" : "Thêm quyết định"}
    >
      <Col span={12}>
        <FormItem form={form} name="issueDate" label="Ngày ban hành" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="type" label="Loại quyết định">
          <Select
            placeholder="Chọn loại quyết định"
            options={decisionTypeOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="documentFile" label="Tài liệu đính kèm">
          <DocumentPaths
            form={form}
            data={document}
            relationId={input?.decisionId || ""}
            relationType="decisionId"
            titleForm="documentFile"
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

export default PutDecision
