import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useCreateTrainingBlock,
    useFindUniqueTrainingBlock,
    useUpdateTrainingBlock,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Select, Switch } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import type { TrainingBlock } from '@workspace/db'
import dayjs from 'dayjs'
export type PutTrainingBlock = TrainingBlock
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
dayjs.locale('vi')
const PutTrainingBlock = () => {
    const [form] = Form.useForm<PutTrainingBlock>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingBlock.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const [active, setActive] = useState(true)

    const { data: trainingBlock } = useFindUniqueTrainingBlock(
        { where: { id } },
        { enabled: !!id }
    )

    useEffect(() => {
        if (trainingBlock) {
            form.setFieldsValue({
                ...trainingBlock,
            })
            setActive(trainingBlock.active)
        }
    }, [trainingBlock, form])

    const { mutateAsync: createTrainingBlock } = useCreateTrainingBlock()
    const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()
    async function onOk(output?: PutTrainingBlock) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                code: output.code,
                name: output.name,
                priority: output.priority,
                active: output.active,
            }

            if (id) {
                await updateTrainingBlock({
                    data: payload,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingBlock({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlock'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }

        hideSpinner()
    }

    const handleChange = (checked: boolean) => {
        setActive(checked)
        form.setFieldsValue({ active: checked })
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa khối kiến thức CTDT'
                    : 'Thêm mới khối kiến thức CTDT'
            }
            className="min-w-[400px] w-[500px]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập mã khối kiến thức" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập tên khối kiến thức" />
                </FormItem>
            </Col>
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalCredits"
                    label="Tổng tín chỉ"
                >
                    <Input placeholder="Tổng tín chỉ" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalRequiredCredits"
                    label="Tổng tín chỉ bắt buộc"
                >
                    <Input placeholder="Tổng tín chỉ bắt buộc" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="electiveCredits"
                    label="Số tín chỉ tự chọn"
                >
                    <Input placeholder="Số tín chỉ tự chọn" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="specializedCredits"
                    label="Số tín chỉ chuyên ngành"
                >
                    <Input placeholder="Số tín chỉ chuyên ngành" />
                </FormItem>
            </Col> */}
            <Col span={24}>
                <FormItem form={form} name="priority" label="Thứ tự" required>
                    <InputNumber placeholder="Thứ tự" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12} className="flex items-center">
                <FormItem
                    form={form}
                    name="active"
                    label=""
                    valuePropName="checked"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Switch checked={active} onChange={handleChange} />
                        <span>{active ? 'Đang đào tạo' : 'Ngừng đào tạo'}</span>
                    </div>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingBlock
