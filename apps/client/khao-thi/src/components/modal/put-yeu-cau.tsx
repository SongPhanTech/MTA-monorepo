import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { RequirementCriterionCatalog } from "@workspace/db"
import {
  useCountRequirementCriterionCatalog,
  useCreateRequirementCriterionCatalog,
  useFindUniqueRequirementCriterionCatalog,
  useUpdateRequirementCriterionCatalog,
} from "@workspace/db/hooks"
import type { InputRef } from "antd"
import { Button, Col, Form, Input, InputNumber, message } from "antd"
import { useEffect, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutRequirementCriterionCatalogType = RequirementCriterionCatalog
const PutRequirementCriterionCatalog = () => {
  const [form] = Form.useForm<PutRequirementCriterionCatalogType>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    criterionCatalogId: string
  }>({
    tag: "PutRequirementCriterionCatalog",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createRequirementCriterionCatalog } = useCreateRequirementCriterionCatalog()
  const { mutateAsync: updateRequirementCriterionCatalog } = useUpdateRequirementCriterionCatalog()
  const lastInputRef = useRef<InputRef | null>(null)

  async function onOk(output?: PutRequirementCriterionCatalogType) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        order: output.order,
        name: output.name.trim(),
        criterionCatalogId: input?.criterionCatalogId || "",
        description: output.description,
        questions: output.questions,
      }
      if (input?.id) {
        await updateRequirementCriterionCatalog({
          data,
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createRequirementCriterionCatalog({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["RequirementCriterionCatalog"],
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

  const { data: initialValue } = useFindUniqueRequirementCriterionCatalog(
    {
      where: { id: input?.id },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: count } = useCountRequirementCriterionCatalog(
    {
      where: {
        deletedAt: null,
        criterionCatalogId: input?.criterionCatalogId,
      },
    },
    { enabled: !!input?.criterionCatalogId }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({ ...initialValue })
    } else if (count !== undefined) {
      form.setFieldsValue({ order: count + 1 })
    }
  }, [initialValue, count])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa yêu cầu" : "Thêm mới yêu cầu"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="order" label="Thứ tự" required>
          <InputNumber
            min={0}
            type="number"
            className="w-full"
            step={1}
            placeholder="Nhập thứ tự"
            disabled
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên yêu cầu" required>
          <Input placeholder="Nhập tên yêu cầu" />
        </FormItem>
      </Col>
      <Col span={24}>
        <Form.Item label="Câu hỏi" required>
          <Form.List
            name="questions"
            rules={[
              {
                validator: async (_, questions) => {
                  if (!questions || questions.length === 0) {
                    return Promise.reject(new Error("Vui lòng thêm ít nhất 1 câu hỏi"))
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: "Nhập câu hỏi" }]}
                      className="flex-1 mb-0"
                    >
                      <Input
                        placeholder="Nhập mô tả"
                        className="w-full"
                        ref={index === fields.length - 1 ? lastInputRef : null}
                      />
                    </Form.Item>
                    <DeleteOutlined
                      onClick={() => {
                        remove(name)
                        form.validateFields(["questions"])
                      }}
                      className="text-red-500 cursor-pointer"
                    />
                  </div>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => {
                      add()
                      setTimeout(() => {
                        if (lastInputRef.current) {
                          lastInputRef.current.focus()
                        }
                      }, 0)
                    }}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm câu hỏi
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutRequirementCriterionCatalog
