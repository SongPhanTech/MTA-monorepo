import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    TrainingBlock,
    TrainingBlockOnCurriculumVersion,
} from '@workspace/db'
import {
    useCreateTrainingBlockOnCurriculumVersion,
    useFindManyTrainingBlock,
    useFindUniqueTrainingBlockOnCurriculumVersion,
    useUpdateTrainingBlockOnCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTrainingBlockOnCurriculumVersion =
    TrainingBlockOnCurriculumVersion
import 'dayjs/locale/vi'
import { useEffect } from 'react'
dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    curriculumVersionId: string
    trainingBlockOnCurriculumVersionId: string
}
const PutTrainingBlockOnCurriculumVersion = () => {
    const [form] = Form.useForm<PutTrainingBlockOnCurriculumVersion>()
    const { isOpen, onClose, input } =
        useDisclosure<TrainingBlockOnCurriculumVersionInput>({
            tag: PutTrainingBlockOnCurriculumVersion.name,
            onClose: form.resetFields,
        })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } =
        useFindUniqueTrainingBlockOnCurriculumVersion(
            {
                where: { id: input?.trainingBlockOnCurriculumVersionId },
            },
            { enable: !!input?.curriculumVersionId }
        )

    const { data: trainingBlockData = [], refetch } = useFindManyTrainingBlock()

    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue, form])

    const { mutateAsync: createTrainingBlockOnCurriculumVersion } =
        useCreateTrainingBlockOnCurriculumVersion()
    const { mutateAsync: updateTrainingBlockOnCurriculumVersion } =
        useUpdateTrainingBlockOnCurriculumVersion()
    async function onOk(output?: PutTrainingBlockOnCurriculumVersion) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                trainingBlockId: output.trainingBlockId,
                curriculumVersionId: input?.curriculumVersionId,
                priority: output.priority,
            }

            if (input?.trainingBlockOnCurriculumVersionId) {
                await updateTrainingBlockOnCurriculumVersion({
                    data: payload,
                    where: { id: input?.trainingBlockOnCurriculumVersionId },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingBlockOnCurriculumVersion({
                    data: {
                        ...payload,
                        curriculumVersionId: payload?.curriculumVersionId || '',
                    },
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

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.trainingBlockOnCurriculumVersionId
                    ? 'Chỉnh sửa khối kiến thức'
                    : 'Thêm mới khối kiến thức'
            }
            className="min-w-[400px] w-[500px]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="trainingBlockId"
                    label="Khối kiến thức"
                    required
                >
                    <Select
                        placeholder="Chọn khối kiến thức"
                        options={trainingBlockData.map((i: TrainingBlock) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="priority" label="Thứ tự" required>
                    <InputNumber placeholder="Thứ tự" className="w-full" />
                </FormItem>
            </Col>
            {input?.trainingBlockOnCurriculumVersionId && (
                <Col span={24}>
                    <FormItem form={form} name="active" label="Trạng thái">
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { label: 'Đang hoạt động', value: true },
                                { label: 'Ngừng đào tạo', value: false },
                            ]}
                            allowClear
                        />
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutTrainingBlockOnCurriculumVersion
