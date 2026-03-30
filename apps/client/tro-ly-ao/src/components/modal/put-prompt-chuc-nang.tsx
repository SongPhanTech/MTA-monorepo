import { ReloadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { DEFAULT_PROMPTS } from "@constants/default-prompts"
import useSpinner from "@hooks/spinner"
import { $Enums } from "@workspace/db"
import { useCreateManyPrompt, useFindFirstPrompt, useUpdateManyPrompt } from "@workspace/db/hooks"
import { Button, Col, Form, Input, message, Tooltip } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutPromptChucNangFormType = {
  prompt: string
  description?: string
}

export type PutPromptChucNangInput = {
  topicId?: string
  topicType: string
  topicName: string
}

export default function PutPromptChucNangModal() {
  const [form] = Form.useForm<PutPromptChucNangFormType>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<PutPromptChucNangInput>({
    tag: "PutPromptChucNangModal",
    onClose: form.resetFields,
  })

  const { data: promptData } = useFindFirstPrompt(
    {
      where: {
        code: input?.topicType,
      },
    },
    {
      enabled: !!input?.topicType,
    }
  )

  useEffect(() => {
    if (isOpen) {
      if (promptData) {
        form.setFieldsValue({
          prompt: promptData.prompt ?? "",
          description: (promptData as any).description ?? "",
        })
      } else {
        form.resetFields()
      }
    }
  }, [isOpen, promptData, form])

  const { mutateAsync: updatePrompt } = useUpdateManyPrompt()
  const { mutateAsync: createPrompt } = useCreateManyPrompt()

  const handleSetDefault = () => {
    if (!input?.topicType) return
    const defaultPrompt = DEFAULT_PROMPTS[input.topicType]
    if (defaultPrompt) {
      form.setFieldsValue({
        prompt: defaultPrompt,
      })
      message.success("Đã thiết lập prompt mặc định")
    }
  }

  const onFinish = async (values: PutPromptChucNangFormType) => {
    if (!input) return

    try {
      showSpinner()
      if (!promptData) {
        await createPrompt({
          data: {
            code: input.topicType,
            prompt: values.prompt,
            description: values.description,
            status: $Enums.DocumentStatus.APPROVE,
          },
        })
      } else {
        await updatePrompt({
          where: {
            code: input.topicType,
          },
          data: {
            prompt: values.prompt,
            description: values.description,
            status: $Enums.DocumentStatus.APPROVE,
          },
        })
      }
      message.success("Cập nhật prompt thành công")
      await queryClient.invalidateQueries({ queryKey: ["Prompt"] })
      onClose()
    } catch (error) {
      console.error("Error updating prompt:", error)
      message.error("Cập nhật prompt thất bại, vui lòng thử lại sau")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      onCancel={onClose}
      title={`Chỉnh sửa Prompt - ${input?.topicName ?? ""}`}
      form={form}
      onFinish={onFinish}
    >
      <Col span={24}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Prompt</span>
          <Tooltip title="Thiết lập mặc định">
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleSetDefault}
            />
          </Tooltip>
        </div>
        <FormItem
          name="prompt"
          form={form}
          rules={[{ required: true, message: "Vui lòng nhập nội dung prompt" }]}
        >
          <Input.TextArea
            placeholder="Nhập nội dung prompt"
            autoSize={{ minRows: 8, maxRows: 20 }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Mô tả" name="description" form={form} rules={[{ required: false }]}>
          <Input.TextArea
            placeholder="Nhập mô tả cho prompt"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
