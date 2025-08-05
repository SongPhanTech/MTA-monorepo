import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ArchivedCertificate } from '@workspace/db'
import {
    useCreateArchivedCertificate,
    useFindUniqueArchivedCertificate,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutArchivedCertificate = ArchivedCertificate
dayjs.locale('vi')

const PutCertificateScoreModal = () => {
    const [form] = Form.useForm<PutArchivedCertificate>()
    const [_targetDisabled, setTargetDisabled] = useState(true)
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCertificateScoreModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedCertificate } = useCreateArchivedCertificate()
    const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            showSpinner()
            if (id) {
                await updateArchivedCertificate({
                    data: {
                        name: rest.name,
                        finalScore: rest.finalScore,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createArchivedCertificate({
                    data: rest,
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['ArchivedCertificate'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: level } = useFindUniqueArchivedCertificate(
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
            title={id ? 'Chỉnh sửa điểm chứng chỉ' : 'Thêm mới điểm chứng chỉ'}
            className="w-[500px]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên chứng chỉ" required>
                    <Input placeholder="Nhập tên chứng chỉ" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="finalScore" label="Điểm tương đương">
                    <InputNumber
                        placeholder="Nhập điểm tương đương"
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

export default PutCertificateScoreModal
