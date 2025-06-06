import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useCreateFixedClass, useUpdateFixedClass } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutFixedClass = {
    name: string
    code: string
    knowledgeBlockName?: string
    totalCredits: string
    totalRequiredCredits: string
    electiveCredits: string
    specializedCredits: string
    requiredSpecializedCredits: string
    order: string
}
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutKnowledgeBlock = () => {
    const [form] = Form.useForm<PutFixedClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutKnowledgeBlock.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createFixedClass } = useCreateFixedClass()
    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function onOk(output?: PutFixedClass) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateFixedClass({
                    data: {
                        code: output.code,
                        name: output.name,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createFixedClass({
                    data: {
                        code: output.code,
                        name: output.name,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách
            queryClient.invalidateQueries({
                queryKey: ['FixedClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
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
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập mã khối kiến thức" />
                </FormItem>
            </Col> */}
            <Col span={24}>
                <FormItem
                    form={form}
                    name="knowledgeBlockName"
                    label="Tên khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập tên khối kiến thức" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="totalCredits"
                    label="Tổng tín chỉ"
                    required
                >
                    <Input placeholder="Tổng tín chỉ" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="totalRequiredCredits"
                    label="Tổng tín chỉ bắt buộc"
                    required
                >
                    <Input placeholder="Tổng tín chỉ bắt buộc" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="electiveCredits"
                    label="Số tín chỉ tự chọn"
                    required
                >
                    <Input placeholder="Số tín chỉ tự chọn" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="specializedCredits"
                    label="Số tín chỉ chuyên ngành"
                    required
                >
                    <Input placeholder="Số tín chỉ chuyên ngành" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="order" label="Thứ tự" required>
                    <Input placeholder="Thứ tự" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutKnowledgeBlock
