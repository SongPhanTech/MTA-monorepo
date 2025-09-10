import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Difficulty } from '@workspace/db'
import {
    useCreateDifficulty,
    useFindUniqueDifficulty,
    useUpdateDifficulty,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutDifficultyType = Difficulty
const PutDifficulty = () => {
    const [form] = Form.useForm<PutDifficultyType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutDifficulty',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createDifficulty } = useCreateDifficulty()
    const { mutateAsync: updateDifficulty } = useUpdateDifficulty()
    async function onOk(output?: PutDifficultyType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                code: output.code,
                name: output.name,
                level: output.level,
                description: output.description,
            }
            if (id) {
                await updateDifficulty({
                    data: data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createDifficulty({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Difficulty'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueDifficulty(
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
            title={id ? 'Chỉnh sửa độ khó' : 'Thêm mới độ khó'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã độ khó">
                    <Input placeholder="Nhập mã độ khó" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên độ khó" required>
                    <Input placeholder="Nhập tên độ khó" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="level" label="Mức độ khó" required>
                    <InputNumber type="number" className="w-full" step={1} />
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

export default PutDifficulty
