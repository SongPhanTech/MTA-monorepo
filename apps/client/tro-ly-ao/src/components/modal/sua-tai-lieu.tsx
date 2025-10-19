import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import {
    useCreateManyDocumentTopic,
    useDeleteManyDocumentTopic,
    useFindFirstDocument,
    useFindManyDocumentClassification,
    useUpdateDocument,
} from '@workspace/db/hooks'
import { Col, Form, Input, Modal, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useTopics } from '@/hooks/useTopics'

type DocumentEditFormType = {
    title: string
    topicIds: string[]
    classificationId?: string
}

const SuaTaiLieu = () => {
    const { selectableTopicOptions } = useTopics()
    const { data: classifications = [] } = useFindManyDocumentClassification({
        orderBy: { name: 'asc' },
    })

    const {
        isOpen,
        onClose,
        input: documentId,
    } = useDisclosure<string>({
        tag: 'SuaTaiLieu',
    })

    const { data: document } = useFindFirstDocument({
        where: { id: documentId },
        include: {
            topics: {
                include: {
                    topic: true,
                },
            },
            classification: true,
        },
    })

    const { mutateAsync: updateDocument } = useUpdateDocument()
    const { mutateAsync: deleteManyDocumentTopic } = useDeleteManyDocumentTopic()
    const { mutateAsync: createManyDocumentTopic } = useCreateManyDocumentTopic()

    const [form] = Form.useForm<DocumentEditFormType>()

    useEffect(() => {
        if (document && isOpen) {
            form.setFieldsValue({
                title: document.title || '',
                topicIds: document.topics?.map((dt) => dt.topicId) || [],
                classificationId: document.classificationId || undefined,
            })
        }
    }, [document, isOpen, form])

    const onFinish = async (values: DocumentEditFormType) => {
        if (!documentId) return

        try {
            // Bước 1: Update document
            await updateDocument({
                where: { id: documentId },
                data: {
                    title: values.title,
                    classificationId: values.classificationId || null,
                },
            })

            // Bước 2: Xóa tất cả DocumentTopic cũ
            await deleteManyDocumentTopic({
                where: {
                    documentId: documentId,
                },
            })

            // Bước 3: Tạo DocumentTopic mới
            if (values.topicIds.length > 0) {
                await createManyDocumentTopic({
                    data: values.topicIds.map((topicId) => ({
                        documentId: documentId,
                        topicId: topicId,
                    })),
                })
            }

            message.success('Cập nhật tài liệu thành công')
            onClose()
        } catch (_error) {
            console.error('Error updating document:', _error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <Modal
            title="Sửa tài liệu"
            open={isOpen}
            onCancel={onClose}
            okText="Lưu"
            cancelText="Hủy"
            onOk={form.submit}
        >
            <Form form={form} onFinish={onFinish} layout="vertical" className="mt-4">
                <Col span={24}>
                    <FormItem
                        form={form}
                        name="title"
                        label="Tên tài liệu"
                        rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
                    >
                        <Input placeholder="Nhập tên tài liệu" />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem
                        form={form}
                        name="topicIds"
                        label="Loại tài liệu"
                        rules={[
                            { required: true, message: 'Vui lòng chọn ít nhất một loại tài liệu' },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn loại tài liệu"
                            options={selectableTopicOptions.map((topic) => ({
                                value: topic.id,
                                label: topic.name,
                            }))}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name="classificationId" label="Phân loại">
                        <Select
                            allowClear
                            placeholder="Chọn phân loại (tùy chọn)"
                            options={classifications.map((classification) => ({
                                value: classification.id,
                                label: classification.name,
                            }))}
                        />
                    </FormItem>
                </Col>
            </Form>
        </Modal>
    )
}

export default SuaTaiLieu
