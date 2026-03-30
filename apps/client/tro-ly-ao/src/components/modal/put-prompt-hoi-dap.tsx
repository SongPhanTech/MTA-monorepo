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

type PutPromptHoiDapFormType = {
  prompt: string
  description?: string
}

export type PutPromptHoiDapInput = {
  code: string
  name: string
}

export default function PutPromptHoiDapModal() {
  const [form] = Form.useForm<PutPromptHoiDapFormType>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<PutPromptHoiDapInput>({
    tag: "PutPromptHoiDapModal",
    onClose: form.resetFields,
  })

  const { data: promptData } = useFindFirstPrompt(
    {
      where: {
        code: input?.code,
      },
    },
    {
      enabled: !!input?.code,
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
    if (!input?.code) return
    const defaultPrompt = DEFAULT_PROMPTS[input.code]
    if (defaultPrompt) {
      form.setFieldsValue({
        prompt: defaultPrompt,
      })
      message.success("Đã thiết lập prompt mặc định")
    }
  }

  const onFinish = async (values: PutPromptHoiDapFormType) => {
    if (!input) return

    try {
      showSpinner()
      if (!promptData) {
        await createPrompt({
          data: {
            code: input.code,
            prompt: values.prompt,
            description: values.description,
            status: $Enums.DocumentStatus.APPROVE,
          },
        })
      } else {
        await updatePrompt({
          where: {
            code: input.code,
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
      title={`Chỉnh sửa Prompt - ${input?.name ?? ""}`}
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
