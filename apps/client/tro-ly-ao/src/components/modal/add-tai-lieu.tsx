import { CloseCircleOutlined } from '@ant-design/icons'
import { fetchGeneratePresignedUrl } from '@api/common/commonComponents'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import UploadDragAndDrop, { FileUploadIcon } from '@components/commons/upload'
import { DOCUMENT_TYPE } from '@constants/constants'
import { cn, formatNiceBytes } from '@lib/utils'
import { $Enums } from '@workspace/db'
import { useCreateManyDocument } from '@workspace/db/hooks'
import { Col, Divider, Form, Input, message, Modal, Progress, Row } from 'antd'
import axios from 'axios'
import { useSession } from 'next-auth/react'
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
        }
    >
}
const AddTaiLieu = () => {
    const { isOpen, onClose } = useDisclosure<string>({
        tag: AddTaiLieu.name,
    })
    const { mutateAsync: createMany } = useCreateManyDocument()
    const { data: myProfile } = useSession()

    const [selectedFile, setSelectedFile] =
        useState<DocumentFormType['files'][0]>()

    const [form] = Form.useForm<DocumentFormType>()

    const files = Form.useWatch('files', form) || []
    const onUpload = async (
        values: Array<{
            url: string
            file: File
        }>
    ) => {
        try {
            // form.setFieldsValue({
            //     files: files.concat(
            //         values.map((item) => ({
            //             url: item.url,
            //             file: item.file,
            //             body: item.file.name,
            //             progress: 0,
            //         }))
            //     ),
            // })
            await Promise.all(
                values.map(async (file) => {
                    const resPresignedUrl = await fetchGeneratePresignedUrl({
                        body: {
                            path: 'tai-lieu',
                        },
                    })
                    const files = form.getFieldValue('files')
                    form.setFieldsValue({
                        files: files.map((item) => {
                            if (item.url === file.url) {
                                return {
                                    ...item,
                                    url: resPresignedUrl.fileName,
                                }
                            }
                            return item
                        }),
                    })
                    await axios.put(resPresignedUrl.url, file.file, {
                        onUploadProgress: (progressEvent) => {
                            const { loaded, total = 1 } = progressEvent
                            const percent = Math.floor((loaded * 100) / total)
                            // form.setFieldsValue({
                            //     files: files.map((item) => {
                            //         if (item.url === resPresignedUrl.fileName) {
                            //             return {
                            //                 ...item,
                            //                 progress: percent,
                            //             }
                            //         }
                            //         return item
                            //     }),
                            // })
                        },
                    })
                })
            )
        } catch (error) {}
    }

    const onFinish = async (values: DocumentFormType) => {
        try {
            const urls = await Promise.all(
                values.files.map(async (item) => {
                    // const response = await generatePresignedUrl({
                    //     data: {
                    //         path: 'chat-bot',
                    //     },
                    // })
                    // await fetch(response.data.url, {
                    //     method: 'PUT',
                    //     body: item.file,
                    // })
                    return {
                        url: item.file.name,
                        // url: response.data.fileName,
                        fileName: item.file.name,
                        fileType: item.file.type,
                        type: values.type,
                    }
                })
            )
            // await createMany({
            //     data: urls.map(({ fileName, url, fileType, type }) => ({
            //         uri: url,
            //         name: fileName,
            //         fileType,
            //         uploadedById: myProfile?.user.id,
            //         type,
            //     })),
            // })
            message.success('Thêm tài liệu thành công')
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
        >
            <div className="flex gap-4 justify-between">
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    className={cn('mt-4', selectedFile ? 'w-2/5' : 'w-full')}
                    initialValues={{
                        files: [],
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
                                className="flex items-center gap-2 mt-2 border border-gray-300 rounded-lg p-2 justify-between cursor-pointer hover:bg-gray-100"
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
                                    </span>
                                    {file.progress !== 0 &&
                                        file.progress !== 100 && (
                                            <Progress percent={file.progress} />
                                        )}
                                </div>
                                <CloseCircleOutlined
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // form.setFieldsValue({
                                        //     files: files.filter(
                                        //         (item) => item.url !== file.url
                                        //     ),
                                        // })
                                    }}
                                    className="text-lg cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                </Form>
                {selectedFile && (
                    <div className={cn('flex flex-col gap-2 w-3/5')}>
                        <span>
                            Xem trước tài liệu: {selectedFile.file.name}
                        </span>
                        <Input.TextArea
                            value={selectedFile.body}
                            className="mt-4 h-full"
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default AddTaiLieu
