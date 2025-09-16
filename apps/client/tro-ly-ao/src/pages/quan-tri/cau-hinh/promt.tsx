import { EditOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
import { useCreateManyPrompt, useFindFirstPrompt, useUpdateManyPrompt } from '@workspace/db/hooks'
import { Input as AntdInput, Button, Col, Form, Input, message, Row } from 'antd'
import { useEffect, useRef, useState } from 'react'

type PromptFormType = {
    prompt: string
}

type PromptType = {
    [key in $Enums.DocumentType]: PromptFormType
}

type PromptQuestionAnswerType = {
    type: $Enums.DocumentType
    label: string
}

const PromptQuestionAnswer = ({
    label,
    type,
    hideEditButton,
}: PromptQuestionAnswerType & { hideEditButton?: boolean }) => {
    const [form] = Form.useForm<PromptFormType>()
    const [isEditing, setIsEditing] = useState(false)
    const [initialPrompt, setInitialPrompt] = useState('')
    const [currentPrompt, setCurrentPrompt] = useState('')
    const previewRef = useRef<HTMLDivElement>(null)
    const [previewHeight, setPreviewHeight] = useState<number>(80)

    const { data: promptData } = useFindFirstPrompt({
        where: {
            type: type,
        },
    })

    useEffect(() => {
        if (promptData) {
            const promptText = promptData.prompt ?? ''
            form.setFieldsValue({ prompt: promptText })
            setInitialPrompt(promptText)
            setCurrentPrompt(promptText)
        }
    }, [promptData, form])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (previewRef.current) {
            const height = previewRef.current.getBoundingClientRect().height
            if (height > 0) setPreviewHeight(height)
        }
    }, [currentPrompt])

    const { mutateAsync: updatePrompt } = useUpdateManyPrompt()
    const { mutateAsync: createPrompt } = useCreateManyPrompt()

    const onFinish = async (values: PromptFormType) => {
        try {
            if (!promptData) {
                await createPrompt({
                    data: {
                        prompt: values.prompt,
                        type: type,
                        status: $Enums.DocumentStatus.APPROVE,
                    },
                })
            } else {
                await updatePrompt({
                    where: {
                        type: type,
                    },
                    data: {
                        prompt: values.prompt,
                        status: $Enums.DocumentStatus.APPROVE,
                    },
                })
            }
            message.success('Cập nhật thành công')
            setInitialPrompt(values.prompt)
            setCurrentPrompt(values.prompt)
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating prompt:', error)
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
                {!hideEditButton &&
                    (isEditing ? (
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
                    ))}
            </div>
            {isEditing ? (
                <FormItem name="prompt" form={form}>
                    <Input.TextArea
                        autoSize={{ minRows: 4, maxRows: 10 }}
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
                    {currentPrompt || <span className="text-gray-400">Chưa có nội dung</span>}
                </div>
            )}
            {/* Nút hành động đã được chuyển lên dòng tiêu đề khi isEditing */}
        </Form>
    )
}

function Page() {
    const [searchKeyword, setSearchKeyword] = useState('')
    const filteredList = DOCUMENT_TYPE.filter((item) =>
        item.label.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    return (
        <div>
            <span className="text-xl font-semibold text-gray-700">Thiết lập Prompt</span>
            <div className="my-3">
                <AntdInput.Search
                    placeholder="Tìm theo tên ..."
                    allowClear
                    onChange={(e) => setSearchKeyword(e.target.value)}
                />
            </div>
            <Row gutter={[16, 16]} className="bg-white rounded-md shadow-sm">
                {filteredList.map((item) => (
                    <Col span={24} key={item.value}>
                        <PromptQuestionAnswer type={item.value} label={item.label} />
                    </Col>
                ))}
            </Row>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
