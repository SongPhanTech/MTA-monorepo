import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { EvidenceCategory } from '@workspace/db'
import {
    useCreateEvidenceCategory,
    useFindUniqueEvidenceCategory,
    useUpdateEvidenceCategory,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvidenceCategoryType = EvidenceCategory
const PutEvidenceCategory = () => {
    const [form] = Form.useForm<PutEvidenceCategoryType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvidenceCategory',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvidenceCategory } = useCreateEvidenceCategory()
    const { mutateAsync: updateEvidenceCategory } = useUpdateEvidenceCategory()
    async function onOk(output?: PutEvidenceCategoryType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name.trim(),
                code: output.code,
            }
            if (id) {
                await updateEvidenceCategory({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createEvidenceCategory({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvidenceCategory'],
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

    const { data: initialValue } = useFindUniqueEvidenceCategory(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({ ...initialValue })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa nhóm minh chứng' : 'Thêm mới nhóm minh chứng'}
            className="w-[550px]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã nhóm minh chứng" required>
                    <Input placeholder="Nhập mã nhóm minh chứng" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên nhóm minh chứng" required>
                    <Input placeholder="Nhập tên nhóm minh chứng" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvidenceCategory
