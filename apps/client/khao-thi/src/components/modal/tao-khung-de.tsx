import { queryClient } from "@api/index"
import DocumentPaths from "@components/commons/documentPaths"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import type { DocumentFile, Prisma, Subject, SubjectVersion } from "@workspace/db/client"
import {
  useCreateExamFramework,
  useFindManySubjectVersion,
  useFindUniqueExamFramework,
  useUpdateExamFramework,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, InputNumber, message } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type CreateExamFrameworkPayloadType = Prisma.ExamFrameworkGetPayload<{
  include: {
    documentFiles: true
  }
}>
export type SubjectVersionItem = SubjectVersion
export type SubjectItem = Subject

export default function ModalTaoKhungDe() {
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<CreateExamFrameworkPayloadType>()
  const [donViFilter, setDonViFilter] = useState<string | null>(null)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    subjectVersionId?: string
  }>({
    tag: "ModalTaoKhungDe",
    onClose: form.resetFields,
  })
  const id = input?.id

  const { data: subjectVersions = [] } = useFindManySubjectVersion({
    where: {
      deletedAt: null,
      ...(trainingObjectTypeId && {
        trainingObjectTypeId,
      }),
    },
    orderBy: { createdAt: "desc" },
  })

  const filteredSubjectVersions = donViFilter
    ? subjectVersions.filter(
        (sv: SubjectVersionItem) => sv.managementOrganizationId === donViFilter
      )
    : subjectVersions

  const { mutateAsync: createExamFramework } = useCreateExamFramework({
    onError: () => message.error("Không tạo được khung đề"),
  })

  const { mutateAsync: updateExamFramework } = useUpdateExamFramework({
    onError: () => message.error("Không cập nhật được khung đề"),
  })

  const { data: examFrameworkData } = useFindUniqueExamFramework(
    {
      where: {
        id,
      },
      include: {
        documentFiles: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  async function onOk(output?: CreateExamFrameworkPayloadType) {
    if (!output) return
    try {
      const data = {
        code: output.code?.trim(),
        name: output.name.trim(),
        time: Number(output.time),
        subjectVersionId: output.subjectVersionId,
      }
      if (id) {
        await updateExamFramework({
          where: {
            id,
          },
          data: {
            ...data,
            documentFiles: {
              upsert: (output.documentFiles || [])
                .filter((file) => !!file.id)
                .map((file) => ({
                  where: {
                    id: file.id,
                  },
                  create: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                    examFramework: {
                      connect: {
                        id,
                      },
                    },
                  },
                  update: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                })),
              create: (output.documentFiles || [])
                .filter((file) => !file.id)
                .map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              disconnect: document
                .filter((existing) => !output.documentFiles?.some((f) => f.id === existing.id))
                .map((file) => ({ id: file.id })),
            },
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createExamFramework({
          data: {
            ...data,
            documentFiles: {
              create: (output.documentFiles || []).map((file) => ({
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

      queryClient.invalidateQueries({ queryKey: ["examFramework"] })

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  useEffect(() => {
    if (examFrameworkData && id) {
      form.setFieldsValue({
        name: examFrameworkData.name,
        time: examFrameworkData.time,
        subjectVersionId: examFrameworkData.subjectVersionId,
      })
      setDocument(examFrameworkData.documentFiles)
    }
  }, [examFrameworkData, id, form])

  useEffect(() => {
    if (!id && input?.subjectVersionId) {
      form.setFieldValue("subjectVersionId", input.subjectVersionId)
    }
  }, [id, input?.subjectVersionId, form])

  return (
    <PutFormModal
      title={id ? "Cập nhật khung đề" : "Tạo khung đề"}
      open={isOpen}
      form={form}
      onCancel={onClose}
      onFinish={onOk}
      maskClosable={true}
      className="w-[60vw] top-2"
    >
      <Col span={24}>
        <Form.Item
          label="Tên khung đề"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên khung đề" }]}
        >
          <Input placeholder="Tên khung đề" size="large" />
        </Form.Item>

        <Form.Item
          label="Thời gian thi (phút)"
          name="time"
          rules={[{ required: true, message: "Vui lòng nhập thời gian" }]}
        >
          <InputNumber
            min={1}
            size="large"
            style={{ width: "100%" }}
            placeholder="Thời gian thi"
            addonAfter="phút"
          />
        </Form.Item>

        <Form.Item
          label="Môn học"
          name="subjectVersionId"
          rules={[{ required: true, message: "Vui lòng chọn Môn học" }]}
        >
          <Select
            placeholder="Chọn Môn học"
            size="large"
            options={filteredSubjectVersions.map((sv) => ({
              label: `${sv.name}${sv.code ? ` - (${sv.code})` : ""}`,
              value: sv.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="Tài liệu đính kèm" name="documentFiles">
          <DocumentPaths
            form={form}
            data={document}
            relationId={id || ""}
            relationType="examFrameworkId"
            titleForm="documentFiles"
          />
        </Form.Item>
      </Col>
    </PutFormModal>
  )
}
