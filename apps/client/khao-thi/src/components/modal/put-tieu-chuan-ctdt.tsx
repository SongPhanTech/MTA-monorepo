import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { StandardCatalog } from '@workspace/db'
import {
    useCreateStandardCatalog,
    useFindUniqueStandardCatalog,
    useUpdateStandardCatalog,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutStandardCatalogType = StandardCatalog
const PutStandardCatalog = () => {
    const [form] = Form.useForm<PutStandardCatalogType>()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; count: number }>({
        tag: PutStandardCatalog.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createStandardCatalog } = useCreateStandardCatalog()
    const { mutateAsync: updateStandardCatalog } = useUpdateStandardCatalog()
    async function onOk(output?: PutStandardCatalogType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                order: output.order,
                name: output.name,
                code: output.code,
            }
            if (input?.id) {
                await updateStandardCatalog({
                    data,
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createStandardCatalog({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['StandardCatalog'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueStandardCatalog(
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
            form.setFieldsValue({ ...initialValue })
        } else if (input?.count !== undefined) {
            form.setFieldsValue({ order: input?.count + 1 })
        }
    }, [initialValue, input?.count])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa tiêu chuẩn' : 'Thêm mới tiêu chuẩn'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="order" label="Thứ tự" required>
                    <InputNumber
                        type="number"
                        className="w-full"
                        step={1}
                        placeholder="Nhập thứ tự"
                        defaultValue={input?.count || 0 + 1}
                        disabled
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã tiêu chuẩn" required>
                    <Input placeholder="Nhập mã tiêu chuẩn" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên tiêu chuẩn" required>
                    <Input placeholder="Nhập tên tiêu chuẩn" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutStandardCatalog
