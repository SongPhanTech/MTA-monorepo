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
import { UploadIcon } from 'lucide-react'
import { UploadOutlined } from '@ant-design/icons'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import axios from 'axios'
import { getMinioUrl } from '@workspace/constant'
import type { UploadFile } from 'antd/es/upload/interface'

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
        if (!output.file || output.file.length === 0) {
            message.error('Vui lòng chọn một file để tải lên.')
            return
        }
        const uploadFile = output.file[0] as UploadFile

        if (!uploadFile.originFileObj) {
            message.error('Tệp tải lên không hợp lệ.')
            return
        }

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
                file: {
                    ...file,
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
                                file: {
                                    ...form.getFieldValue('file'),
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
                                },
                            }
                        )
                    form.setFieldsValue({
                        file: {
                            ...form.getFieldValue('file'),
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
            className="w-[55vw]"
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
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="documentPath"
                            label="Đường dẫn tài liệu"
                        >
                            <Input placeholder="Nhập đường dẫn tài liệu" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="renderPath"
                            label="Đường dẫn tài liệu kết xuất"
                        >
                            <Input placeholder="Nhập đường dẫn tài liệu kết xuất" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="file"
                            label="File chương trình chi tiết"
                            // required
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                return Array.isArray(e) ? e : e?.fileList
                            }}
                        >
                            <Upload
                                beforeUpload={(file) => {
                                    const isAllowedType =
                                        file.type === 'application/pdf' ||
                                        file.type === 'application/msword' || // .doc
                                        file.type ===
                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx

                                    if (!isAllowedType) {
                                        message.error(
                                            'Chỉ được phép tải lên file Word (.doc, .docx) hoặc PDF (.pdf)'
                                        )
                                        return Upload.LIST_IGNORE
                                    }
                                    return false // Không upload tự động
                                }}
                                maxCount={1}
                                accept=".doc,.docx,.pdf"
                            >
                                <Button icon={<UploadOutlined />}>
                                    Chọn file Word hoặc PDF
                                </Button>
                            </Upload>
                        </FormItem>
                    </Col>
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
