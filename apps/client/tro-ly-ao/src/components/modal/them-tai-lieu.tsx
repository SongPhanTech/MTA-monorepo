import { fetchOCR } from '@/api/ocr'
import { useTopics } from '@/hooks/useTopics'
import { CloseCircleOutlined, InboxOutlined } from '@ant-design/icons'
import { fetchReadDocumentContentDocumentDocumentReaderPost } from '@api/qa/qaComponents'
import DocumentSidebar from '@components/commons/document-sidebar'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import UploadDragAndDrop, { FileUploadIcon } from '@components/commons/upload'
import { cn, formatNiceBytes } from '@lib/utils'
import {
    useCreateDocument,
    useCreateManyDocumentTopic,
    useFindManyDocument,
    useFindManyDocumentClassification,
} from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { Col, Form, Input, message, Modal, Progress, Tag } from 'antd'
import axios from 'axios'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type DocumentFormType = {
    topicIds: string[]
    classificationId?: string
    files: Record<
        string,
        {
            url: string
            file: File
            body: string
            progress?: number
            timeLeft?: number
            similar?: number
            similarDocumentId?: string
            id: string
            customName?: string
            isProcessingOCR?: boolean
            ocrStatus?: 'processing' | 'success' | 'failed'
        }
    >
}
const ThemTaiLieu = () => {
    const { selectableTopicOptions } = useTopics()
    const { data: classifications = [] } = useFindManyDocumentClassification({
        orderBy: { name: 'asc' },
    })
    const {
        isOpen,
        onClose,
        input: selectedFiles,
    } = useDisclosure<{ file: File; progress: number; timeLeft: number }[]>({
        tag: 'ThemTaiLieu',
    })

    const { mutateAsync: createDocument } = useCreateDocument()
    const { mutateAsync: createManyDocumentTopic } = useCreateManyDocumentTopic()

    const [selectedFile, setSelectedFile] = useState<DocumentFormType['files'][0]>()
    const [viewingSimilarDocId, setViewingSimilarDocId] = useState<string | null>(null)

    const [form] = Form.useForm<DocumentFormType>()

    const files = Form.useWatch('files', form) || {}

    // Lấy danh sách ID tài liệu tương đồng từ files
    const similarDocumentIds = useMemo(() => {
        return Object.values(files)
            .map((file) => file.similarDocumentId)
            .filter((id): id is string => Boolean(id))
    }, [files])

    // Fetch thông tin tài liệu tương đồng
    const { data: similarDocuments = [] } = useFindManyDocument(
        {
            where: {
                id: {
                    in: similarDocumentIds,
                },
            },
            select: {
                id: true,
                title: true,
            },
        },
        {
            enabled: similarDocumentIds.length > 0,
        }
    )
    const selectedTopicIds = Form.useWatch('topicIds', form)
    const [modalThemTaiLieu, contextConfirmThemTaiLieu] = Modal.useModal()

    const isImageFile = (file: File) => {
        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg']
        return imageTypes.includes(file.type)
    }

    const isPDFFile = (file: File) => {
        return file.type === 'application/pdf'
    }

    const processWithOCR = async (file: File, fileId: string) => {
        try {
            console.log('[OCR] Bắt đầu xử lý OCR cho file:', file.name)

            // Bắt đầu OCR
            form.setFieldsValue({
                files: {
                    ...form.getFieldValue('files'),
                    [fileId]: {
                        ...form.getFieldValue('files')[fileId],
                        isProcessingOCR: true,
                        ocrStatus: 'processing',
                    },
                },
            })

            const ocrResult = await fetchOCR(file)
            console.log('[OCR] Kết quả OCR:', JSON.stringify(ocrResult, null, 2))

            let textResult = ''
            if (typeof ocrResult === 'string') {
                textResult = ocrResult
            } else if (ocrResult.text) {
                textResult = ocrResult.text
            } else if (ocrResult.body) {
                textResult = ocrResult.body
            } else if (ocrResult.data) {
                textResult = ocrResult.data
            } else if (ocrResult.result) {
                textResult = ocrResult.result
            }

            // Kiểm tra kết quả OCR
            const ocrStatus = textResult.trim().length === 0 ? 'failed' : 'success'

            form.setFieldsValue({
                files: {
                    ...form.getFieldValue('files'),
                    [fileId]: {
                        ...form.getFieldValue('files')[fileId],
                        isProcessingOCR: false,
                        ocrStatus: ocrStatus,
                    },
                },
            })

            console.log(
                `[OCR] Text trích xuất được (length: ${textResult.length}):`,
                textResult.substring(0, 500)
            )
            return textResult
        } catch (error) {
            console.error('[OCR] Lỗi xử lý OCR:', error)

            // Set OCR failed state on error
            form.setFieldsValue({
                files: {
                    ...form.getFieldValue('files'),
                    [fileId]: {
                        ...form.getFieldValue('files')[fileId],
                        isProcessingOCR: false,
                        ocrStatus: 'failed',
                    },
                },
            })
            return ''
        }
    }

    const onUpload = async (
        values: Array<{
            url: string
            file: File
        }>
    ) => {
        try {
            // Kiểm tra chọn topic
            const currentTopicIds = form.getFieldValue('topicIds')
            if (!currentTopicIds || currentTopicIds.length === 0) {
                message.error('Vui lòng chọn ít nhất một loại tài liệu trước khi tải lên')
                return
            }

            // Kiểm tra kích thước file PDF (giới hạn 100MB)
            const MAX_PDF_SIZE = 100 * 1024 * 1024 // 100MB in bytes
            for (const item of values) {
                if (isPDFFile(item.file) && item.file.size > MAX_PDF_SIZE) {
                    message.error(
                        `File PDF "${item.file.name}" vượt quá giới hạn 100MB (${formatNiceBytes(item.file.size)})`
                    )
                    return
                }
            }

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
                    let documentBody = ''
                    let similarScore = 0
                    let needOCR = false

                    if (isImageFile(file.file)) {
                        needOCR = true
                        form.setFieldsValue({
                            files: {
                                ...form.getFieldValue('files'),
                                [file.id]: {
                                    ...file,
                                    progress: 0,
                                    isProcessingOCR: true,
                                },
                            },
                        })
                        documentBody = await processWithOCR(file.file, file.id)
                        console.log(`[OCR] Body sau khi xử lý (length: ${documentBody.length})`)
                    }

                    const { data: resPresignedUrl } = await generatePresignedUrl({
                        path: 'tai-lieu',
                        extension: file.file.name.split('.').pop() || '',
                    })
                    await axios.put(resPresignedUrl.url, file.file, {
                        onUploadProgress: (progressEvent) => {
                            const { loaded, total = 1, estimated = 0 } = progressEvent
                            const percent = Math.floor((loaded * 100) / total)
                            const currentFiles = form.getFieldValue('files')
                            const currentFile = currentFiles[file.id]

                            // Nếu đang OCR thì không update upload progress
                            if (currentFile?.isProcessingOCR) {
                                return
                            }

                            form.setFieldsValue({
                                files: {
                                    ...currentFiles,
                                    [file.id]: {
                                        ...currentFile,
                                        url: resPresignedUrl.fileName,
                                        progress: Math.min(percent, 90),
                                        timeLeft: estimated,
                                    },
                                },
                            })
                        },
                    })
                    const currentTopicIds = form.getFieldValue('topicIds')

                    let similarDocId: string | undefined
                    if (!needOCR) {
                        const resReaderDocument =
                            await fetchReadDocumentContentDocumentDocumentReaderPost({
                                body: {
                                    uri_file: resPresignedUrl.fileName,
                                    topic_ids: currentTopicIds,
                                },
                            } as any)
                        documentBody = resReaderDocument.body || ''
                        const similarDocs = resReaderDocument.document_simmilar || []
                        const hasSimilarDocument = similarDocs.length > 0
                        similarScore = hasSimilarDocument ? similarDocs[0].score : 0
                        similarDocId = hasSimilarDocument ? similarDocs[0].id : undefined

                        if (
                            isPDFFile(file.file) &&
                            (!documentBody || documentBody.trim().length < 50)
                        ) {
                            console.log('[OCR] PDF không có text, chuyển sang OCR')
                            form.setFieldsValue({
                                files: {
                                    ...form.getFieldValue('files'),
                                    [file.id]: {
                                        ...file,
                                        progress: 90,
                                        isProcessingOCR: true,
                                    },
                                },
                            })
                            documentBody = await processWithOCR(file.file, file.id)
                            needOCR = true
                        }
                    }

                    form.setFieldsValue({
                        files: {
                            ...form.getFieldValue('files'),
                            [file.id]: {
                                ...file,
                                body: documentBody,
                                similar: similarScore,
                                similarDocumentId: similarDocId,
                                progress: 100,
                                isProcessingOCR: false,
                            },
                        },
                    })
                })
            )
        } catch (error) {
            console.log('error', error)
        }
    }

    const getSimilarDocumentTitle = (similarDocumentId?: string) => {
        if (!similarDocumentId) return null
        const doc = similarDocuments.find((d) => d.id === similarDocumentId)
        return doc?.title || null
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

            // Tạo document trước, sau đó tạo DocumentTopic
            await Promise.all(
                Object.values(values.files).map(async ({ body, file, url, customName }) => {
                    console.log('[Database] Lưu tài liệu:', {
                        fileName: customName || file.name,
                        fileType: file.type,
                        bodyLength: body.length,
                        isOCR: isImageFile(file) || isPDFFile(file),
                    })
                    // Tạo document
                    const newDocument = await createDocument({
                        data: {
                            uri: url,
                            title: customName || file.name,
                            fileType: file.type,
                            body,
                            fileSize: file.size,
                            classificationId: values.classificationId || null,
                        },
                    })
                    console.log('[Database] Đã lưu document ID:', newDocument?.id)

                    // Tạo DocumentTopic cho tất cả topicIds
                    if (newDocument && values.topicIds.length > 0) {
                        await createManyDocumentTopic({
                            data: values.topicIds.map((topicId) => ({
                                documentId: newDocument.id,
                                topicId: topicId,
                            })),
                        })
                    }
                })
            )
            message.success('Thêm tài liệu thành công')
            onClose()
        } catch (_error) {
            console.error('Error creating document:', _error)
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
                    Object.values(files).some(
                        (file) => file.progress !== 100 || file.isProcessingOCR
                    ),
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
                        topicIds: [],
                        classificationId: undefined,
                    }}
                >
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name={'topicIds'}
                            label="Loại tài liệu"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng chọn ít nhất một loại tài liệu',
                                },
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
                        <FormItem form={form} name={'classificationId'} label="Phân loại">
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
                    <Col span={24}>
                        <FormItem form={form} name={'files'}>
                            {selectedTopicIds && selectedTopicIds.length > 0 ? (
                                <UploadDragAndDrop
                                    multiple
                                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/png,image/jpeg,image/jpg"
                                    className="w-full h-[165px]"
                                    isShowUpload={false}
                                    onUpload={onUpload}
                                />
                            ) : (
                                <div className="w-full h-[165px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    <div className="text-center text-gray-500">
                                        <div className="text-4xl mb-2">
                                            <InboxOutlined />
                                        </div>
                                        <div>
                                            Vui lòng chọn loại tài liệu trước khi tải lên file
                                        </div>
                                    </div>
                                </div>
                            )}
                        </FormItem>
                    </Col>
                    <div className="overflow-y-scroll max-h-[300px] mt-4">
                        {Object.entries(files).map(([key, file]) => (
                            <div
                                key={file.url}
                                onClick={setSelectedFile.bind(null, file)}
                                className={cn(
                                    'flex items-start gap-2 mt-2 border border-gray-300 rounded-lg p-2 cursor-pointer hover:bg-gray-100',
                                    selectedFile?.url === file.url && 'bg-gray-100 border-primary'
                                )}
                            >
                                <FileUploadIcon
                                    fileType={file.file.type}
                                    width={40}
                                    height={40}
                                    className="flex-shrink-0"
                                />
                                <div className="flex flex-col flex-1 gap-1 min-w-0">
                                    {file.progress === 100 ? (
                                        <Input
                                            size="small"
                                            placeholder="Nhập tên tài liệu"
                                            defaultValue={file.customName || file.file.name}
                                            onChange={(e) => {
                                                form.setFieldsValue({
                                                    files: {
                                                        ...form.getFieldValue('files'),
                                                        [key]: {
                                                            ...file,
                                                            customName: e.target.value,
                                                        },
                                                    },
                                                })
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="max-w-[400px] truncate">
                                            <span className="font-semibold ">{file.file.name}</span>
                                        </div>
                                    )}
                                    <span className="text-gray-400 text-sm">
                                        {file.isProcessingOCR ? (
                                            <span className="text-orange-500 text-sm font-medium">
                                                Đang chuyển đổi hình ảnh sang văn bản...
                                            </span>
                                        ) : file.ocrStatus === 'failed' ? (
                                            <span className="text-red-500 text-sm font-medium">
                                                Chuyển đổi văn bản thất bại
                                            </span>
                                        ) : file.ocrStatus === 'success' ? (
                                            <span className="text-primary text-sm font-medium">
                                                Chuyển đổi văn bản thành công
                                            </span>
                                        ) : (
                                            <>
                                                {formatNiceBytes(`${file.file.size}`)}
                                                {!!file.timeLeft && !!file.progress && (
                                                    <span className="text-gray-400 text-sm">
                                                        {` - ${Math.floor(file.timeLeft)} giây`}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </span>

                                    {file.similarDocumentId && file.similar && (
                                        <div
                                            className="flex items-center gap-2 mt-1 cursor-pointer hover:underline min-w-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setViewingSimilarDocId(
                                                    file.similarDocumentId || null
                                                )
                                            }}
                                        >
                                            <Tag
                                                color={
                                                    file.similar > 0.8
                                                        ? 'red'
                                                        : file.similar > 0.5
                                                          ? 'orange'
                                                          : 'green'
                                                }
                                                className="m-0 flex-shrink-0"
                                            >
                                                {Math.floor(file.similar * 100)}% tương đồng
                                            </Tag>
                                            <span className="text-xs text-gray-600 truncate">
                                                với:{' '}
                                                <span className="font-medium text-primary">
                                                    {getSimilarDocumentTitle(
                                                        file.similarDocumentId
                                                    ) || 'Đang tải...'}
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    {file.progress !== 0 && file.progress !== 100 && (
                                        <Progress percent={file.progress} status="active" />
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
                                    className="text-lg cursor-pointer flex-shrink-0 self-start"
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

            <DocumentSidebar
                documentId={viewingSimilarDocId}
                citationContent={null}
                onClose={() => setViewingSimilarDocId(null)}
            />
        </Modal>
    )
}

export default ThemTaiLieu
