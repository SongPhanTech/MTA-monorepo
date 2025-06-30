import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyQuestion, SurveyQuestionType } from '@workspace/db'
import {
    useCreateSurveyQuestion,
    useFindManySurvey,
    useFindManySurveyQuestionType,
    useFindUniqueSurveyQuestion,
    useUpdateSurveyQuestion,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyQuestionType = SurveyQuestion
const PutSurveyQuestionModal = () => {
    const [form] = Form.useForm<SurveyQuestion>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyQuestionModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurveyQuestion()
    const { mutateAsync: update } = useUpdateSurveyQuestion()

    const { data: surveys = [] } = useFindManySurvey()
    const { data: surveyQuestionTypes = [] } = useFindManySurveyQuestionType()

    async function onOk(output?: SurveyQuestion) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
                        surveyId: output.surveyId,
                        surveyQuestionTypeId: output.surveyQuestionTypeId,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        code: output.code,
                        name: output.name,
                        surveyId: output.surveyId,
                        surveyQuestionTypeId: output.surveyQuestionTypeId,
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: surveyQuestion } = useFindUniqueSurveyQuestion({
        where: { id },
    })
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
            title={id ? 'Chỉnh sửa câu hỏi khảo sát' : 'Thêm mới câu hỏi khảo sát'}
            className="w-[30vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã câu hỏi khảo sát" required>
                    <Input placeholder="Nhập mã câu hỏi khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Câu hỏi khảo sát" required>
                    <Input placeholder="Nhập câu hỏi khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="surveyId" label="Khảo sát" required>
                    <Select
                        placeholder="Chọn chủ đề khảo sát"
                        options={surveys.map((i: Survey) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="surveyQuestionTypeId"
                    label="Loại câu hỏi khảo sát"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng khảo sát"
                        options={surveyQuestionTypes.map((i: SurveyQuestionType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyQuestionModal
