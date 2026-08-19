import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import {
  cloneSurveyFormDisplayContent,
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  LECTURER_SURVEY_PRINT_FORM_CONTENT,
  parseSurveyFormDisplayContent,
  type SurveyFormDisplayContent,
} from "@workspace/libs/survey-form-content"
import { useFindManySurvey, useFindUniqueSurvey, useUpdateManySurvey, useUpdateSurvey } from "@workspace/db/hooks"
import { Button, Checkbox, Col, Form, Input, Select, message } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FormValues = SurveyFormDisplayContent

type ModalInput = {
  id?: string
  clusterSurveyId?: string
  name?: string
}

const ModalEditSurveyFormContent = () => {
  const [form] = Form.useForm<FormValues>()
  const { isOpen, onClose, input } = useDisclosure<ModalInput>({
    tag: "ModalEditSurveyFormContent",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateSurvey } = useUpdateSurvey()
  const { mutateAsync: updateManySurvey } = useUpdateManySurvey()

  const isClusterMode = !!input?.clusterSurveyId

  const { data: survey } = useFindUniqueSurvey(
    {
      where: { id: input?.id },
      select: { id: true, name: true, formContent: true, lectureId: true },
    },
    { enabled: !!input?.id && !isClusterMode && isOpen }
  )

  const { data: clusterSurveys = [] } = useFindManySurvey(
    {
      where: {
        clusterSurveyId: input?.clusterSurveyId,
        deletedAt: null,
      },
      select: { id: true, formContent: true, lectureId: true },
      take: 1,
      orderBy: { createdAt: "asc" },
    },
    { enabled: isClusterMode && isOpen }
  )

  const sourceSurvey = isClusterMode ? clusterSurveys[0] : survey
  const isLecturerSurvey = isClusterMode || !!sourceSurvey?.lectureId

  const defaultContent = useMemo(
    () =>
      cloneSurveyFormDisplayContent(
        isLecturerSurvey
          ? LECTURER_SURVEY_PRINT_FORM_CONTENT
          : DEFAULT_SURVEY_PRINT_FORM_CONTENT
      ),
    [isLecturerSurvey]
  )

  useEffect(() => {
    if (!isOpen) return
    form.setFieldsValue(
      parseSurveyFormDisplayContent(sourceSurvey?.formContent, defaultContent)
    )
  }, [isOpen, sourceSurvey?.formContent, defaultContent, form])

  async function onOk(values: FormValues) {
    if (!input?.id && !input?.clusterSurveyId) return
    try {
      showSpinner()
      const displayContent: SurveyFormDisplayContent = {
        notes: (values.notes || []).map((note) => note.trim()).filter(Boolean),
        infoTitle: values.infoTitle?.trim() || undefined,
        contentTitle: values.contentTitle?.trim() || undefined,
        ...(values.notesAfterInfo ? { notesAfterInfo: true } : {}),
        infoFields: (values.infoFields || [])
          .filter((field) => field?.label?.trim())
          .map((field) => ({
            label: field.label.trim(),
            ...(field.fullWidth || field.span === 24 ? { fullWidth: true } : {}),
            ...(field.span ? { span: field.span } : {}),
            ...(field.bindKey ? { bindKey: field.bindKey } : {}),
          })),
        footerNotes: (values.footerNotes || []).map((note) => note.trim()).filter(Boolean),
      }

      if (isClusterMode && input.clusterSurveyId) {
        await updateManySurvey({
          where: {
            clusterSurveyId: input.clusterSurveyId,
            deletedAt: null,
          },
          data: {
            formContent: displayContent,
          },
        })
      } else if (input.id) {
        await updateSurvey({
          where: { id: input.id },
          data: {
            formContent: displayContent,
          },
        })
      }

      message.success("Cập nhật nội dung form khảo sát thành công")
      onClose()
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const modalTitle = isClusterMode
    ? `Chỉnh sửa nội dung form${input?.name ? `: ${input.name}` : ""}`
    : `Chỉnh sửa nội dung form${survey?.name ? `: ${survey.name}` : ""}`

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={modalTitle}
      className="w-[720px] top-4"
      okText="Lưu"
    >
      <Col span={24}>
        <Form.Item label="Đoạn giới thiệu" required>
          <Form.List
            name="notes"
            rules={[
              {
                validator: async (_, notes) => {
                  if (!notes?.some((note: string) => note?.trim())) {
                    return Promise.reject(new Error("Nhập ít nhất một đoạn giới thiệu"))
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="mb-2 flex items-start gap-2">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: "Nhập nội dung" }]}
                      className="mb-0 flex-1"
                    >
                      <Input.TextArea rows={3} placeholder="Nhập đoạn giới thiệu" />
                    </Form.Item>
                    <DeleteOutlined
                      className="mt-2 cursor-pointer text-red-500"
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add("")}>
                  Thêm đoạn
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Form.Item>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="infoTitle" label="Tiêu đề phần thông tin chung">
          <Input placeholder="VD: I. THÔNG TIN CHUNG" />
        </FormItem>
      </Col>
      <Col span={24}>
        <Form.Item label="Các trường thông tin">
          <Form.List name="infoFields">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="mb-2 flex items-start gap-2">
                    <Form.Item
                      {...restField}
                      name={[name, "label"]}
                      rules={[{ required: true, message: "Nhập nhãn" }]}
                      className="mb-0 flex-1"
                    >
                      <Input placeholder="Nhãn trường, VD: Chuyên ngành: " />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "span"]}
                      className="mb-0 w-[120px]"
                      initialValue={12}
                    >
                      <Select
                        options={[
                          { value: 6, label: "1/4 dòng" },
                          { value: 12, label: "Nửa dòng" },
                          { value: 24, label: "Cả dòng" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "fullWidth"]}
                      valuePropName="checked"
                      className="mb-0 hidden"
                    >
                      <Checkbox />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "bindKey"]} hidden>
                      <Input />
                    </Form.Item>
                    <DeleteOutlined
                      className="mt-2 cursor-pointer text-red-500"
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ label: "", span: 12 })}
                >
                  Thêm trường
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="contentTitle" label="Tiêu đề phần nội dung đánh giá">
          <Input placeholder="VD: II. NỘI DUNG ĐÁNH GIÁ" />
        </FormItem>
      </Col>
      <Col span={24}>
        <Form.Item label="Nội dung footer (lời cảm ơn)">
          <Form.List name="footerNotes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="mb-2 flex items-start gap-2">
                    <Form.Item {...restField} name={name} className="mb-0 flex-1">
                      <Input.TextArea rows={2} placeholder="Nhập lời cảm ơn" />
                    </Form.Item>
                    <DeleteOutlined
                      className="mt-2 cursor-pointer text-red-500"
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add("")}>
                  Thêm đoạn footer
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Col>
      <Form.Item name="notesAfterInfo" hidden valuePropName="checked">
        <Checkbox />
      </Form.Item>
      <Col span={24}>
        <Button
          onClick={() =>
            form.setFieldsValue(
              cloneSurveyFormDisplayContent(
                isLecturerSurvey
                  ? LECTURER_SURVEY_PRINT_FORM_CONTENT
                  : DEFAULT_SURVEY_PRINT_FORM_CONTENT
              )
            )
          }
        >
          Khôi phục mặc định
        </Button>
      </Col>
    </PutFormModal>
  )
}

export default ModalEditSurveyFormContent
