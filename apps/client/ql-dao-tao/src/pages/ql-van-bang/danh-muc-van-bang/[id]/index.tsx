import { queryClient } from '@api/index'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DiplomaType, DocumentFile } from '@workspace/db'
import {
    useFindManyDiplomaPlaceHolder,
    useFindUniqueDiplomaType,
    useUpdateDiplomaType,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, Form, message, Row } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export type PutDiplomaType = DiplomaType & {
    front?: [DocumentFile]
    back?: [DocumentFile]
}

dayjs.locale('vi')

export default function Diploma() {
    const [documentFront, setDocumentFront] = useState<DocumentFile | null>(null)
    const [documentBack, setDocumentBack] = useState<DocumentFile | null>(null)
    const [form] = Form.useForm<PutDiplomaType>()
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const diplomaTypeId = router.query.id as string

    const { data: initialData } = useFindUniqueDiplomaType(
        { where: { id: diplomaTypeId }, include: { front: true, back: true } },
        { enabled: !!diplomaTypeId }
    )

    const { data: keyInforData } = useFindManyDiplomaPlaceHolder(
        {
            where: {
                diplomaTypeId,
            },
        },
        { enabled: !!diplomaTypeId }
    )

    console.log(keyInforData)

    const { mutateAsync: updateDiplomaType } = useUpdateDiplomaType()

    async function handleFrontBackDiplomaType(output?: PutDiplomaType) {
        if (!output) return
        try {
            showSpinner()

            const updateData = {
                front: output.front
                    ? {
                          upsert: {
                              where: { id: output.front[0].id || '' },
                              create: {
                                  name: output.front[0].name,
                                  path: output.front[0].path,
                                  mimeType: output.front[0].mimeType,
                                  size: output.front[0].size,
                                  diplomaTypeFrontId: diplomaTypeId,
                              },
                              update: {
                                  name: output.front[0].name,
                                  path: output.front[0].path,
                                  mimeType: output.front[0].mimeType,
                                  size: output.front[0].size,
                              },
                          },
                      }
                    : undefined,
                back: output.back
                    ? {
                          upsert: {
                              where: { id: output.back[0].id || '' },
                              create: {
                                  name: output.back[0].name,
                                  path: output.back[0].path,
                                  mimeType: output.back[0].mimeType,
                                  size: output.back[0].size,
                                  diplomaTypeBackId: diplomaTypeId,
                              },
                              update: {
                                  name: output.back[0].name,
                                  path: output.back[0].path,
                                  mimeType: output.back[0].mimeType,
                                  size: output.back[0].size,
                              },
                          },
                      }
                    : undefined,
            }
            await updateDiplomaType({
                where: { id: diplomaTypeId },
                data: updateData,
            })

            message.success('Cập nhật thành công')
            queryClient.invalidateQueries({ queryKey: ['DiplomaType'] })
        } catch (_error) {
            console.error(_error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                front: initialData.front ? [initialData.front] : undefined,
                back: initialData.back ? [initialData.back] : undefined,
            })
            setDocumentFront(initialData.front)
            setDocumentBack(initialData.back)
        }
    }, [initialData])

    const renderPreviewOrUpload = (
        label: string,
        data: DocumentFile | null,
        titleForm: 'front' | 'back',
        relationType: 'diplomaTypeFrontId' | 'diplomaTypeBackId'
    ) => {
        return (
            <Col span={24}>
                <Divider orientation="left">{label}</Divider>
                {data ? (
                    <div className="overflow-scroll">
                        <div className="w-[297mm] relative">
                            <p className="absolute top-3 left-3 bg-white">[FULLNAME]</p>
                            <img
                                src={`${process.env.NEXT_PUBLIC_MINIO_ENDPOINT}/${data.path}`}
                                alt={data.name}
                                className="w-full"
                            />
                        </div>
                    </div>
                ) : (
                    <FormItem form={form} name={titleForm}>
                        <DocumentPaths
                            form={form}
                            data={[]}
                            relationId={diplomaTypeId ?? ''}
                            relationType={relationType}
                            titleForm={titleForm}
                            multiple={false}
                            accept="image/*,.pdf"
                        />
                    </FormItem>
                )}
            </Col>
        )
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[initialData?.code, initialData?.name, initialData?.englishName]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <div className="flex">
                        <Col span={7}>BÊN TRÁI</Col>

                        <div className="border-r border-[#D1D5DB] h-auto mx-2" />

                        <Col span={17}>
                            <Flex justify="end" className="mb-4">
                                <Button onClick={form.submit}>
                                    <BookPlus className="mr-1" />
                                    Lưu file phôi văn bằng
                                </Button>
                            </Flex>
                            <Form form={form} onFinish={handleFrontBackDiplomaType}>
                                {/* <FormItem form={form} name={'front'}>
                                    <DocumentPaths
                                        form={form}
                                        data={[]}
                                        relationId={diplomaTypeId ?? ''}
                                        relationType={'diplomaTypeFrontId'}
                                        titleForm={'front'}
                                        multiple={false}
                                        accept="image/*,.pdf"
                                    />
                                </FormItem> */}
                                <Row gutter={[0, 32]}>
                                    {renderPreviewOrUpload(
                                        'Phôi mặt trước (A4 nằm ngang)',
                                        documentFront,
                                        'front',
                                        'diplomaTypeFrontId'
                                    )}
                                    {renderPreviewOrUpload(
                                        'Phôi mặt sau (A4 nằm ngang)',
                                        documentBack,
                                        'back',
                                        'diplomaTypeBackId'
                                    )}
                                </Row>
                            </Form>
                        </Col>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

Diploma.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý văn bằng' },
                {
                    title: 'Danh mục văn bằng',
                    href: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DANH_MUC_VAN_BANG,
                },
                { title: 'quản lý phôi văn bằng' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
