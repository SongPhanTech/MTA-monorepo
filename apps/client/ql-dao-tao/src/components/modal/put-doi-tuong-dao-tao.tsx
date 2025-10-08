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
        tag: 'PutTrainingObjectTypeModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingObjectType } = useCreateTrainingObjectType()
    const { mutateAsync: updateTrainingObjectType } = useUpdateTrainingObjectType()

    //TODO: add hiển thị thêm bậc đào tạo và hình thức đào tạo và lưu thêm bậc đào tạo và hình thức đào tạo
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
            queryClient.invalidateQueries({
                queryKey: ['TrainingObjectType'],
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
            title={id ? 'Chỉnh sửa đối tượng đào tạo' : 'Thêm mới đối tượng đào tạo'}
            className="w-[900px]"
        >
            <Col span={12}>
                <FormItem form={form} name="type" label="Loại đối tượng đào tạo" required>
                    <Select
                        placeholder="Chọn loại đối tượng đào tạo"
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
                <FormItem form={form} name="name" label="Tên đối tượng đào tạo" required>
                    <Input placeholder="Nhập tên đối tượng đào tạo" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingType" label="Hình thức đào tạo" required>
                    <Input placeholder="Nhập tên hình thức đào tạo" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingLevel" label="Bậc đào tạo" required>
                    <Input placeholder="Nhập tên bậc đào tạo" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
                    <FormItem form={form} name={'active'} label="Trạng thái">
                        <Radio.Group buttonStyle="solid">
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutTrainingObjectTypeModal
