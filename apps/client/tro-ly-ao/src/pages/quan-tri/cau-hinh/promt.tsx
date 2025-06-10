import FormItem from '@components/commons/form-item'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import type { $Enums } from '@workspace/db'
import {
    useCreateManyPrompt,
    useFindFirstPrompt,
    useFindUniquePrompt,
    useUpdateManyPrompt,
    useUpsertPrompt,
} from '@workspace/db/hooks'
import { Button, Col, Form, Input, InputNumber, message, Row } from 'antd'
import { useEffect } from 'react'

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

const PromptQuestionAnswer = ({ label, type }: PromptQuestionAnswerType) => {
    const [form] = Form.useForm<PromptFormType>()

    const { data: promptData } = useFindFirstPrompt({
        where: {
            type: type,
        },
    })

    useEffect(() => {
        if (promptData) {
            form.setFieldsValue({
                prompt: promptData.prompt ?? '',
            })
        }
    }, [promptData, form])

    const { mutateAsync: updatePrompt } = useUpdateManyPrompt()
    const { mutateAsync: createPrompt } = useCreateManyPrompt()

    const onFinish = async (values: PromptFormType) => {
        try {
            if (!promptData) {
                await createPrompt({
                    data: {
                        prompt: values.prompt,
                        type: type,
                    },
                })
            } else
                await updatePrompt({
                    where: {
                        type: type,
                    },
                    data: {
                        prompt: values.prompt,
                    },
                })
            message.success('Cập nhật thành công')
        } catch (error) {
            console.error('Error updating prompt:', error)
            message.error('Cập nhật thất bại, vui lòng thử lại sau')
        }
    }

    return (
        <Form layout="vertical" onFinish={onFinish} form={form}>
            <span className="text-lg font-semibold text-gray-700">{label}</span>
            <FormItem name="prompt" required form={form}>
                <Input.TextArea placeholder="Nhập mẫu prompt" rows={4} />
            </FormItem>
            <div className="flex justify-end">
                <Button type="primary" htmlType="submit">
                    Lưu
                </Button>
            </div>
        </Form>
    )
}

function Page() {
    return (
        <div>
            <span className="text-xl font-semibold text-gray-700">
                Thiết lập Prompt
            </span>
            <Row
                gutter={[16, 16]}
                className="mt-4 bg-white p-4 rounded-md shadow-sm"
            >
                {DOCUMENT_TYPE.map((item) => (
                    <Col span={12} key={item.value}>
                        <PromptQuestionAnswer
                            type={item.value}
                            label={item.label}
                        />
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
