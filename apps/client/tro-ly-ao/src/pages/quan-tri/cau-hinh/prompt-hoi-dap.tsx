import { EditOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Form, Input, message, Row } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
    useGetPromptByCodePromptsCodeGet,
    useUpdatePromptByCodePromptsCodePut,
} from '@/lib/api/chat/chatComponents'
import { getDefaultPromptTemplate } from '@lib/prompt-template'

type PromptFormType = { prompt: string }

const PromptEditor = ({ code, label }: { code: string; label: string }) => {
    const [form] = Form.useForm<PromptFormType>()
    const [isEditing, setIsEditing] = useState(false)
    const [initialPrompt, setInitialPrompt] = useState('')
    const [currentPrompt, setCurrentPrompt] = useState('')
    const previewRef = useRef<HTMLDivElement>(null)
    const [previewHeight, setPreviewHeight] = useState<number>(80)

    const {
        data: promptData,
        isLoading,
        refetch,
    } = useGetPromptByCodePromptsCodeGet<any>({ pathParams: { code } }) as any

    useEffect(() => {
        const promptText = promptData?.prompt ?? getDefaultPromptTemplate('Hỏi đáp')
        form.setFieldsValue({ prompt: promptText })
        setInitialPrompt(promptText)
        setCurrentPrompt(promptText)
    }, [promptData, form])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>we only need to run when currentPrompt changes for preview height</reason>
    useEffect(() => {
        if (previewRef.current) {
            const height = previewRef.current.getBoundingClientRect().height
            if (height > 0) setPreviewHeight(height)
        }
    }, [currentPrompt])

    const updateMutation = useUpdatePromptByCodePromptsCodePut()

    const onFinish = async (values: PromptFormType) => {
        try {
            await updateMutation.mutateAsync({
                pathParams: { code },
                body: { prompt: values.prompt },
            } as any)
            message.success('Cập nhật thành công')
            setInitialPrompt(values.prompt)
            setCurrentPrompt(values.prompt)
            setIsEditing(false)
            refetch && (await refetch())
        } catch (error) {
            console.error('Error updating prompt by code:', error)
            message.error('Cập nhật thất bại, vui lòng thử lại sau')
        }
    }

    const handleCancel = () => {
        form.setFieldsValue({ prompt: initialPrompt })
        setCurrentPrompt(initialPrompt)
        setIsEditing(false)
    }

    return (
        <Form layout="vertical" onFinish={onFinish} form={form}>
            <div className="flex items-center justify-between mb-0">
                <p className="text-lg font-semibold text-primary mb-0">{label}</p>
                {isEditing ? (
                    <div className="flex gap-1">
                        <Button size="small" onClick={handleCancel}>
                            Huỷ
                        </Button>
                        <Button size="small" type="primary" htmlType="submit">
                            Lưu
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            if (previewRef.current) {
                                const height = previewRef.current.getBoundingClientRect().height
                                if (height > 0) setPreviewHeight(height)
                            }
                            setIsEditing(true)
                        }}
                    >
                        Sửa
                    </Button>
                )}
            </div>

            {isEditing ? (
                <FormItem name="prompt" form={form}>
                    <Input.TextArea
                        autoSize={{ minRows: 4, maxRows: 12 }}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        value={currentPrompt}
                        style={{ minHeight: previewHeight }}
                    />
                </FormItem>
            ) : (
                <div
                    ref={previewRef}
                    className="border border-primary rounded-md p-2 bg-gray-50 whitespace-pre-line"
                >
                    {isLoading ? (
                        <span className="text-gray-500">Đang tải...</span>
                    ) : (
                        (currentPrompt && <>{currentPrompt}</>) || (
                            <span className="text-gray-400">Chưa có nội dung</span>
                        )
                    )}
                </div>
            )}
        </Form>
    )
}

function Page() {
    return (
        <div>
            <span className="text-xl font-semibold text-gray-700">Prompt Hỏi đáp (No-RAG)</span>
            <div className="my-3" />
            <Row gutter={[16, 16]} className="bg-white rounded-md shadow-sm">
                <Col span={24}>
                    <PromptEditor code="prompt-hoi-dap" label="Prompt Hỏi đáp" />
                </Col>
            </Row>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Quản trị' }, { title: 'Cấu hình Prompt' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
