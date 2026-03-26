import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useCreateAvailableTrainingTime,
    useFindUniqueAvailableTrainingTime,
    useUpdateAvailableTrainingTime,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useSession } from '@workspace/auth/react'
import { queryClient } from '@api/index'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
export type PutAvailableTrainingTime = {
    duration: number
}

const PutAvailableTrainingTimeModal = () => {
    const [form] = Form.useForm<PutAvailableTrainingTime>()
    const { data: sessionData } = useSession()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { isOpen, onClose, input } = useDisclosure<{ id?: string }>({
        tag: 'PutAvailableTrainingTimeModal',
        onClose: form.resetFields,
    })
    const { data: initialValue } = useFindUniqueAvailableTrainingTime(
        {
            where: { id: input?.id },
        },
        {
            refetchOnWindowFocus: false,
            enabled: !!input?.id,
        }
    )

    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: updateAvailableTrainingTime } = useUpdateAvailableTrainingTime()
    const { mutateAsync: createAvailableTrainingTime } = useCreateAvailableTrainingTime()
    async function onOk(output?: PutAvailableTrainingTime) {
        if (!output) return
        if (!semesterId) {
            message.error('Vui lòng chọn học kỳ')
            return
        }
        if (!trainingObjectTypeId) {
            message.error('Vui lòng chọn đối tượng đào tạo')
            return
        }
        try {
            showSpinner()
            if (input?.id) {
                let res = await updateAvailableTrainingTime({
                    where: {
                        id: input?.id,
                    },
                    data: {
                        duration: output.duration,
                        semesterId,
                        trainingObjectTypeId,
                    },
                })
                if (res) {
                    message.success('Cập nhật thành công')
                    queryClient.invalidateQueries({
                        queryKey: ['AvailableTrainingTime'],
                    })
                    onClose()
                    return
                }
            } else {
                let res = await createAvailableTrainingTime({
                    data: {
                        duration: output.duration,
                        semesterId,
                        trainingObjectTypeId,
                    },
                })
                if (res) {
                    message.success('Tạo thành công')
                    queryClient.invalidateQueries({
                        queryKey: ['AvailableTrainingTime'],
                    })
                    onClose()
                    return
                }
            }
        } catch (error: any) {
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                duration: initialValue.duration,
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
            title={input?.id ? 'Chỉnh sửa quỹ thời gian đào tạo' : 'Tạo quỹ thời gian đào tạo'}
            className="w-[700px]"
        >
            <Col span={24}>
                <Form.Item name="duration" label="Quỹ thời gian" required>
                    <InputNumber
                        min={0}
                        className="w-full"
                        placeholder="Nhập quỹ thời gian tính theo Ngày"
                    />
                </Form.Item>
            </Col>
        </PutFormModal>
    )
}

export default PutAvailableTrainingTimeModal
