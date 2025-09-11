import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { useSurveyQuestionTypeOptions } from '@hooks/survey-question-type'
import type { SurveyQuestion, SurveyQuestionGroup } from '@workspace/db'
import {
    useCreateSurveyQuestion,
    useFindManySurveyQuestionGroup,
    useFindUniqueSurveyQuestion,
    useUpdateSurveyQuestion,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyQuestionType = SurveyQuestion
const PutSurveyQuestionModal = () => {
    const [form] = Form.useForm<SurveyQuestion>()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        surveyQuestionGroupId?: string
    }>({
        tag: 'PutSurveyQuestionModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
        useSurveyQuestionTypeOptions()
    const { mutateAsync: create } = useCreateSurveyQuestion()
    const { mutateAsync: update } = useUpdateSurveyQuestion()

    const { data: surveyQuestionGroupData = [] } = useFindManySurveyQuestionGroup()

    async function onOk(output?: SurveyQuestion) {
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await update({
                    data: {
                        name: output.name,
                        surveyQuestionGroupId: output.surveyQuestionGroupId,
                        type: output.type,
                        description: output.description,
                    },
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        name: output.name,
                        surveyQuestionGroupId: output.surveyQuestionGroupId,
                        type: output.type,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Level'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: surveyQuestion } = useFindUniqueSurveyQuestion(
        {
            where: { id: input?.id },
        },
        {
            enabled: !!input?.id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        console.log(input)
        if (input?.surveyQuestionGroupId) {
            form.setFieldsValue({ surveyQuestionGroupId: input?.surveyQuestionGroupId })
        }
    }, [input?.surveyQuestionGroupId])
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (surveyQuestion) {
            form.setFieldsValue(surveyQuestion)
        }
    }, [surveyQuestion])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa câu hỏi khảo sát' : 'Thêm mới câu hỏi khảo sát'}
            className="w-[700px]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Câu hỏi khảo sát" required>
                    <Input placeholder="Nhập câu hỏi khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="surveyQuestionGroupId"
                    label="Nhóm câu hỏi khảo sát"
                    required
                >
                    <Select
                        placeholder="Chọn nhóm câu hỏi khảo sát"
                        options={surveyQuestionGroupData.map((i: SurveyQuestionGroup) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="type" label="Loại câu hỏi khảo sát" required>
                    <Select
                        placeholder="Chọn loại câu hỏi khảo sát"
                        options={surveyQuestionTypeOptions}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyQuestionModal
