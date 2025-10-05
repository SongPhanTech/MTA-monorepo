import { CloseCircleOutlined } from '@ant-design/icons'
import { fetchReadDocumentContentDocumentDocumentReaderGet } from '@api/qa/qaComponents'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import UploadDragAndDrop, { FileUploadIcon } from '@components/commons/upload'
import { cn, formatNiceBytes } from '@lib/utils'
import { useCreateManyDocument } from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { Col, Form, Input, Modal, message, Progress } from 'antd'
import axios from 'axios'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useTopics } from '@/hooks/useTopics'

type DocumentFormType = {
    topicId: string
    files: Record<
        string,
        {
            url: string
            file: File
            body: string
            progress?: number
            timeLeft?: number
            similar?: number
            id: string
        }
    >
}
const ThemTaiLieu = () => {
    const { selectableTopicOptions } = useTopics()
    const {
        isOpen,
        onClose,
        input: selectedFiles,
    } = useDisclosure<{ file: File; progress: number; timeLeft: number }[]>({
        tag: 'ThemTaiLieu',
    })

    const { mutateAsync: createMany } = useCreateManyDocument()

    const [selectedFile, setSelectedFile] = useState<DocumentFormType['files'][0]>()

    const [form] = Form.useForm<DocumentFormType>()

    const files = Form.useWatch('files', form) || {}
    const [modalThemTaiLieu, contextConfirmThemTaiLieu] = Modal.useModal()

    const onUpload = async (
        values: Array<{
            url: string
            file: File
        }>
    ) => {
        try {
            const valuesWithId = values.map((item) => ({
                ...item,
                id: crypto.randomUUID(),
                body: '',
            }))

            form.setFieldsValue({
                files: {
                    ...files,
                    ...valuesWithId.reduce(
                        (prev, item) => ({
                            // biome-ignore lint/performance/noAccumulatingSpread: <>
                            ...prev,
                            [item.id]: {
                                ...item,
                                body: '',
                                progress: 0,
                            },
                        }),
                        {}
                    ),
                },
            })
            await Promise.all(
                valuesWithId.map(async (file) => {
                    const { data: resPresignedUrl } = await generatePresignedUrl({
                        path: 'tai-lieu',
                        extension: file.file.name.split('.').pop() || '',
                    })
                    await axios.put(resPresignedUrl.url, file.file, {
                        onUploadProgress: (progressEvent) => {
                            const { loaded, total = 1, estimated = 0 } = progressEvent
                            const percent = Math.floor((loaded * 100) / total)
                            form.setFieldsValue({
                                files: {
                                    ...form.getFieldValue('files'),
                                    [file.id]: {
                                        ...file,
                                        url: resPresignedUrl.fileName,
                                        progress: Math.min(percent, 90),
                                        timeLeft: estimated,
                                    },
                                },
                            })
                        },
                    })
                    const selectedTopicId = form.getFieldValue('topicId')
                    const selectedTopic = selectableTopicOptions.find(
                        (topic) => topic.id === selectedTopicId
                    )
                    const resReaderDocument =
                        await fetchReadDocumentContentDocumentDocumentReaderGet({
                            queryParams: {
                                uri_file: resPresignedUrl.fileName,
                                topic_type: selectedTopic?.type || '',
                            } as any,
                        })
                    form.setFieldsValue({
                        files: {
                            ...form.getFieldValue('files'),
                            [file.id]: {
                                ...file,
                                body: resReaderDocument.body,
                                similar:
                                    resReaderDocument.document_simmilar &&
                                    resReaderDocument.document_simmilar.length > 0
                                        ? resReaderDocument.document_simmilar[0].score
                                        : 0,
                                progress: 100,
                            },
                        },
                    })
                })
            )
        } catch (error) {
            console.log('error', error)
        }
    }

    const bgColorSimilar = (similar: number) => {
        if (similar > 0.8) {
            return 'bg-red-500'
        }
        if (similar > 0.5) {
            return 'bg-yellow-500'
        }
        return 'bg-green-500'
    }

    const onFinish = async (values: DocumentFormType) => {
        try {
            if (Object.values(values.files).some((file) => file.similar && file.similar > 0.8)) {
                const confirmed = await modalThemTaiLieu.confirm({
                    title: 'Xác nhận thêm tài liệu tương đồng',
                    content: 'Bạn có chắc chắn muốn thêm tài liệu đã trùng lặp không?',
                    okText: 'Đồng ý',
                    cancelText: 'Hủy',
                })
                if (!confirmed) {
                    return
                }
            }
            await createMany({
                data: Object.values(values.files).map(({ body, file, url }) => ({
                    uri: url,
                    title: file.name,
                    fileType: file.type,
                    topicId: values.topicId,
                    body,
                    fileSize: file.size,
                })),
            })
            message.success('Thêm tài liệu thành công')
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }
    return (
        <Modal
            title="Thêm tài liệu"
            open={isOpen}
            className={cn(selectedFile ? 'min-w-[70vw]' : 'min-w-[30vw]')}
            okText="Đồng ý"
            cancelText="Hủy"
            onCancel={onClose}
            okButtonProps={{
                disabled:
                    Object.keys(files).length === 0 ||
                    Object.values(files).some((file) => file.progress !== 100),
            }}
            onOk={form.submit}
        >
            {contextConfirmThemTaiLieu}
            <div className="flex gap-4 justify-between">
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    className={cn('mt-4', selectedFile ? 'w-2/5' : 'w-full')}
                    initialValues={{
                        files: {},
                        topicId: null,
                    }}
                >
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name={'topicId'}
                            label="Loại tài liệu"
                            rules={[{ required: true, message: 'Vui lòng chọn loại tài liệu' }]}
                        >
                            <Select
                                placeholder="Chọn loại tài liệu"
                                options={selectableTopicOptions.map((topic) => ({
                                    value: topic.id,
                                    label: topic.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem form={form} name={'files'}>
                            <UploadDragAndDrop
                                multiple
                                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                                className="w-full h-[165px]"
                                isShowUpload={false}
                                onUpload={onUpload}
                            />
                        </FormItem>
                    </Col>
                    <div className="overflow-y-scroll max-h-[300px] mt-4">
                        {Object.entries(files).map(([key, file]) => (
                            <div
                                key={file.url}
                                onClick={setSelectedFile.bind(null, file)}
                                className={cn(
                                    'flex items-center gap-2 mt-2 border relative border-gray-300 rounded-lg p-2 justify-between cursor-pointer hover:bg-gray-100',
                                    selectedFile?.url === file.url && 'bg-gray-100 border-primary'
                                )}
                            >
                                {!!file.similar && (
                                    <span
                                        className={cn(
                                            'text-xs absolute right-2 -top-2 text-white px-1 rounded',
                                            bgColorSimilar(file.similar)
                                        )}
                                    >
                                        {`  ${Math.floor(file.similar * 100)} % tương đồng`}
                                    </span>
                                )}
                                <FileUploadIcon fileType={file.file.type} width={40} height={40} />
                                <div className="flex flex-col flex-1">
                                    <div className="max-w-[400px] truncate">
                                        <span className="font-semibold ">{file.file.name}</span>
                                    </div>
                                    <span className="text-gray-400 text-sm">
                                        {formatNiceBytes(`${file.file.size}`)}

                                        {!!file.timeLeft && !!file.progress && (
                                            <span className="text-gray-400 text-sm">
                                                {` - ${Math.floor(file.timeLeft)} giây`}
                                            </span>
                                        )}
                                    </span>

                                    {file.progress !== 0 && file.progress !== 100 && (
                                        <Progress percent={file.progress} />
                                    )}
                                </div>
                                <CloseCircleOutlined
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (key === selectedFile?.id) {
                                            setSelectedFile(undefined)
                                        }
                                        delete files[key]
                                        form.setFieldsValue({
                                            files,
                                        })
                                    }}
                                    className="text-lg cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                </Form>
                {!!selectedFile && (
                    <div className={cn('flex flex-col gap-2 w-3/5 pt-4')}>
                        <div className="flex items-center gap-2 cursor-pointer justify-between">
                            <span>Xem trước tài liệu</span>
                            <CloseCircleOutlined
                                onClick={() => {
                                    setSelectedFile(undefined)
                                }}
                                className="text-base cursor-pointer"
                            />
                        </div>
                        <Input.TextArea value={selectedFile.body} className="h-full" />
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ThemTaiLieu
