import { CloseCircleOutlined } from '@ant-design/icons'
import { fetchGeneratePresignedUrl } from '@api/common/commonComponents'
import { fetchReadDocumentContentDocumentDocumentReaderGet } from '@api/qa/qaComponents'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import UploadDragAndDrop, { FileUploadIcon } from '@components/commons/upload'
import { DOCUMENT_TYPE } from '@constants/constants'
import { cn, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db'
import { useCreateManyDocument } from '@workspace/db/hooks'
import { Col, Form, Input, Modal, Progress, message } from 'antd'
import axios from 'axios'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
type DocumentFormType = {
    type: $Enums.DocumentType
    files: Record<
        string,
        {
            url: string
            file: File
            body: string
            progress?: number
            timeLeft?: number
            id: string
        }
    >
}
const ThemTaiLieu = () => {
    const { isOpen, onClose } = useDisclosure<string>({
        tag: ThemTaiLieu.name,
    })

    const { mutateAsync: createMany } = useCreateManyDocument()

    const [selectedFile, setSelectedFile] =
        useState<DocumentFormType['files'][0]>()

    const [form] = Form.useForm<DocumentFormType>()

    const files = Form.useWatch('files', form) || {}
    const type = Form.useWatch('type', form) || {}

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
                            // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
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
                    const resPresignedUrl = await fetchGeneratePresignedUrl({
                        body: {
                            path: 'tai-lieu',
                            extension: file.file.name.split('.').pop() || '',
                        },
                    })
                    await axios.put(resPresignedUrl.url, file.file, {
                        onUploadProgress: (progressEvent) => {
                            const {
                                loaded,
                                total = 1,
                                estimated = 0,
                            } = progressEvent
                            const percent = Math.floor((loaded * 100) / total)
                            form.setFieldsValue({
                                files: {
                                    ...form.getFieldValue('files'),
                                    [file.id]: {
                                        ...file,
                                        url: resPresignedUrl.fileName,
                                        progress: percent,
                                        timeLeft: estimated,
                                    },
                                },
                            })
                        },
                    })
                    const resReaderDocument =
                        await fetchReadDocumentContentDocumentDocumentReaderGet(
                            {
                                queryParams: {
                                    uri_file: getMinioUrl(
                                        resPresignedUrl.fileName
                                    ),
                                    type,
                                },
                            }
                        )
                    form.setFieldsValue({
                        files: {
                            ...form.getFieldValue('files'),
                            [file.id]: {
                                ...file,
                                body: resReaderDocument.body,
                            },
                        },
                    })
                })
            )
        } catch (error) {
            console.log('error', error)
        }
    }

    const onFinish = async (values: DocumentFormType) => {
        try {
            await createMany({
                data: Object.values(values.files).map(
                    ({ body, file, url }) => ({
                        uri: url,
                        title: file.name,
                        fileType: file.type,
                        type: values.type,
                        body,
                        fileSize: file.size,
                    })
                ),
            })
            message.success('Thêm tài liệu thành công')
            onClose()
        } catch (error) {
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
            onOk={form.submit}
        >
            <div className="flex gap-4 justify-between">
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    className={cn('mt-4', selectedFile ? 'w-2/5' : 'w-full')}
                    initialValues={{
                        files: {},
                        type: $Enums.DocumentType.ACADEMY_INFORMATION,
                    }}
                >
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name={'type'}
                            label="Loại tài liệu"
                        >
                            <Select
                                defaultValue={
                                    $Enums.DocumentType.ACADEMY_INFORMATION
                                }
                                options={DOCUMENT_TYPE}
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
                                    'flex items-center gap-2 mt-2 border border-gray-300 rounded-lg p-2 justify-between cursor-pointer hover:bg-gray-100',
                                    selectedFile?.url === file.url &&
                                        'bg-gray-100 border-primary'
                                )}
                            >
                                <FileUploadIcon
                                    fileType={file.file.type}
                                    width={40}
                                    height={40}
                                />
                                <div className="flex flex-col flex-1">
                                    <div className="max-w-[400px] truncate">
                                        <span className="font-semibold ">
                                            {file.file.name}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 text-sm">
                                        {formatNiceBytes(`${file.file.size}`)}
                                        {!!file.timeLeft && !!file.progress && (
                                            <span className="text-gray-400 text-sm">
                                                {` - ${Math.floor(
                                                    file.timeLeft
                                                )} giây`}
                                            </span>
                                        )}
                                    </span>

                                    {file.progress !== 0 &&
                                        file.progress !== 100 && (
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
                        <Input.TextArea
                            value={selectedFile.body}
                            className="h-full"
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ThemTaiLieu
