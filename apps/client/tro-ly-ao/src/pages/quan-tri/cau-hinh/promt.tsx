import { DownOutlined, EditOutlined, RightOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
import { useCreateManyPrompt, useFindFirstPrompt, useUpdateManyPrompt } from '@workspace/db/hooks'
import { Input as AntdInput, Button, Col, Form, Input, message, Row } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useTopics } from '@/hooks/useTopics'

type PromptFormType = {
    prompt: string
}

type PromptType = {
    [key: string]: PromptFormType
}

type PromptQuestionAnswerType = {
    topicId: string
    topicType: string
    label: string
}

const PromptQuestionAnswer = ({
    label,
    topicId,
    topicType,
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
            topicId: topicId,
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
                        topicId: topicId,
                        status: $Enums.DocumentStatus.APPROVE,
                    },
                })
            } else {
                await updatePrompt({
                    where: {
                        topicId: topicId,
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
        </Form>
    )
}

function Page() {
    const { topicOptions, topics, isSystemTopic } = useTopics()
    const [searchKeyword, setSearchKeyword] = useState('')
    const [isSystemCollapsed, setIsSystemCollapsed] = useState(true)
    const [isUserCollapsed, setIsUserCollapsed] = useState(false)

    const filteredList = topicOptions.filter((item) =>
        item.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )

    const sortedList = filteredList.sort((a, b) => {
        const aIsSystem = isSystemTopic(a.type)
        const bIsSystem = isSystemTopic(b.type)

        if (aIsSystem && !bIsSystem) return -1
        if (!aIsSystem && bIsSystem) return 1

        return a.name.localeCompare(b.name)
    })

    const systemTopics = sortedList.filter((item) => isSystemTopic(item.type))
    const userTopics = sortedList.filter((item) => !isSystemTopic(item.type))

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

            {systemTopics.length > 0 && (
                <div className="mb-6">
                    <div
                        className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20 select-none"
                        onClick={() => setIsSystemCollapsed(!isSystemCollapsed)}
                        title={isSystemCollapsed ? 'Nhấn để mở rộng' : 'Nhấn để thu gọn'}
                    >
                        {isSystemCollapsed ? (
                            <RightOutlined className="text-xs text-primary" />
                        ) : (
                            <DownOutlined className="text-xs text-primary" />
                        )}
                        <span className="text-lg font-semibold text-primary">Prompt chức năng</span>
                        <span
                            className={`px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium transition-opacity ${isSystemCollapsed ? 'opacity-70' : 'opacity-100'}`}
                        >
                            {systemTopics.length} prompt
                        </span>
                    </div>
                    {!isSystemCollapsed && (
                        <Row gutter={[16, 16]} className="bg-white rounded-md shadow-sm">
                            {systemTopics.map((item) => {
                                return (
                                    <Col span={24} key={item.id}>
                                        <PromptQuestionAnswer
                                            topicId={item.id}
                                            topicType={item.type}
                                            label={item.name}
                                        />
                                    </Col>
                                )
                            })}
                        </Row>
                    )}
                </div>
            )}

            {userTopics.length > 0 && (
                <div>
                    <div
                        className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 select-none"
                        onClick={() => setIsUserCollapsed(!isUserCollapsed)}
                        title={isUserCollapsed ? 'Nhấn để mở rộng' : 'Nhấn để thu gọn'}
                    >
                        {isUserCollapsed ? (
                            <RightOutlined className="text-xs text-gray-600" />
                        ) : (
                            <DownOutlined className="text-xs text-gray-600" />
                        )}
                        <span className="text-lg font-semibold text-gray-700">Prompt chủ đề</span>
                        <span
                            className={`px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium transition-opacity ${isUserCollapsed ? 'opacity-70' : 'opacity-100'}`}
                        >
                            {userTopics.length} prompt
                        </span>
                    </div>
                    {!isUserCollapsed && (
                        <Row gutter={[16, 16]} className="bg-white rounded-md shadow-sm">
                            {userTopics.map((item) => {
                                return (
                                    <Col span={24} key={item.id}>
                                        <PromptQuestionAnswer
                                            topicId={item.id}
                                            topicType={item.type}
                                            label={item.name}
                                        />
                                    </Col>
                                )
                            })}
                        </Row>
                    )}
                </div>
            )}

            {filteredList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Không tìm thấy prompt nào với từ khóa "{searchKeyword}"
                </div>
            )}
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
