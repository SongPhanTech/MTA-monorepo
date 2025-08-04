import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingObjectType,
    useFindUniqueTrainingObjectType,
    useUpdateTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { TRAINING_OBJECT_TYPE } from '@constants/constants'

dayjs.locale('vi')
const PutTrainingObjectTypeModal = () => {
    const [form] = Form.useForm<TrainingObjectType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingObjectTypeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingObjectType } = useCreateTrainingObjectType()
    const { mutateAsync: updateTrainingObjectType } = useUpdateTrainingObjectType()
    async function onOk({ ...rest }: TrainingObjectType) {
        try {
            showSpinner()
            if (id) {
                await updateTrainingObjectType({
                    data: {
                        ...rest,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingObjectType({
                    data: {
                        ...rest,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingObjectType'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingObjectType(
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
                <FormItem form={form} name="type" label="Đối tượng đào tạo" required>
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={Object.keys(TRAINING_OBJECT_TYPE).map((key) => {
                            return {
                                label: TRAINING_OBJECT_TYPE[
                                    key as keyof typeof TRAINING_OBJECT_TYPE
                                ],
                                value: key,
                            }
                        })}
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đối đượng đào tạo" required>
                    <Input placeholder="Nhập tên đối đượng đào tạo" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="baseScore" label="Hệ số điểm" required>
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={[
                            {
                                label: 'Hệ 10',
                                value: 'Base10',
                            },
                            {
                                label: 'Hệ 4',
                                value: 'Base4',
                            },
                        ]}
                    />
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

export default PutTrainingObjectTypeModal
