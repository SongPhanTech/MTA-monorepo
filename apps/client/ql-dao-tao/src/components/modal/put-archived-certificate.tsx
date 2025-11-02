import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { DocumentFile } from '@workspace/db'
import type { ArchivedCertificate } from '@workspace/db/client'
import {
    useCreateArchivedCertificate,
    useFindManyCertificate,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useFindUniqueArchivedCertificate,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutArchivedCertificate = ArchivedCertificate & {
    documentFiles?: DocumentFile[]
    trainingCoursesId?: string
    fixedClassesId?: string
}
dayjs.locale('vi')

const PutCertificateArchivedModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutArchivedCertificate>()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
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
    const { data: trainingCourses = [] } = useFindManyTrainingCourse(
        {
            where: {
                trainingObjectTypeId,
            },
            orderBy: { name: 'asc' },
        },
        { enabled: !!trainingObjectTypeId }
    )

    // Lấy danh sách FixedClass
    const { data: fixedClasses = [] } = useFindManyFixedClass({
        where: {
            trainingCourseId: {
                in: trainingCourses.map((course) => course.id),
            },
        },
        // skip: trainingCourses.length ? 0 : 1,
    })
    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            showSpinner()
            if (id) {
                await updateArchivedCertificate({
                    data: {
                        studentId: rest.studentId,
                        certificateId: rest.certificateId,
                        finalScore: rest.finalScore || 0,
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
                        finalScore: rest.finalScore || 0,
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
    const fixedClassId = Form.useWatch('fixedClassesId', form)
    const trainingCoursesId = Form.useWatch('trainingCoursesId', form)
    const { data: studentData = [] } = useFindManyStudent(
        {
            where: {
                trainingObjectTypeId,
                ...(!!trainingCoursesId || !!fixedClassId
                    ? {
                          fixedClass: {
                              ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
                              ...(fixedClassId ? { id: fixedClassId } : {}),
                          },
                      }
                    : {}),
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
    const { data: initialData } = useFindUniqueArchivedCertificate(
        {
            where: { id: id },
            include: {
                documentFiles: true,
                student: {
                    include: {
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                issuedDate: dayjs(initialData.issuedDate),
                expiredDate: dayjs(initialData.expiredDate),
                documentFiles: initialData.documentFiles,
                trainingCoursesId: initialData?.student?.fixedClass?.trainingCourseId || '',
                fixedClassesId: initialData?.student?.fixedClassId || '',
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
            title={
                id
                    ? 'Chỉnh sửa đơn phiển điểm chứng chỉ cho môn môn học'
                    : 'Thêm mới đơn phiển điểm chứng chỉ cho môn môn học'
            }
            className="w-[700px]"
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
            {/* <Col span={24} className="mb-3">
                <FormItem form={form} name="finalScore" label="Điểm phiên cho môn học" required>
                    <InputNumber
                        min={1}
                        max={10}
                        className="w-full"
                        placeholder="Nhập điểm phiên cho môn học"
                    />
                </FormItem>
            </Col> */}
            <Col span={12} className="mb-3">
                <FormItem form={form} name="score" label="Điểm chứng chỉ" required>
                    <InputNumber
                        min={1}
                        className="w-full"
                        placeholder="Nhập điểm phiên cho môn học"
                    />
                </FormItem>
            </Col>
            <Col span={12} className="mb-3">
                <FormItem form={form} name="issuedBy" label="Nơi cấp chứng chỉ">
                    <Input className="w-full" placeholder="Nhập nơi cấp chứng chỉ" />
                </FormItem>
            </Col>
            <Col span={12} className="mb-3">
                <FormItem form={form} name="issuedDate" label="Ngày cấp">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={12} className="mb-3">
                <FormItem form={form} name="expiredDate" label="Ngày hết hạn">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="trainingCoursesId" label="Khoá">
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Chọn khoá"
                        options={trainingCourses.map((item) => ({
                            label: `${item?.code || ''} - ${item.name}`,
                            value: item.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="fixedClassesId" label="Lớp quản lý">
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Chọn lớp quản lý"
                        options={fixedClasses.map((item) => ({
                            label: `${item?.code || ''} - ${item.name}`,
                            value: item.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24} className="mb-4">
                <FormItem form={form} name="studentId" label="Học viên, sinh viên" required>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Chọn sinh viên"
                        options={studentData.map((item) => ({
                            label: `${item.userProfile?.code || ''} - ${item.userProfile?.lastName} ${item.userProfile?.firstName}`,
                            value: item.id,
                        }))}
                    />
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
