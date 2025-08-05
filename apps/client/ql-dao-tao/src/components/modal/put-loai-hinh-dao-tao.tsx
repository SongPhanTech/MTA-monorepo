import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingType } from '@workspace/db'
import {
    useCreateTrainingType,
    useFindUniqueTrainingType,
    useUpdateTrainingType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'

dayjs.locale('vi')
const PutTrainingTypeModal = () => {
    const [form] = Form.useForm<TrainingType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingTypeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingType } = useCreateTrainingType()
    const { mutateAsync: updateTrainingType } = useUpdateTrainingType()
    async function onOk({ ...rest }: TrainingType) {
        try {
            showSpinner()
            if (id) {
                await updateTrainingType({
                    data: {
                        ...rest,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingType({
                    data: {
                        ...rest,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingType'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: level } = useFindUniqueTrainingType(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
            })
        } else {
            form.setFieldsValue({
                active: true,
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa chuyên ngành' : 'Thêm mới chuyên ngành'}
            className="w-[900px]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đối đượng đào tạo" required>
                    <Input placeholder="Nhập tên đối đượng đào tạo" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingTypeModal
