import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import useSpinner from '@hooks/spinner'
import type { TrainingScoreSession } from '@workspace/db'
import {
    useCreateTrainingScoreSession,
    useFindManyTrainingObjectType,
    useFindUniqueTrainingScoreSession,
    useUpdateTrainingScoreSession,
} from '@workspace/db/hooks'
import { Col, DatePicker, Form, Input, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTrainingLocation = TrainingScoreSession

const PutDotRenLuyen = () => {
    const [form] = Form.useForm<PutTrainingLocation>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutDotRenLuyen',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { createdAt: 'desc' },
    })

    const { mutateAsync: createTrainingScoreSession } = useCreateTrainingScoreSession()
    const { mutateAsync: updateTrainingScoreSession } = useUpdateTrainingScoreSession()

    async function onOk(output?: PutTrainingLocation) {
        if (!output) return
        try {
            showSpinner()

            const data = {
                name: output.name,
                time: output.time,
                semesterId: output.semesterId,
                trainingObjectTypeId: output.trainingObjectTypeId,
                description: output.description,
            }
            if (id) {
                await updateTrainingScoreSession({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingScoreSession({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingScoreSession'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueTrainingScoreSession(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                time: initialValue.time ? dayjs(initialValue.time) : undefined,
            })
        } else {
            form.setFieldsValue({
                time: dayjs(),
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đợt rèn luyện' : 'Thêm mới đợt rèn luyện'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên đợt" required>
                    <Input placeholder="Nhập tên đợt" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="semesterId" label="Học kì" required>
                    <TreeSelectSemester />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng">
                    <Select
                        options={trainingObjectTypeData.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        placeholder="Chọn đối tượng"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="time" label="Thời gian">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        defaultValue={dayjs()}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Ghi chú">
                    <Input.TextArea />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutDotRenLuyen
