import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ArchivedAward } from '@workspace/db/client'
import {
    useCreateArchivedAward,
    useFindUniqueArchivedAward,
    useUpdateArchivedAward,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutArchivedAward = ArchivedAward
dayjs.locale('vi')
const PutOlympicScoreModal = () => {
    const [form] = Form.useForm<PutArchivedAward>()
    const [_targetDisabled, setTargetDisabled] = useState(true)
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutOlympicScoreModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedAward } = useCreateArchivedAward()
    const { mutateAsync: updateArchivedAward } = useUpdateArchivedAward()
    async function onOk({ ...rest }: PutArchivedAward) {
        try {
            showSpinner()
            if (id) {
                await updateArchivedAward({
                    data: {
                        // name: rest.name,
                        bonusScore: rest.bonusScore,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createArchivedAward({
                    data: rest,
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['ArchivedAward'],
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

    const { data: level } = useFindUniqueArchivedAward(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            setTargetDisabled(false)
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
            title={id ? 'Chỉnh sửa điểm oplympic' : 'Thêm mới điểm oplympic'}
            className="w-[500px]"
        >
            <Col span={24}>
                {/* <FormItem form={form} name="name" label="Tên giải thưởng" required>
                    <Input placeholder="Nhập tên giải thưởng" />
                </FormItem> */}
            </Col>
            <Col span={24}>
                <FormItem form={form} name="bonusScore" label="Điểm cộng">
                    <InputNumber
                        type="number"
                        placeholder="Nhập điểm cộng"
                        className="w-full"
                        min={0}
                        max={10}
                        step={0.1}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutOlympicScoreModal
