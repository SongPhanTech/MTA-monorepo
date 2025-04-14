import { CardDocument } from '@components/commons/card-document'
import FormItem from '@components/commons/form-item'
import UploadDragAndDrop from '@components/commons/upload'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
import {
    useCreateManyDocument,
    useFindManyDocument,
    useUpdateDocument,
} from '@workspace/db/hooks'
import { Col, Divider, Form, message, Radio, Row, Select } from 'antd'
import { useSession } from 'next-auth/react'
type DocumentFormType = {
    type: $Enums.DocumentType
    files: Array<{
        url: string
        file: File
    }>
}
function Page() {
    const { mutateAsync: update } = useUpdateDocument()
    const { mutateAsync: createMany } = useCreateManyDocument()

    const [form] = Form.useForm<DocumentFormType>()
    const { data: myProfile } = useSession()

    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
        },
    })

    const onUpload = async (
        values: Array<{
            url: string
            file: File
        }>
    ) => {
        try {
            const urls = await Promise.all(
                values.map(async (item) => {
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
                    }
                })
            )
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
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
            await createMany({
                data: urls.map(({ fileName, url, fileType, type }) => ({
                    uri: url,
                    name: fileName,
                    fileType,
                    uploadedById: myProfile?.user.id,
                    type,
                })),
            })
            message.success('Thêm tài liệu thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <div>
            <span className="text-xl font-semibold text-gray-700">
                Thêm tài liệu
            </span>
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                className="mt-4"
            >
                <Col span={12}>
                    <FormItem form={form} name={'type'} label="Loại tài liệu">
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
                            isShowUpload={false}
                            onUpload={onUpload}
                        />
                    </FormItem>
                </Col>
            </Form>
            <Divider />
            <div className="flex flex-wrap gap-4 max-h-[100vh] overflow-y-scroll mt-4">
                {documents.map((item) => (
                    <CardDocument
                        key={item.id}
                        onDelete={async () => {
                            try {
                                await update({
                                    where: { id: item.id },
                                    data: {
                                        deletedAt: new Date(),
                                    },
                                })
                            } catch (error) {
                                message.error('Xóa tài liệu thất bại')
                            }
                        }}
                        {...item}
                    />
                ))}
            </div>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
