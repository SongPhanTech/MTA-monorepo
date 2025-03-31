import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
// import type { Level } from '@workspace/db'
import {
    useCreateLevel,
    useFindUniqueLevel,
    useUpdateLevel,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
// export type PutLevelFormType = Level
export type PutLevelFormType = {
    name: string
    description: string
} 

const PutLevelModal = () => {
    const [form] = Form.useForm<PutLevelFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutLevelModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createLevel } = useCreateLevel()
    const { mutateAsync: updateLevel } = useUpdateLevel()
    async function onOk(output?: PutLevelFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateLevel({
                    data: {
                        name: output.name,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                console.log( {
                    name: output.name,
                    description: output.description,
                },)
                await createLevel({
                    data: {
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

    const { data: level } = useFindUniqueLevel({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={
                id
                    ? 'Chỉnh sửa danh mục phân cấp'
                    : 'Thêm mới danh mục phân cấp'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên danh mục phân cấp"
                    required
                >
                    <Input />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutLevelModal
