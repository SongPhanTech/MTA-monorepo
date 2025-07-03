import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingBlock, TrainingBlockOnCurriculumVersion } from '@workspace/db'
import {
    useCreateTrainingBlockOnCurriculumVersion,
    useFindManyTrainingBlock,
    useFindUniqueTrainingBlockOnCurriculumVersion,
    useUpdateTrainingBlockOnCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Form, message, Radio, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { useEffect } from 'react'
export type PutTrainingBlockOnCurriculumVersion = TrainingBlockOnCurriculumVersion
dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    curriculumVersionId: string
    trainingBlockOnCurriculumVersionId: string
}
const PutTrainingBlockOnCurriculumVersion = () => {
    const [form] = Form.useForm<PutTrainingBlockOnCurriculumVersion>()
    const { isOpen, onClose, input } = useDisclosure<TrainingBlockOnCurriculumVersionInput>({
        tag: PutTrainingBlockOnCurriculumVersion.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueTrainingBlockOnCurriculumVersion(
        {
            where: { id: input?.trainingBlockOnCurriculumVersionId },
            include: {
                subjects: {
                    include: {
                        subject: {
                            include: {
                                managementOrganization: true,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!input?.trainingBlockOnCurriculumVersionId }
    )

    const { data: trainingBlockData = [], refetch } = useFindManyTrainingBlock()

    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({
                active: true,
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
                active: output.active,
            }

            if (input?.trainingBlockOnCurriculumVersionId) {
                await updateTrainingBlockOnCurriculumVersion({
                    data: payload,
                    where: { id: input?.trainingBlockOnCurriculumVersionId },
                })
                message.success('Cập nhật thành công')
            } else {
                const ids = Array.isArray(payload.trainingBlockId)
                    ? payload.trainingBlockId
                    : [payload.trainingBlockId]

                await Promise.all(
                    ids.map((trainingBlockId) =>
                        createTrainingBlockOnCurriculumVersion({
                            data: {
                                trainingBlockId,
                                curriculumVersionId: payload.curriculumVersionId || '',
                            },
                        })
                    )
                )

                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlock'],
            })
            onClose()
        } catch (_error) {
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
                <FormItem form={form} name="trainingBlockId" label="Khối kiến thức" required>
                    <Select
                        mode="multiple"
                        placeholder="Chọn khối kiến thức"
                        options={trainingBlockData.map((i: TrainingBlock) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        disabled={!!input?.trainingBlockOnCurriculumVersionId}
                    />
                </FormItem>
            </Col>
            {input?.trainingBlockOnCurriculumVersionId && (
                <Col span={24}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
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

export default PutTrainingBlockOnCurriculumVersion
