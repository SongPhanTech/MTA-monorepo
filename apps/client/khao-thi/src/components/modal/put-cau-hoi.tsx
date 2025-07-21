import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import { type Question, QuestionType } from '@workspace/db'
import { useCreateQuestion, useFindUniqueQuestion, useUpdateQuestion } from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutQuestionType = Question
const PutQuestion = () => {
    const [form] = Form.useForm<PutQuestionType>()
    const { options: questionTypeOptions } = useQuestionTypeOptions()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; questionBankId: string }>({
        tag: PutQuestion.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createQuestion } = useCreateQuestion()
    const { mutateAsync: updateQuestion } = useUpdateQuestion()
    async function onOk(output?: PutQuestionType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.questionBankId) {
                message.error('Thiếu mã ngân hàng câu hỏi')
                hideSpinner()
                return
            }
            const data = {
                code: output.code,
                content: output.content,
                type: output.type,
                point: output.point,
                explanation: output.explanation,
                isAutoGraded: output.isAutoGraded,
                questionBankId: input?.questionBankId,
            }
            if (input?.id) {
                await updateQuestion({
                    data: data,
                    where: {
                        id: input.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createQuestion({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Question'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: initialValue } = useFindUniqueQuestion(
        {
            where: { id: input?.id },
        },
        {
            enabled: !!input?.id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({
                isAutoGraded: false,
                type: QuestionType.ESSAY,
                point: 1,
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa câu hỏi' : 'Thêm mới câu hỏi'}
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã câu hỏi">
                    <Input placeholder="Nhập mã câu hỏi" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="type" label="Loại câu hỏi" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn loại câu hỏi"
                        options={questionTypeOptions}
                        defaultValue={QuestionType.ESSAY}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="point" label="Điểm" required>
                    <InputNumber
                        placeholder="Nhập Điểm"
                        defaultValue={1}
                        step={0.1}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'isAutoGraded'} label="Tự động chấm điểm" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="content" label="Nội dung câu hỏi" required>
                    <Input.TextArea placeholder="Nhập nội dung câu hỏi" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="explanation" label="Giải thích đáp án">
                    <Input.TextArea placeholder="Nhập giải thích đáp án" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutQuestion
