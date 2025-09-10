import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import { DOCUMENT_TYPE } from '@constants/constants'
import { cn } from '@lib/utils'
import { $Enums } from '@workspace/db'
import { useCreateFAQ, useDeleteFAQ, useFindFirstFAQ, useUpdateFAQ } from '@workspace/db/hooks'
import { Button, Col, Form, Input, Modal, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type FAQFormType = {
    type: $Enums.DocumentType
    question: string
    answer: string
}
const PutCauHoi = () => {
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutCauHoi',
    })
    const { mutateAsync: create } = useCreateFAQ()
    const { mutateAsync: update } = useUpdateFAQ()
    const { mutateAsync: deleteFAQ } = useDeleteFAQ()

    const { data: detail } = useFindFirstFAQ({
        where: {
            id,
        },
    })

    const [form] = Form.useForm<FAQFormType>()
    useEffect(() => {
        if (id && detail) {
            form.setFieldsValue({
                type: detail.type,
                question: detail.question ?? '',
                answer: detail.answer ?? '',
            })
        }
    }, [detail, id, form.setFieldsValue])

    const onFinish = async (values: FAQFormType) => {
        try {
            if (id) {
                await update({
                    where: {
                        id,
                    },
                    data: {
                        type: values.type,
                        question: values.question,
                        answer: values.answer,
                    },
                })
                message.success('Cập nhật tài liệu thành công')
            } else {
                await create({
                    data: {
                        type: values.type,
                        question: values.question,
                        answer: values.answer,
                    },
                })
                message.success('Thêm tài liệu thành công')
            }
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }
    const _handleDelete = async () => {
        if (!id) return
        try {
            await deleteFAQ({ where: { id } })
            message.success('Xoá tài liệu thành công')
            onClose()
        } catch (_error) {
            message.error('Xoá thất bại')
        }
    }
    return (
        <Modal
            title={
                id && detail?.status === $Enums.DocumentStatus.APPROVE
                    ? 'Chi tiết'
                    : id
                      ? 'Chỉnh sửa'
                      : 'Thêm mới'
            }
            open={isOpen}
            className={cn('min-w-[50vw]')}
            onCancel={onClose}
            okText={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : 'Đồng ý'}
            cancelText={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : 'Hủy'}
            onOk={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : form.submit}
            footer={
                id ? (
                    <div className="flex justify-end items-center">
                        {/* <Popconfirm
                            title="Xác nhận xoá câu hỏi?"
                            description="Hành động này sẽ không thể hoàn tác."
                            okText="Đồng ý"
                            cancelText="Hủy"
                            onConfirm={handleDelete}
                        >
                            <Button
                                //   danger
                                type="default"
                                className="w-[30px] h-[30px] p-0"
                            >
                                <Trash2 className="w-full h-[18px]" />
                            </Button>
                        </Popconfirm> */}
                        {detail?.status === $Enums.DocumentStatus.APPROVE ? (
                            <Button onClick={onClose}>Đóng</Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button onClick={onClose}>Hủy</Button>
                                <Button type="primary" onClick={() => form.submit()}>
                                    Đồng ý
                                </Button>
                            </div>
                        )}
                    </div>
                ) : undefined
            }
        >
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                initialValues={{
                    type: $Enums.DocumentType.ACADEMY_INFORMATION,
                }}
            >
                <Col span={24}>
                    <FormItem form={form} name={'type'} label="Loại tài liệu">
                        <Select
                            defaultValue={$Enums.DocumentType.ACADEMY_INFORMATION}
                            options={DOCUMENT_TYPE}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'question'} label="Câu hỏi">
                        <Input />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'answer'} label="Câu trả lời">
                        <Input.TextArea rows={6} />
                    </FormItem>
                </Col>
            </Form>
        </Modal>
    )
}

export default PutCauHoi
