import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import { QuestionType, type TestStructureRule } from '@workspace/db'
import {
    useCreateTestStructureRule,
    useFindManyKnowledgeBlock,
    useFindUniqueTestStructureRule,
    useUpdateTestStructureRule,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTestStructureRuleType = TestStructureRule
const PutTestStructureRule = () => {
    const [form] = Form.useForm<PutTestStructureRuleType>()
    const { options: questionTypeOptions } = useQuestionTypeOptions()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        examId: string
        subjectVersionId: string
    }>({
        tag: PutTestStructureRule.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTestStructureRule } = useCreateTestStructureRule()
    const { mutateAsync: updateTestStructureRule } = useUpdateTestStructureRule()
    async function onOk(output?: PutTestStructureRuleType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.examId) {
                message.error('Thiếu mã ngân hàng câu hỏi')
                hideSpinner()
                return
            }
            const data = {
                examId: input.examId,
                knowledgeBlockId: output.knowledgeBlockId,
                questionType: output.questionType,
                questionPoint: output.questionPoint,
                count: output.count,
            }
            if (input?.id) {
                await updateTestStructureRule({
                    data: data,
                    where: {
                        id: input.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTestStructureRule({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TestStructureRule'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueTestStructureRule(
        {
            where: { id: input?.id },
            include: { exam: { include: { questionBank: true } } },
        },
        {
            enabled: !!input?.id,
        }
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: {
            subjectVersionId: input?.subjectVersionId,
        },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({
                questionType: QuestionType.ESSAY,
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
            title={input?.id ? 'Chỉnh sửa cấu hình' : 'Thêm mới cấu hình'}
        >
            <Col span={12}>
                <FormItem form={form} name="questionType" label="Loại câu hỏi" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn loại câu hỏi"
                        options={questionTypeOptions}
                        defaultValue={QuestionType.ESSAY}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="knowledgeBlockId" label="Chương mục" required>
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
                <FormItem form={form} name="questionPoint" label="Điểm câu hỏi" required>
                    <InputNumber placeholder="Nhập Điểm" step={0.1} className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="count" label="Số lượng câu hỏi" required>
                    <InputNumber placeholder="Nhập số điểm câu hỏi" step={1} className="w-full" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTestStructureRule
