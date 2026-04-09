import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import DocumentPaths from "@components/commons/documentPaths"
import useSpinner from "@hooks/spinner"
import { type DocumentFile } from "@workspace/db"
import { useFindUniqueThesisProject, useUpdateLibrarySubmission } from "@workspace/db/hooks"
import { Checkbox, Col, Form, Input, message, Row, Typography } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title } = Typography

export type PutLibrarySubmissionFormType = {
  submissionDate?: Date
  isHardcopy?: boolean
  isSoftcopy?: boolean
  librarianNote?: string
  documentFile?: DocumentFile[]
}

const PutLibrarySubmission = () => {
  const [form] = Form.useForm<PutLibrarySubmissionFormType>()
  const [document, setDocument] = useState<DocumentFile[]>([])

  const { isOpen, onClose, input } = useDisclosure<{
    thesisProjectId: string
  }>({
    tag: "PutLibrarySubmission",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateLibrarySubmission } = useUpdateLibrarySubmission()

  const { data: thesisProjectData } = useFindUniqueThesisProject(
    {
      where: { id: input?.thesisProjectId },
      include: {
        librarySubmission: {
          include: {
            documentFile: true,
          },
        },
      },
    },
    { enabled: !!input?.thesisProjectId }
  )

  const formItemLayout = {
    labelCol: { flex: "0 0 150px" },
    wrapperCol: { flex: "1" },
  }

  useEffect(() => {
    if (thesisProjectData) {
      form.setFieldsValue({
        submissionDate: thesisProjectData?.librarySubmission?.submissionDate
          ? (dayjs(thesisProjectData.librarySubmission.submissionDate) as any)
          : undefined,
        isHardcopy: thesisProjectData?.librarySubmission?.isHardcopy,
        isSoftcopy: thesisProjectData?.librarySubmission?.isSoftcopy,
        librarianNote: thesisProjectData?.librarySubmission?.librarianNote ?? "",
        documentFile: thesisProjectData?.librarySubmission?.documentFile ?? [],
      })
      setDocument(thesisProjectData?.librarySubmission?.documentFile ?? [])
    } else {
      setDocument([])
    }
  }, [thesisProjectData, form])

  const onOk = async () => {
    const data = form.getFieldsValue()
    const thesisLibraryId = thesisProjectData?.librarySubmission?.id

    if (!thesisLibraryId) {
      message.error("Không tìm thấy thông tin luận văn thư viện")
      return
    }

    try {
      showSpinner()

      const filesInForm = (data as any).documentFile || []
      const initialFiles = document

      await updateLibrarySubmission({
        where: { id: thesisLibraryId },
        data: {
          submissionDate: data.submissionDate,
          isHardcopy: data.isHardcopy,
          isSoftcopy: data.isSoftcopy,
          librarianNote: data.librarianNote,
          documentFile: {
            upsert: filesInForm
              .filter((file: DocumentFile) => !!file.id)
              .map((file: DocumentFile) => ({
                where: { id: file.id },
                create: {
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                },
                update: {
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                },
              })),
            create: filesInForm
              .filter((file: DocumentFile) => !file.id)
              .map((file: DocumentFile) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            disconnect: initialFiles
              .filter(
                (initialFile) =>
                  !filesInForm.some((finalFile: DocumentFile) => finalFile.id === initialFile.id)
              )
              .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
          },
        },
      })

      message.success("Cập nhật thông tin nộp luận văn thành công")
      onClose()
    } catch (error: any) {
      message.error(error?.message || "Đã xảy ra lỗi khi lưu thông tin")
    } finally {
      hideSpinner()
    }
  }

  const { TextArea } = Input

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onOk={onOk}
      onCancel={onClose}
      maskClosable={true}
      title="Thông tin nộp luận văn thư viện"
      layout="horizontal"
      width={700}
    >
      <Row gutter={32} className="w-full mt-4">
        <Col span={24}>
          <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
            Thông tin nộp luận văn thư viện
          </Title>

          <Row gutter={16}>
            <Col span={10}>
              <FormItem
                form={form}
                name="submissionDate"
                label="Ngày nộp"
                className="mb-5"
                labelAlign="left"
                {...formItemLayout}
              >
                <DatePicker
                  placeholder="Chọn ngày nộp"
                  format={{
                    format: "DD/MM/YYYY",
                    type: "mask",
                  }}
                  className="w-full"
                  onChange={(value) => {
                    form.setFieldsValue({ submissionDate: value as any })
                  }}
                />
              </FormItem>
            </Col>

            <Col span={7}>
              <FormItem
                form={form}
                name="isHardcopy"
                label="Nộp bản cứng"
                className="mb-5"
                labelAlign="left"
                valuePropName="checked"
              >
                <Checkbox
                  onChange={(e) => {
                    form.setFieldsValue({ isHardcopy: e.target.checked })
                  }}
                />
              </FormItem>
            </Col>

            <Col span={7}>
              <FormItem
                form={form}
                name="isSoftcopy"
                label="Nộp bản mềm"
                className="mb-5"
                labelAlign="left"
                valuePropName="checked"
              >
                <Checkbox
                  onChange={(e) => {
                    form.setFieldsValue({ isSoftcopy: e.target.checked })
                  }}
                />
              </FormItem>
            </Col>
          </Row>

          <FormItem
            form={form}
            name="librarianNote"
            label="Ghi chú"
            className="mb-5"
            labelAlign="left"
            {...formItemLayout}
          >
            <TextArea
              placeholder="Nhập ghi chú"
              rows={4}
              className="w-full"
              onChange={(e) => {
                form.setFieldsValue({ librarianNote: e.target.value })
              }}
            />
          </FormItem>

          <FormItem
            form={form}
            name="documentFile"
            label="File minh chứng"
            className="mb-5"
            labelAlign="left"
            {...formItemLayout}
          >
            <DocumentPaths
              form={form}
              data={document}
              relationId={thesisProjectData?.librarySubmission?.id ?? ""}
              relationType="librarySubmissionId"
              titleForm="documentFile"
            />
          </FormItem>
        </Col>
      </Row>
    </PutFormModal>
  )
}

export default PutLibrarySubmission
