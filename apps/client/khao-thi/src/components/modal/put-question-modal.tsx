import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Select from '@components/commons/select'
import { useQuestionTypeOptions } from '@hooks/question-type'
import { renderWithMath } from '@hooks/renderWithMath'
import useSpinner from '@hooks/spinner'
import { type Question, QuestionType } from '@workspace/db'
import {
    useCreateQuestion,
    useFindManyDifficulty,
    useFindManyKnowledgeBlock,
    useFindUniqueQuestion,
    useUpdateQuestion,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message, Radio, Row } from 'antd'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutQuestionType = Question
const PutQuestionModal = () => {
    const [form] = Form.useForm<PutQuestionType>()
    const { options: questionTypeOptions } = useQuestionTypeOptions()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        questionBankId: string
        subjectVersionId: string
    }>({
        tag: PutQuestionModal.name,
        onClose: form.resetFields,
    })

    const typeQuestion = Form.useWatch('type', form)
    const content = Form.useWatch('content', form)
    const explanation = Form.useWatch('explanation', form)
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
                content: output.content,
                type: output.type,
                point: output.point,
                explanation: output.explanation,
                isAutoGraded: output.isAutoGraded,
                questionBankId: input?.questionBankId,
                knowledgeBlockId: output.knowledgeBlockId,
                difficultyId: output.difficultyId,
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
            include: { questionBank: true },
        },
        {
            enabled: !!input?.id,
        }
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { subjectVersionId: input?.subjectVersionId },
    })

    const { data: difficultyData } = useFindManyDifficulty({
        orderBy: { level: 'asc' },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({
                isAutoGraded: false,
                type: QuestionType.ESSAY, // TODO: clear after add many QuestionType
                point: 1,
            })
        }
    }, [initialValue])

    const fixedHtmlContent = useMemo(() => {
        return content?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    }, [content])

    const fixedHtmlExplanation = useMemo(() => {
        return explanation?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    }, [explanation])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}
            className="w-[80vw]"
        >
            <Col span={24}>
                <div className="flex">
                    <Col span={12}>
                        <Row gutter={[16, 0]}>
                            <Col span={12}>
                                <FormItem form={form} name="type" label="Loại câu hỏi" required>
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn loại câu hỏi"
                                        options={questionTypeOptions}
                                        defaultValue={QuestionType.ESSAY} // TODO: clear after add many QuestionType
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem form={form} name="knowledgeBlockId" label="Chương mục">
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn chương mục"
                                        options={knowledgeBlockData?.map(({ id, name }) => ({
                                            value: id,
                                            label: name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem form={form} name="difficultyId" label="Độ khó">
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn độ khó"
                                        options={difficultyData?.map(({ id, name }) => ({
                                            value: id,
                                            label: name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem form={form} name="point" label="Điểm" required>
                                    <InputNumber
                                        placeholder="Nhập điểm"
                                        defaultValue={1}
                                        step={0.1}
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            {typeQuestion !== QuestionType.ESSAY && (
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name={'isAutoGraded'}
                                        label="Tự động chấm điểm"
                                    >
                                        <Radio.Group buttonStyle="solid">
                                            <Radio value={true}>Có</Radio>
                                            <Radio value={false}>Không</Radio>
                                        </Radio.Group>
                                    </FormItem>
                                </Col>
                            )}
                            <Col span={24}>
                                <div className="border-t border-[#D1D5DB] x-auto my-2" />
                            </Col>
                            <Col span={24}>
                                <FormItem
                                    form={form}
                                    label="Câu hỏi"
                                    name={'content'}
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập câu hỏi',
                                        },
                                    ]}
                                >
                                    <RichTextEditor />
                                </FormItem>
                            </Col>
                            {/* Tự luận */}
                            <Col span={24}>
                                {typeQuestion === QuestionType.ESSAY && (
                                    <FormItem
                                        form={form}
                                        label="Giải thích đáp án"
                                        name={'explanation'}
                                    >
                                        <RichTextEditor />
                                    </FormItem>
                                )}
                            </Col>
                        </Row>
                    </Col>

                    <div className="border-r border-[#D1D5DB] h-auto mx-2" />

                    <Col span={12}>
                        <Row gutter={[16, 0]}>
                            <Col span={24}>
                                <div className="flex gap-4 flex-col">
                                    <div className="flex gap-2 flex-col">
                                        <p className="font-medium text-sm text-[#111827]">
                                            Câu hỏi
                                        </p>
                                        <div className="bg-[#FAFAFA] rounded-xl p-4">
                                            <div
                                                className="prose max-w-none text-sm text-gray-800"
                                                dangerouslySetInnerHTML={{
                                                    __html: fixedHtmlContent
                                                        ? renderWithMath(fixedHtmlContent)
                                                        : '<i>Chưa có nội dung</i>',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Tự luận */}
                                    {typeQuestion === QuestionType.ESSAY && (
                                        <div className="flex gap-2 flex-col">
                                            <p className="font-medium text-sm text-[#111827]">
                                                Giải thích đáp án
                                            </p>
                                            <div className="bg-white p-2 rounded-lg border border-[#D1D5DB] min-h-[164px]">
                                                <div
                                                    className="prose max-w-none text-sm text-gray-800"
                                                    dangerouslySetInnerHTML={{
                                                        __html: fixedHtmlExplanation
                                                            ? renderWithMath(fixedHtmlExplanation)
                                                            : '<i>Chưa có giải thích</i>',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </div>
            </Col>
        </PutFormModal>
    )
}

export default PutQuestionModal
