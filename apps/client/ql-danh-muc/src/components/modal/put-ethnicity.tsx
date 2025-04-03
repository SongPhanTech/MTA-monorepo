import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Ethnicity } from "@workspace/db"
import {
    useCreateEthnicity,
    useFindUniqueEthnicity,
    useUpdateEthnicity,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEthnicityType = Ethnicity
const PutEthnicityModal = () => {
    const [form] = Form.useForm<Ethnicity>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutEthnicityModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createLevel } = useCreateEthnicity()
    const { mutateAsync: updateLevel } = useUpdateEthnicity()
    async function onOk(output?: Ethnicity) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateLevel({
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
                await createLevel({
                    data: {
                        code : output.code,
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TraningForm'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueEthnicity({
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
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa dân tộc'
                    : 'Thêm mới dân tộc'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã dân tộc"
                    required
                >
                    <Input placeholder='Nhập mã dân tộc' />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên dân tộc"
                    required
                >
                    <Input placeholder="Nhập dân tộc" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEthnicityModal
