import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { KnowledgeBlock } from '@workspace/db'
import {
    useCreateKnowledgeBlock,
    useFindUniqueKnowledgeBlock,
    useUpdateKnowledgeBlock,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutKnowledgeBlockType = KnowledgeBlock
const PutKnowledgeBlock = () => {
    const [form] = Form.useForm<PutKnowledgeBlockType>()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        subjectVersionId: string
    }>({
        tag: PutKnowledgeBlock.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createKnowledgeBlock } = useCreateKnowledgeBlock()
    const { mutateAsync: updateKnowledgeBlock } = useUpdateKnowledgeBlock()
    async function onOk(output?: PutKnowledgeBlockType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.subjectVersionId) {
                message.error('Thiếu mã phiên bản môn học')
                hideSpinner()
                return
            }
            const data = {
                code: output.code,
                name: output.name,
                description: output.description,
                subjectVersionId: input.subjectVersionId,
            }
            if (input?.id) {
                await updateKnowledgeBlock({
                    data,
                    where: {
                        id: input.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createKnowledgeBlock({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['SubjectVersion', 'KnowledgeBlock'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueKnowledgeBlock(
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
            title={input?.id ? 'Chỉnh sửa chương mục' : 'Thêm mới chương mục'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã chương">
                    <Input placeholder="Nhập mã chương" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên chương mục" required>
                    <Input placeholder="Nhập mã chương mục" />
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

export default PutKnowledgeBlock
