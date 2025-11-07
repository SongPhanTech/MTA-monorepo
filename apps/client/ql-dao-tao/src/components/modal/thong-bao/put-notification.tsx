import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import type { Prisma } from '@workspace/db/client'
import {
    useCreateNotification,
    useFindUniqueNotification,
    useUpdateNotification,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutNotification = Prisma.NotificationGetPayload<{
    include: {
        attachments: true
    }
}>
const PutNotificationModal = () => {
    const [form] = Form.useForm<PutNotification>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutNotificationModal',
        onClose: form.resetFields,
    })

    const attachments = Form.useWatch('attachments', form)
    console.log('attachments', attachments)

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateNotification()
    const { mutateAsync: update } = useUpdateNotification()
    async function onOk(value: PutNotification) {
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        ...(({ attachments, ...rest }) => rest)(value),
                        publishedAt: value.publishedAt
                            ? dayjs(value.publishedAt).toDate()
                            : undefined,
                        expiresAt: value.expiresAt ? dayjs(value.expiresAt).toDate() : undefined,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        ...(({ attachments, ...rest }) => rest)(value),
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingTime'],
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

    const { data } = useFindUniqueNotification(
        {
            where: { id },
            include: {
                attachments: true,
            },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                ...data,
            })
        } else {
            form.setFieldsValue({
                active: true,
            })
        }
    }, [data])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa thời gian đào tạo' : 'Thêm mới thời gian đào tạo'}
            className="w-[85vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="title" label="Tiêu đề thông báo" required>
                    <Input placeholder="Nhập tiêu đề thông báo" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="content" label="Nội dung thông báo" required>
                    <RichTextEditor />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="publishedAt" label="Ngày đăng" required>
                    <DatePicker
                        minDate={dayjs().startOf('day')}
                        defaultValue={dayjs().startOf('day')}
                        style={{ width: '100%' }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="expiresAt" label="Ngày hết hạn">
                    <DatePicker minDate={dayjs().startOf('day')} style={{ width: '100%' }} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="attachments" label="Tài liệu đính kèm">
                    <DocumentPaths
                        form={form}
                        data={data?.attachments || []}
                        titleForm="attachments"
                        relationId={id || ''}
                        relationType="notificationId"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Hiển thị</Radio>
                        <Radio value={false}>Không hiển thị</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export { PutNotificationModal }
