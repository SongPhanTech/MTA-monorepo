import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ArchivedAward, DocumentFile } from '@workspace/db/client'
import {
    useCreateArchivedAward,
    useFindManyAward,
    useFindManyStudent,
    useFindUniqueArchivedAward,
    useUpdateArchivedAward,
} from '@workspace/db/hooks'
import { Col, Form, message, Select as AntdSelect, DatePicker, InputNumber } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Select from '@components/commons/select'
import DocumentPaths from '@components/commons/documentPaths'
import { useTrainingObjectTypeStore } from '@workspace/ui'
export type PutArchivedAward = ArchivedAward & {
    documentFiles?: DocumentFile[]
    bonusScore: number
}
dayjs.locale('vi')
const PutArchivedAwardModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutArchivedAward>()
    const [filters, setFilters] = useState({
        textSearch: '',
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutArchivedAwardModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedAward } = useCreateArchivedAward()
    const { mutateAsync: updateArchivedAward } = useUpdateArchivedAward()
    const { data: awardData = [] } = useFindManyAward()
    const { data: studentData = [] } = useFindManyStudent(
        {
            where: {
                trainingObjectType: {
                    id: trainingObjectTypeId,
                },
                ...(filters.textSearch &&
                    filters.textSearch !== '' && {
                        userProfile: {
                            OR: [
                                {
                                    firstName: {
                                        contains: filters.textSearch,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    lastName: {
                                        contains: filters.textSearch,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    code: {
                                        contains: filters.textSearch,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                    }),
            },
            include: {
                userProfile: true,
            },
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
        },
        { enabled: !!trainingObjectTypeId }
    )
    async function onOk({ ...rest }: PutArchivedAward) {
        try {
            showSpinner()
            if (id) {
                await updateArchivedAward({
                    data: {
                        awardId: rest.awardId,
                        studentId: rest.studentId,
                        date: rest.date,
                        bonusScore: rest?.bonusScore || 0,
                        documentFiles: {
                            upsert: (rest.documentFiles || [])
                                .filter((file) => !!file.id)
                                .map((file) => ({
                                    where: { id: file.id },
                                    create: {
                                        name: file.name,
                                        path: file.path,
                                        mimeType: file.mimeType,
                                        size: file.size,
                                        curriculum: { connect: { id } },
                                    },
                                    update: {
                                        name: file.name,
                                        path: file.path,
                                        mimeType: file.mimeType,
                                        size: file.size,
                                    },
                                })),
                            create: (rest.documentFiles || [])
                                .filter((file) => !file.id)
                                .map((file) => ({
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                })),
                            disconnect: document
                                .filter(
                                    (existing) =>
                                        !rest.documentFiles?.some((f) => f.id === existing.id)
                                )
                                .map((file) => ({ id: file.id })),
                        },
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createArchivedAward({
                    data: {
                        awardId: rest.awardId,
                        studentId: rest.studentId,
                        date: rest.date,
                        bonusScore: rest?.bonusScore || 0,
                        documentFiles: {
                            create: (rest.documentFiles || []).map((file) => ({
                                name: file.name,
                                path: file.path,
                                mimeType: file.mimeType,
                                size: file.size,
                            })),
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['ArchivedAward'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialData } = useFindUniqueArchivedAward(
        {
            where: { id },
            include: {
                documentFiles: true,
            },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                documentFiles: initialData.documentFiles,
            })
            setDocument(initialData.documentFiles)
        } else {
            form.setFieldsValue({
                active: true,
                documentFiles: [],
            })
            setDocument([])
        }
    }, [initialData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa điểm oplympic' : 'Thêm mới điểm oplympic'}
            className="w-[700px]"
        >
            <Col span={24} className="mb-4">
                <FormItem form={form} name="awardId" label="Giải thưởng" required>
                    <Select
                        allowClear
                        style={{ width: '100%' }}
                        placeholder="Chọn giải thưởng"
                        options={awardData.map((item) => ({
                            label: item.name,
                            value: item.id,
                            bonusScore: item?.bonusScore,
                        }))}
                        onChange={(value, option: any) => {
                            form.setFieldsValue({
                                bonusScore: option.bonusScore,
                            })
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="bonusScore" label="Điểm cộng" required>
                    <InputNumber disabled min={1} className="w-full" placeholder="Nhập điểm" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="studentId" label="Học viên, sinh viên" required>
                    <AntdSelect
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Chọn sinh viên"
                        options={studentData.map((item) => ({
                            label: `${item.userProfile?.code || ''} - ${item.userProfile?.lastName} ${item.userProfile?.firstName} `,
                            value: item.id,
                        }))}
                        onSearch={(value) => {
                            console.log(value)
                            setFilters({ ...filters, textSearch: value })
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="date" label="Thời gian nhận giải thưởng">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="documentFiles" label="Minh chứng">
                    <DocumentPaths
                        form={form}
                        data={document}
                        relationId={id ?? ''}
                        relationType="curriculumId"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutArchivedAwardModal
