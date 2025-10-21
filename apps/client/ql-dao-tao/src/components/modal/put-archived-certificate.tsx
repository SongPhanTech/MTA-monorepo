import { queryClient } from '@api/index'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { DocumentFile } from '@workspace/db'
import type { ArchivedCertificate } from '@workspace/db/client'
import {
    useCreateArchivedCertificate,
    useFindManyCertificate,
    useFindManySubject,
    useFindUniqueArchivedCertificate,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { Col, DatePicker, Form, Input, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutArchivedCertificate = ArchivedCertificate & {
    documentFiles?: DocumentFile[]
}
dayjs.locale('vi')

const PutCertificateArchivedModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutArchivedCertificate>()
    const [_targetDisabled, setTargetDisabled] = useState(true)
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutCertificateArchivedModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedCertificate } = useCreateArchivedCertificate()
    const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
    const { data: certificate = [] } = useFindManyCertificate()
    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            showSpinner()
            if (id) {
                await updateArchivedCertificate({
                    data: {
                        studentId: rest.studentId,
                        certificateId: rest.certificateId,
                        finalScore: rest.finalScore,
                        score: rest.score,
                        issuedBy: rest.issuedBy,
                        issuedDate: rest.issuedDate,
                        expiredDate: rest.expiredDate,
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
                    where: { id: id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createArchivedCertificate({
                    data: {
                        studentId: rest.studentId,
                        certificateId: rest.certificateId,
                        finalScore: rest.finalScore,
                        score: rest.score,
                        issuedBy: rest.issuedBy,
                        issuedDate: rest.issuedDate,
                        expiredDate: rest.expiredDate,
                        status: 'PENDING',
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
                queryKey: ['ArchivedCertificate'],
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
    const { data: subjectData = [] } = useFindManySubject()
    const { data: initialData } = useFindUniqueArchivedCertificate(
        {
            where: { id: id },
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
            title={id ? 'Chỉnh sửa đơn phiển điểm chứng chỉ cho môn môn học' : 'Thêm mới đơn phiển điểm chứng chỉ cho môn môn học'}
            className="w-[600px]"
        >
            <Col span={24} className="mb-3">
                <FormItem form={form} name="certificateId" label="Chứng chỉ" required>
                    <Select
                        options={certificate.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        placeholder="Chọn chứng chỉ"
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
                <FormItem form={form} name="finalScore" label="Điểm phiên cho môn học" required>
                    <InputNumber
                        min={1}
                        max={10}
                        className="w-full"
                        placeholder="Nhập điểm phiên cho môn học"
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
                <FormItem form={form} name="score" label="Điểm chứng chỉ" required>
                    <InputNumber
                        min={1}
                        className="w-full"
                        placeholder="Nhập điểm phiên cho môn học"
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
                <FormItem form={form} name="issuedBy" label="Nơi cấp chứng chỉ">
                    <Input className="w-full" placeholder="Nhập nơi cấp chứng chỉ" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
                <FormItem form={form} name="issuedDate" label="Ngày cấp">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
                <FormItem form={form} name="expiredDate" label="Ngày hết hạn">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-3">
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

export default PutCertificateArchivedModal
