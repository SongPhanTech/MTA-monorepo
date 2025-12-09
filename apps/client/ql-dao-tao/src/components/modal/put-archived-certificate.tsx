import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
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
    useFindManySubjectClass,
    useCreateManyStudentSubjectScore,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, InputNumber, message, Typography, Divider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutArchivedCertificate = ArchivedCertificate & {
    documentFiles?: DocumentFile[]
    trainingCoursesId?: string
    fixedClassesId?: string
}
dayjs.locale('vi')

const { Title } = Typography

const PutCertificateArchivedModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [selectedSubjectClassIds, setSelectedSubjectClassIds] = useState<string[]>([])
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
    const { mutateAsync: createManyStudentSubjectScore } = useCreateManyStudentSubjectScore()
    const { data: certificate = [] } = useFindManyCertificate({
        include: {
            subjects: {
                include: {
                    subject: true,
                },
            },
        },
    })
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

    // Lấy danh sách SubjectClass
    const { data: subjectClasses = [] } = useFindManySubjectClass({
        include: {
            subject: {
                include: {
                    subject: true,
                },
            },
            semester: true,
        },
    })

    // Lấy certificateId từ form
    const selectedCertificateId = Form.useWatch('certificateId', form)

    // Lấy danh sách lớp môn học có thể phiên điểm từ chứng chỉ đã chọn
    const availableSubjectClasses = useMemo(() => {
        if (!selectedCertificateId) return []
        const selectedCertificate = certificate.find((c: any) => c.id === selectedCertificateId)
        
        if (!selectedCertificate?.subjects) return []
        
        // Lấy danh sách subjectId từ chứng chỉ
        const certificateSubjectIds = selectedCertificate.subjects.map((cs: any) => cs.subjectId)
        
        // Lọc SubjectClass có subject thuộc chứng chỉ
        const filteredClasses = subjectClasses.filter((sc: any) => 
            certificateSubjectIds.includes(sc.subject?.subjectId)
        )
        
        // Map với điểm phiên từ chứng chỉ
        return filteredClasses.map((sc: any) => {
            const certSubject = selectedCertificate.subjects.find(
                (cs: any) => cs.subjectId === sc.subject?.subjectId
            )
            
            return {
                ...sc,
                finalScore: certSubject?.finalScore || 0,
            }
        })
    }, [selectedCertificateId, certificate, subjectClasses])
    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            showSpinner()
            let archivedCertificateId = id
            
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
                const result = await createArchivedCertificate({
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
                archivedCertificateId = result.id
                message.success('Thêm mới thành công')
            }

            // Nếu có chọn lớp môn học để phiên điểm
            if (selectedSubjectClassIds.length > 0 && rest.studentId) {
                const records: any[] = []
                
                selectedSubjectClassIds.forEach((subjectClassId) => {
                    const subjectClass = availableSubjectClasses.find(
                        (sc: any) => sc.id === subjectClassId
                    )

                    if (subjectClass) {
                        records.push({
                            studentId: rest.studentId,
                            subjectClassId,
                            subjectVersionId: subjectClass.subjectId,
                            finalScore: subjectClass.finalScore,
                            examScore: subjectClass.finalScore,
                            exempted: true,
                        })
                    }
                })

                if (records.length > 0) {
                    await createManyStudentSubjectScore({
                        data: records,
                    })
                    message.success(`Đã phiên điểm ${records.length} lớp môn học`)
                }
            }

            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['ArchivedCertificate'],
            })
            queryClient.invalidateQueries({
                queryKey: ['StudentSubjectScore'],
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
            setSelectedSubjectClassIds([])
        }
    }, [initialData])

    const subjectClassRowSelection = {
        selectedRowKeys: selectedSubjectClassIds,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedSubjectClassIds(selectedKeys as string[])
        },
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
                    ? 'Chỉnh sửa đơn phiển điểm chứng chỉ cho môn môn học'
                    : 'Thêm mới đơn phiển điểm chứng chỉ cho môn môn học'
            }
            className="w-[1000px]"
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

            {!id && selectedCertificateId && availableSubjectClasses.length > 0 && (
                <>
                    <Divider />
                    <Col span={24} className="mb-3">
                        <Title level={5}>Phiên điểm cho lớp môn học (Tùy chọn)</Title>
                        <p className="text-gray-500 text-sm mb-3">
                            Chọn các lớp môn học để tự động phiên điểm khi thêm chứng chỉ
                        </p>
                        <Table
                            rowKey="id"
                            dataSource={availableSubjectClasses}
                            pagination={false}
                            rowSelection={subjectClassRowSelection}
                            size="small"
                            columns={[
                                {
                                    title: 'STT',
                                    width: 50,
                                    align: 'center',
                                    render: (_, __, index) => index + 1,
                                },
                                {
                                    title: 'Mã MH',
                                    dataIndex: ['subject', 'code'],
                                    align: 'center',
                                    width: 90,
                                },
                                {
                                    title: 'Tên môn học',
                                    dataIndex: ['subject', 'subject', 'name'],
                                    align: 'left',
                                },
                                {
                                    title: 'Mã lớp',
                                    dataIndex: 'name',
                                    align: 'center',
                                    width: 90,
                                },
                                {
                                    title: 'Học kỳ',
                                    dataIndex: ['semester', 'name'],
                                    align: 'center',
                                    width: 110,
                                },
                                {
                                    title: 'Điểm phiên',
                                    dataIndex: 'finalScore',
                                    align: 'center',
                                    width: 90,
                                    render: (score) => (
                                        <strong className="text-blue-600">{score}</strong>
                                    ),
                                },
                            ]}
                        />
                    </Col>
                </>
            )}
        </PutFormModal>
    )
}

export default PutCertificateArchivedModal
