import { queryClient } from "@api/index"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useSession } from "@workspace/auth/react"
import type { Evidence, EvidenceFile } from "@workspace/db"
import { useCreateEvidence, useFindUniqueEvidence, useUpdateEvidence } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutEvidenceType = Evidence & {
  evidenceFile?: EvidenceFile[]
}
const PutEvidence = () => {
  const { data: dataUser } = useSession()

  const [form] = Form.useForm<PutEvidenceType>()
  const [document, setDocument] = useState<EvidenceFile[]>([])
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    categoryId: string
  }>({
    tag: "PutEvidence",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createEvidence } = useCreateEvidence()
  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  async function onOk(output?: PutEvidenceType) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        code: output.code,
        name: output.name.trim(),
        categoryId: input?.categoryId || "",
        information: output.information,
        issuer: output.issuer,
        description: output.description || "",
      }

      if (input?.id) {
        await updateEvidence({
          data: {
            ...data,
            evidenceFile: {
              upsert: (output.evidenceFile || [])
                .filter((file) => !!file.id)
                .map((file) => ({
                  where: { id: file.id },
                  create: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                    evidenceId: input?.id,
                    userProfileId: dataUser?.sDM_NhanVienId || null,
                  },
                  update: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                })),
              create: (output.evidenceFile || [])
                .filter((file) => !file.id)
                .map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                  userProfileId: dataUser?.sDM_NhanVienId || null,
                })),
              delete: document
                .filter((existing) => !output.evidenceFile?.some((f) => f.id === existing.id))
                .map((file) => ({ id: file.id })),
            },
          },
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createEvidence({
          data: {
            ...data,
            evidenceFile: {
              create: (output.evidenceFile || []).map((file: EvidenceFile) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
                userProfileId: dataUser?.sDM_NhanVienId || null,
              })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["Evidence"],
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

  const { data: initialValue } = useFindUniqueEvidence(
    {
      where: { id: input?.id },
      include: {
        evidenceFile: true,
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  console.log("initialValue: ", initialValue)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({ ...initialValue })
      setDocument(initialValue.evidenceFile)
    } else {
      form.setFieldsValue({
        evidenceFile: [],
      })
      setDocument([])
    }
  }, [initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa minh chứng" : "Thêm mới minh chứng"}
      className="w-[700px] top-2"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã minh chứng" required>
          <Input placeholder="Nhập mã minh chứng" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên minh chứng" required>
          <Input placeholder="Nhập tên minh chứng" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="information" label="Số ngày tháng/tháng ban hành" required>
          <Input.TextArea placeholder="Nhập thông tin số ngày/tháng ban hành" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="issuer" label="Nơi ban hành" required>
          <Input placeholder="Nhập nơi ban hành" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="description" label="Ghi chú">
          <Input placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="evidenceFile" label="Tệp bằng chứng">
          <DocumentPaths
            form={form}
            data={document}
            relationId={input?.id ?? ""}
            relationType="evidenceId"
            titleForm="evidenceFile"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutEvidence
