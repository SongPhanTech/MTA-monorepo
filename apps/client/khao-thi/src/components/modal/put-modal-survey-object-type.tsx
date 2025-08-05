import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { SurveyObjectType } from '@workspace/db'
import {
    useCreateSurveyObjectType,
    useFindUniqueSurveyObjectType,
    useUpdateSurveyObjectType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyObjectType = SurveyObjectType
const PutSurveyObjectTypeModal = () => {
    const [form] = Form.useForm<PutSurveyObjectType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyObjectTypeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurveyObjectType()
    const { mutateAsync: update } = useUpdateSurveyObjectType()
    async function onOk(output?: PutSurveyObjectType) {
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: surveyObjectType } = useFindUniqueSurveyObjectType({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
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
            title={id ? 'Chỉnh sửa đối tượng khảo sát' : 'Thêm mới đối tượng khảo sát'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã đối tượng khảo sát" required>
                    <Input placeholder="Nhập mã đối tượng khảo sát" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên đối tượng khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng khảo sát" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyObjectTypeModal
