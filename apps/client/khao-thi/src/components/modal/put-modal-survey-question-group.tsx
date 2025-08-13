import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyQuestionGroup } from '@workspace/db'
import {
    useCreateSurveyQuestionGroup,
    useFindManySurvey,
    useFindUniqueSurveyQuestionGroup,
    useUpdateSurveyQuestionGroup,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyQuestionGroupType = SurveyQuestionGroup
const PutSurveyQuestionGroupModal = () => {
    const [form] = Form.useForm<SurveyQuestionGroup>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyQuestionGroupModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurveyQuestionGroup()
    const { mutateAsync: update } = useUpdateSurveyQuestionGroup()

    const { data: surveys = [] } = useFindManySurvey()

    async function onOk(output?: SurveyQuestionGroup) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
                        surveyTopicId: output.surveyTopicId,
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
                        surveyTopicId: output.surveyTopicId,
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
        } finally {
            hideSpinner()
        }
    }

    const { data: surveyQuestion } = useFindUniqueSurveyQuestionGroup(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )
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
            <Col span={24}>
                <FormItem form={form} name="name" label="Câu hỏi khảo sát" required>
                    <Input placeholder="Nhập câu hỏi khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="surveyTopicId" label="Chủ đề khảo sát" required>
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
                <FormItem form={form} name="description" label="Loại câu hỏi khảo sát" required />
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyQuestionGroupModal
