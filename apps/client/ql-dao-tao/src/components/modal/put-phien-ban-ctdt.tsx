import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    CurriculumVersionSubject,
    Curriculum,
    CurriculumVersion,
    $Enums,
} from '@workspace/db'
import {
    useCreateCurriculumVersion,
    useFindUniqueCurriculumVersion,
    useFindManySchoolYear,
    useFindManyCurriculumVersion,
    useUpdateCurriculumVersion,
    useFindManyCurriculum,
} from '@workspace/db/hooks'
import {
    Col,
    Form,
    Input,
    message,
    TreeSelect,
    Steps,
    Upload,
    Button,
} from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutCurriculumVersion = CurriculumVersion
import { buildOrgTree } from '@lib/utils'

import 'dayjs/locale/vi'
import MonHocChuongTrinhPage from '@components/sub-pages/mon-hoc-chuong-trinh'
import { UploadOutlined } from '@ant-design/icons'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import axios from 'axios'
import { getMinioUrl } from '@workspace/constant'
import UploadDragAndDrop, { FileUploadIcon } from '@components/commons/upload'

dayjs.locale('vi')
type PutPutCurriculumVersionFile = PutCurriculumVersion & {
    file: File[]
}

const PutCurriculumVersionModal = () => {
    const [form] = Form.useForm<PutPutCurriculumVersionFile>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCurriculumVersionModal.name,
        onClose: form.resetFields,
    })
    const [curriculumVersionSubject, setCurriculumVersionSubject] =
        useState<CurriculumVersionSubject[]>()
    const { showSpinner, hideSpinner } = useSpinner()
    const { data: curriculumData = [], refetch: refetchCurriculum } =
        useFindManyCurriculum()
    const { mutateAsync: createCurriculumVersion } =
        useCreateCurriculumVersion()
    const { mutateAsync: updateCurriculumVersion } =
        useUpdateCurriculumVersion()
    async function onOk(output?: PutPutCurriculumVersionFile) {
        if (!output) return
        console.log(output)

        try {
            showSpinner()
            if (id) {
                await updateCurriculumVersion({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        curriculumId: output.curriculumId,
                        information: output.information,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculumVersion({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        curriculumId: output.curriculumId,
                        information: output.information,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['CurriculumVersion'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueCurriculumVersion({
        where: { id },
        include: {
            curriculumVersionSubject: true,
        },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
            setCurriculumVersionSubject(level.curriculumVersionSubject ?? [])
        }
    }, [level])
    const [current, setCurrent] = useState(0)

    const next = () => setCurrent(current + 1)
    const prev = () => setCurrent(current - 1)
    const steps = [
        {
            title: 'Thông tin chung',
            content: 'First-content',
        },
        {
            title: 'Nội dung chi tiết',
            content: 'Second-content',
        },
    ]
    const onChange = (value: number) => {
        setCurrent(value)
    }
    const items = steps.map((item) => ({ key: item.title, title: item.title }))
    const file = Form.useWatch('file', form) || {}

    const onUpload = async (file: { url: string; file: File }) => {
        try {
            const id = crypto.randomUUID()
            const extension = file.file?.name?.split('.').pop() || ''

            // Gọi API lấy presigned URL
            const resPresignedUrl = await fetchGeneratePresignedUrl({
                body: {
                    path: 'tai-lieu',
                    extension,
                },
            })

            // Upload file lên MinIO
            await axios.put(resPresignedUrl.url, file.file, {
                onUploadProgress: (progressEvent) => {
                    const { loaded, total = 1, estimated = 0 } = progressEvent
                    const percent = Math.floor((loaded * 100) / total)
                    form.setFieldsValue({
                        file: {
                            ...file,
                            id,
                            url: resPresignedUrl.fileName,
                            progress: percent,
                            timeLeft: estimated,
                            body: '',
                        },
                    })
                },
            })

            // Gọi API đọc nội dung tài liệu
            // const resReaderDocument =
            //     await fetchReadDocumentContentDocumentDocumentReaderGet({
            //         queryParams: {
            //             uri_file: getMinioUrl(resPresignedUrl.fileName),
            //         },
            //     })

            // form.setFieldsValue({
            //     file: {
            //         ...form.getFieldValue('file'),
            //         body: resReaderDocument.body,
            //     },
            // })
        } catch (error) {
            console.error('Upload error', error)
            message.error('Upload thất bại')
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa phiên bản chương trình đào tạo'
                    : 'Thêm mới phiên bản chương trình đào tạo'
            }
            className="w-[50vw]"
        >
            {id && (
                <Steps
                    current={current}
                    onChange={onChange}
                    items={items}
                    className="mb-4"
                />
            )}

            {(!id || current === 0) && (
                <>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="name"
                            label="Tên phiên bản"
                            required
                        >
                            <Input placeholder="Nhập tên phiên bản" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="curriculumId"
                            label="Chương trình đào tạo"
                            required
                        >
                            <Select
                                placeholder="Chọn chương trình đào tạo"
                                options={curriculumData.map((i: Curriculum) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="startDate"
                            label="Ngày bắt đầu"
                            required
                        >
                            <DatePicker
                                format="DD/MM/YYYY"
                                className="w-full"
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="endDate"
                            label="Ngày kết thúc"
                        >
                            <DatePicker
                                format="DD/MM/YYYY"
                                className="w-full"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="information"
                            label="Thông tin"
                            required
                        >
                            <Input.TextArea placeholder="Nhập thông tin" />
                        </FormItem>
                    </Col>
                    <FormItem form={form} name="documentPath">
                        <Input type="hidden" />
                    </FormItem>
                    <FormItem form={form} name="renderPath">
                        <Input type="hidden" />
                    </FormItem>
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="file"
                            label="Tệp tài liệu"
                            // required
                            valuePropName="fileList"
                            getValueFromEvent={(e) =>
                                Array.isArray(e) ? e : e?.fileList
                            }
                        >
                            <Upload
                                maxCount={1}
                                accept=".doc,.docx,.pdf"
                                customRequest={async ({
                                    file,
                                    onSuccess,
                                    onError,
                                    onProgress,
                                }) => {
                                    try {
                                        const extension =
                                            file.name.split('.').pop() || ''
                                        const id = crypto.randomUUID()

                                        // Gọi API lấy presigned URL
                                        const resPresignedUrl =
                                            await fetchGeneratePresignedUrl({
                                                body: {
                                                    path: 'phien-ban-chuong-trinh-dao-tao',
                                                    extension,
                                                },
                                            })

                                        // Upload file lên MinIO
                                        await axios.put(
                                            resPresignedUrl.url,
                                            file,
                                            {
                                                headers: {
                                                    'Content-Type': file.type,
                                                },
                                                onUploadProgress: (
                                                    progressEvent
                                                ) => {
                                                    const {
                                                        loaded,
                                                        total = 1,
                                                    } = progressEvent
                                                    const percent = Math.floor(
                                                        (loaded * 100) / total
                                                    )
                                                    onProgress?.({ percent })
                                                },
                                            }
                                        )
                                        form.setFieldsValue({
                                            documentPath:
                                                resPresignedUrl.fileName,
                                            renderPath: resPresignedUrl.url,
                                        })
                                        console.log(
                                            resPresignedUrl.fileName,
                                            'nè'
                                        )
                                        onSuccess?.('OK')
                                    } catch (err) {
                                        console.error('Upload thất bại:', err)
                                        message.error('Tải tệp lên thất bại')
                                        onError?.(err)
                                    }
                                }}
                                beforeUpload={(file) => {
                                    const isAcceptedType =
                                        file.type ===
                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
                                        file.type === 'application/msword' || // .doc
                                        file.type === 'application/pdf' // .pdf

                                    if (!isAcceptedType) {
                                        message.error(
                                            'Chỉ được phép tải lên file Word hoặc PDF (.doc, .docx, .pdf)'
                                        )
                                        return Upload.LIST_IGNORE
                                    }

                                    return true // Cho phép upload tiếp
                                }}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Chọn file Word/PDF
                                </Button>
                            </Upload>
                        </FormItem>
                    </Col>
                    {/* {form.getFieldValue('documentPath') && (
                        <div className="mt-2 text-sm text-blue-500">
                            <a
                                href={getMinioUrl(
                                    form.getFieldValue('documentPath')
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Xem tài liệu đã upload
                            </a>
                        </div>
                    )} */}
                </>
            )}
            {id && current === 1 && (
                <div className="w-full">
                    <MonHocChuongTrinhPage
                        // data={curriculumVersionSubject}
                        curriculumVersionId={id}
                    />
                </div>
            )}
        </PutFormModal>
    )
}

export default PutCurriculumVersionModal
