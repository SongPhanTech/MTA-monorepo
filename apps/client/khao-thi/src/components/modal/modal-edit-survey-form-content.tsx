import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import {
  cloneSurveyFormDisplayContent,
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  parseSurveyFormDisplayContent,
  type SurveyFormDisplayContent,
} from "@workspace/libs/survey-form-content"
import { useFindUniqueSurvey, useUpdateSurvey } from "@workspace/db/hooks"
import { Button, Checkbox, Col, Form, Input, Select, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FormValues = SurveyFormDisplayContent

const ModalEditSurveyFormContent = () => {
  const [form] = Form.useForm<FormValues>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string }>({
    tag: "ModalEditSurveyFormContent",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateSurvey } = useUpdateSurvey()

  const { data: survey } = useFindUniqueSurvey(
    {
      where: { id: input?.id },
      select: { id: true, name: true, formContent: true },
    },
    { enabled: !!input?.id && isOpen }
  )

  const defaultContent = cloneSurveyFormDisplayContent(DEFAULT_SURVEY_PRINT_FORM_CONTENT)

  useEffect(() => {
    if (!isOpen) return
    form.setFieldsValue(
      parseSurveyFormDisplayContent(survey?.formContent, defaultContent)
    )
  }, [isOpen, survey?.formContent, form])

  async function onOk(values: FormValues) {
    if (!input?.id) return
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
      }
      await updateSurvey({
        where: { id: input.id },
        data: {
          formContent: displayContent,
        },
      })
      message.success("Cập nhật nội dung form khảo sát thành công")
      onClose()
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={`Chỉnh sửa nội dung form${survey?.name ? `: ${survey.name}` : ""}`}
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
      <Form.Item name="notesAfterInfo" hidden valuePropName="checked">
        <Checkbox />
      </Form.Item>
      <Col span={24}>
        <Button
          onClick={() =>
            form.setFieldsValue(cloneSurveyFormDisplayContent(DEFAULT_SURVEY_PRINT_FORM_CONTENT))
          }
        >
          Khôi phục mặc định
        </Button>
      </Col>
    </PutFormModal>
  )
}

export default ModalEditSurveyFormContent
