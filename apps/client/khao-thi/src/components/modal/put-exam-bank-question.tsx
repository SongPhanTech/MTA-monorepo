import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { ExamBankQuestion } from '@workspace/db'
import {
    useCreateExamBankQuestion,
    useFindManyQuestion,
    useFindUniqueExamBankQuestion,
    useUpdateExamBankQuestion,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutExamBankQuestionType = ExamBankQuestion
const PutExamBankQuestion = () => {
    const [form] = Form.useForm<PutExamBankQuestionType>()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        examBankId: string
        questionBankId: string
    }>({
        tag: PutExamBankQuestion.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createExamBankQuestion } = useCreateExamBankQuestion()
    const { mutateAsync: updateExamBankQuestion } = useUpdateExamBankQuestion()
    async function onOk(output?: PutExamBankQuestionType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.examBankId) {
                message.error('Thiếu mã ngân hàng câu hỏi')
                hideSpinner()
                return
            }
            const data = {
                examBankId: input.examBankId,
                questionId: output.questionId,
                order: output.order,
            }
            if (input?.id) {
                await updateExamBankQuestion({
                    data: data,
                    where: {
                        id: input.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createExamBankQuestion({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['ExamBankQuestion'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueExamBankQuestion(
        {
            where: { id: input?.id },
            include: {
                examBank: {
                    include: {
                        exam: true,
                    },
                },
            },
        },
        {
            enabled: !!input?.id,
        }
    )

    const { data: questionData } = useFindManyQuestion({
        where: {
            questionBankId: input?.questionBankId,
        },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
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
            title={input?.id ? 'Chỉnh sửa câu hỏi trong đề thi' : 'Thêm mới câu hỏi trong đề thi'}
        >
            <Col span={12}>
                <FormItem form={form} name="questionId" label="Câu hỏi" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn câu hỏi"
                        options={questionData?.map(({ id, content }) => ({
                            value: id,
                            label: (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: content
                                            ? renderWithMath(content)
                                            : '<i>Chưa có nội dung</i>',
                                    }}
                                />
                            ),
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="order" label="Thứ tự câu hỏi trong đề thi" required>
                    <InputNumber
                        placeholder="Nhập thứ tự câu hỏi trong đề thi"
                        step={1}
                        className="w-full"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutExamBankQuestion
