import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ExamSession } from '@workspace/db'
import {
    useCreateExamSession,
    useFindUniqueExamSession,
    useUpdateExamSession,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutFaxType = ExamSession
const PutFax = () => {
    const [form] = Form.useForm<PutFaxType>()
    const { isOpen, onClose, input } = useDisclosure<{ examId: string; id: string }>({
        tag: PutFax.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createExamSession } = useCreateExamSession()
    const { mutateAsync: updateExamSession } = useUpdateExamSession()
    async function onOk(output?: PutFaxType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.examId) {
                message.error('Thiếu mã kỳ thi')
                hideSpinner()
                return
            }
            const data = {
                examId: input?.examId,
                fax: output?.fax,
            }
            if (input?.id) {
                await updateExamSession({
                    data: data,
                    where: {
                        id: input.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createExamSession({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['ExamSession'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueExamSession(
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
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa fax' : 'Thêm mới fax'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="fax" label="Mã fax" required>
                    <Input placeholder="Nhập mã fax" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutFax
