import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { SurveyQuestionType } from '@workspace/db'
import {
    useCreateSurveyQuestionType,
    useFindUniqueSurveyQuestionType,
    useUpdateSurveyQuestionType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyTopicType = SurveyQuestionType
const PutSurveyQuestionTypeModal = () => {
    const [form] = Form.useForm<PutSurveyTopicType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyQuestionTypeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurveyQuestionType()
    const { mutateAsync: update } = useUpdateSurveyQuestionType()
    async function onOk(output?: PutSurveyTopicType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: surveyObjectType } = useFindUniqueSurveyQuestionType({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (surveyObjectType) {
            form.setFieldsValue(surveyObjectType)
        }
    }, [surveyObjectType])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa loại câu hỏi khảo sát'
                    : 'Thêm mới loại câu hỏi khảo sát'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã loại câu hỏi khảo sát"
                    required
                >
                    <Input placeholder="Nhập mã loại câu hỏi khảo sát" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên loại câu hỏi khảo sát"
                    required
                >
                    <Input placeholder="Nhập tên loại câu hỏi khảo sát" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyQuestionTypeModal
