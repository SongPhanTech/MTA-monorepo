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
    useCountStudent,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, InputNumber, message, Typography, Divider, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'

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
    const [allUploadedFiles, setAllUploadedFiles] = useState<DocumentFile[]>([])
    const [uploadingCount, setUploadingCount] = useState<number>(0)
    const [selectedStudentKeys, setSelectedStudentKeys] = useState<React.Key[]>([])
    const [studentCurrentPage, setStudentCurrentPage] = useState(1)
    const [studentPageSize, setStudentPageSize] = useState(DEFAULT_PAGINATE_SIZE)
    const [form] = Form.useForm<PutArchivedCertificate>()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutCertificateArchivedModal',
        onClose: () => {
            form.resetFields()
            setSelectedStudentKeys([])
            setStudentCurrentPage(1)
        },
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
    const fixedClassId = Form.useWatch('fixedClassesId', form)
    const trainingCoursesId = Form.useWatch('trainingCoursesId', form)
    const uploadedFiles = Form.useWatch('allDocumentFiles', form)

    // Cập nhật allUploadedFiles khi uploadedFiles thay đổi
    useEffect(() => {
        if (uploadedFiles) {
            setAllUploadedFiles(uploadedFiles)
        } else {
            setAllUploadedFiles([])
        }
    }, [uploadedFiles])

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

    // Build where condition for student query
    const studentWhere = useMemo(() => {
        if (!trainingCoursesId && !fixedClassId) return null
        return {
            fixedClass: {
                ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
                ...(fixedClassId ? { id: fixedClassId } : {}),
            },
        }
    }, [trainingCoursesId, fixedClassId])

    // Lấy danh sách sinh viên với phân trang
    const { data: studentData = [] } = useFindManyStudent(
        {
            where: studentWhere || {},
            include: {
                userProfile: true,
                fixedClass: true,
            },
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
            take: studentPageSize,
            skip: (studentCurrentPage - 1) * studentPageSize,
        },
        { enabled: !!trainingObjectTypeId && !!studentWhere }
    )

    // Đếm tổng số sinh viên
    const { data: studentCount = 0 } = useCountStudent(
        {
            where: studentWhere || {},
        },
        { enabled: !!trainingObjectTypeId && !!studentWhere }
    )

    // Lấy tất cả sinh viên đã chọn (để hiển thị thông tin và xử lý)
    const { data: allSelectedStudents = [] } = useFindManyStudent(
        {
            where: {
                id: { in: selectedStudentKeys as string[] },
            },
            include: {
                userProfile: true,
            },
        },
        { enabled: selectedStudentKeys.length > 0 }
    )

    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            // Kiểm tra nếu đang upload file
            if (uploadingCount > 0) {
                message.warning(`Vui lòng đợi ${uploadingCount} file đang upload hoàn thành`)
                return
            }

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
                // Xử lý thêm mới cho nhiều sinh viên
                const studentIds = selectedStudentKeys as string[]

                if (!studentIds || studentIds.length === 0) {
                    message.warning('Vui lòng chọn ít nhất một học viên')
                    hideSpinner()
                    return
                }

                const createdCertificates: any[] = []

                // Tạo chứng chỉ cho từng sinh viên với file riêng
                for (const studentId of studentIds) {
                    const student = allSelectedStudents.find((s) => s.id === studentId)
                    const studentCode = student?.userProfile?.code || ''

                    // Lấy file có tên chứa mã sinh viên
                    const studentFiles = allUploadedFiles.filter((file: DocumentFile) =>
                        file.name.toLowerCase().includes(studentCode.toLowerCase())
                    )

                    const result = await createArchivedCertificate({
                        data: {
                            studentId,
                            certificateId: rest.certificateId,
                            finalScore: rest.finalScore || 0,
                            score: rest.score,
                            issuedBy: rest.issuedBy,
                            issuedDate: rest.issuedDate,
                            expiredDate: rest.expiredDate,
                            status: 'PENDING',
                            documentFiles: {
                                create: studentFiles.map((file: any) => ({
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                })),
                            },
                        },
                    })
                    if (result) {
                        createdCertificates.push({ id: result.id, studentId })
                    }
                }

                message.success(
                    `Đã thêm mới ${createdCertificates.length} chứng chỉ cho ${studentIds.length} học viên`
                )

                // Nếu có chọn lớp môn học để phiên điểm cho tất cả sinh viên
                if (selectedSubjectClassIds.length > 0 && studentIds.length > 0) {
                    const records: any[] = []

                    studentIds.forEach((studentId: string) => {
                        selectedSubjectClassIds.forEach((subjectClassId) => {
                            const subjectClass = availableSubjectClasses.find(
                                (sc: any) => sc.id === subjectClassId
                            )

                            if (subjectClass) {
                                records.push({
                                    studentId,
                                    subjectClassId,
                                    subjectVersionId: subjectClass.subjectId,
                                    finalScore: subjectClass.finalScore,
                                    examScore: subjectClass.finalScore,
                                    exempted: true,
                                })
                            }
                        })
                    })

                    if (records.length > 0) {
                        await createManyStudentSubjectScore({
                            data: records,
                        })
                        message.success(
                            `Đã phiên điểm ${records.length} bản ghi cho ${studentIds.length} học viên`
                        )
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
                return
            }

            // Nếu có chọn lớp môn học để phiên điểm (cho trường hợp update)
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

    // Tính toán trạng thái upload cho từng sinh viên dựa trên tên file
    const studentUploadStatus = useMemo(() => {
        if (
            !selectedStudentKeys ||
            selectedStudentKeys.length === 0 ||
            allUploadedFiles.length === 0
        ) {
            return {}
        }

        const status: Record<string, { count: number; files: DocumentFile[] }> = {}

        selectedStudentKeys.forEach((studentId) => {
            const student = allSelectedStudents.find((s) => s.id === studentId)
            const studentCode = student?.userProfile?.code || ''

            // Tìm file có tên chứa mã sinh viên (không phân biệt hoa thường)
            const matchedFiles = allUploadedFiles.filter((file: DocumentFile) =>
                file.name.toLowerCase().includes(studentCode.toLowerCase())
            )

            status[studentId as string] = {
                count: matchedFiles.length,
                files: matchedFiles,
            }
        })

        return status
    }, [selectedStudentKeys, allUploadedFiles, allSelectedStudents])

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
            setAllUploadedFiles([])
            setUploadingCount(0)
            setSelectedStudentKeys([])
        }
    }, [initialData])

    const subjectClassRowSelection = {
        selectedRowKeys: selectedSubjectClassIds,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedSubjectClassIds(selectedKeys as string[])
        },
    }

    // Row selection cho bảng sinh viên
    const studentRowSelection = {
        selectedRowKeys: selectedStudentKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedStudentKeys(newSelectedRowKeys)
        },
        preserveSelectedRowKeys: true, // Giữ lại selection khi chuyển trang
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
                    ? 'Chỉnh sửa đơn phiên điểm chứng chỉ cho môn môn học'
                    : 'Thêm mới đơn phiên điểm chứng chỉ cho môn môn học'
            }
            className="w-[80vw]"
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
                <FormItem form={form} name="issuedBy" label="Nơi cấp chứng chỉ" required>
                    <Input className="w-full" placeholder="Nhập nơi cấp chứng chỉ" />
                </FormItem>
            </Col>
            <Col span={12} className="mb-3">
                <FormItem form={form} name="issuedDate" label="Ngày cấp" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={12} className="mb-3">
                <FormItem form={form} name="expiredDate" label="Ngày hết hạn">
                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                </FormItem>
            </Col>
            <Col span={12} className="mb-4">
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
            <Col span={12} className="mb-4">
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

            {/* Bảng chọn sinh viên với phân trang - chỉ hiện khi thêm mới */}
            {!id && (
                <Col span={24} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <Title level={5} className="m-0">
                            Chọn học viên, sinh viên
                        </Title>
                        {selectedStudentKeys.length > 0 && (
                            <Tag color="blue">Đã chọn: {selectedStudentKeys.length} học viên</Tag>
                        )}
                    </div>
                    {!studentWhere ? (
                        <div className="text-gray-500 text-center py-4 border rounded">
                            Vui lòng chọn Khoá hoặc Lớp quản lý để hiển thị danh sách sinh viên
                        </div>
                    ) : (
                        <Table
                            rowKey="id"
                            dataSource={studentData}
                            rowSelection={studentRowSelection}
                            size="small"
                            bordered
                            scroll={{ y: 300 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    align: 'center',
                                    render: (_, __, index) =>
                                        index + 1 + (studentCurrentPage - 1) * studentPageSize,
                                },
                                {
                                    title: 'MSSV',
                                    dataIndex: ['userProfile', 'code'],
                                    width: 120,
                                    align: 'center',
                                },
                                {
                                    title: 'Họ và tên',
                                    align: 'left',
                                    render: (_, record) =>
                                        `${record?.userProfile?.lastName || ''} ${record?.userProfile?.firstName || ''}`.trim(),
                                },
                                {
                                    title: 'Lớp',
                                    dataIndex: ['fixedClass', 'name'],
                                    width: 150,
                                    align: 'center',
                                },
                            ]}
                            pagination={{
                                current: studentCurrentPage,
                                pageSize: studentPageSize,
                                total: studentCount,
                                showSizeChanger: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} / ${total} sinh viên`,
                                onChange: (page, pageSize) => {
                                    setStudentCurrentPage(page)
                                    setStudentPageSize(pageSize)
                                },
                            }}
                        />
                    )}
                </Col>
            )}

            {/* Select đơn sinh viên cho trường hợp edit */}
            {id && (
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
                            filterOption={(input, option) =>
                                String(option?.label ?? '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                        />
                    </FormItem>
                </Col>
            )}

            {id && (
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
            )}

            {!id && selectedStudentKeys && selectedStudentKeys.length > 0 && (
                <Col span={24} className="mb-3">
                    <div>
                        <div className="mb-2">
                            <strong>Upload minh chứng chứng chỉ (nhiều file cùng lúc)</strong>
                        </div>
                        <FormItem form={form} name={'allDocumentFiles' as any} className="mb-3">
                            <DocumentPaths
                                form={form}
                                data={[]}
                                relationId=""
                                relationType="curriculumId"
                                titleForm="allDocumentFiles"
                                multiple={true}
                                text="Kéo thả hoặc click để upload nhiều file cùng lúc (PDF, DOC, JPG, PNG)"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onUploadingChange={(count) => setUploadingCount(count)}
                            />
                        </FormItem>

                        <div className="mt-4">
                            <div className="mb-2">
                                <strong>Trạng thái upload</strong>
                                <span className="text-gray-500 text-xs ml-2">
                                    (Tổng: {allUploadedFiles.length} file đã upload)
                                </span>
                                {uploadingCount > 0 && (
                                    <span className="text-orange-500 text-xs ml-2">
                                        Đang upload {uploadingCount} file...
                                    </span>
                                )}
                            </div>
                            <Table
                                dataSource={allSelectedStudents.map((student) => ({
                                    key: student.id,
                                    studentId: student.id,
                                    studentCode: student?.userProfile?.code || 'N/A',
                                    studentName:
                                        `${student?.userProfile?.lastName || ''} ${student?.userProfile?.firstName || ''}`.trim(),
                                }))}
                                pagination={false}
                                size="small"
                                bordered
                                scroll={{ y: 200 }}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        align: 'center',
                                        render: (_, __, index) => index + 1,
                                    },
                                    {
                                        title: 'MSSV',
                                        dataIndex: 'studentCode',
                                        width: 120,
                                        align: 'center',
                                    },
                                    {
                                        title: 'Họ và tên',
                                        dataIndex: 'studentName',
                                        align: 'left',
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'studentId',
                                        width: 180,
                                        align: 'center',
                                        render: (studentId: string) => {
                                            const status = studentUploadStatus[studentId]
                                            if (!status || status.count === 0) {
                                                return (
                                                    <span className="text-red-500 font-medium">
                                                        Chưa có file
                                                    </span>
                                                )
                                            }
                                            return (
                                                <span className="text-green-600 font-medium">
                                                    Đã có {status.count} file
                                                </span>
                                            )
                                        },
                                    },
                                ]}
                            />
                        </div>

                        <p className="text-blue-500 text-xs mt-2">
                            <strong>Hướng dẫn:</strong> Tên file phải chứa MSSV để hệ thống tự động
                            nhận diện.
                        </p>
                    </div>
                </Col>
            )}

            {!id && selectedCertificateId && availableSubjectClasses.length > 0 && (
                <>
                    <Divider />
                    <Col span={24} className="mb-3">
                        <Title level={5}>Phiên điểm cho lớp môn học (Tùy chọn)</Title>
                        <p className="text-gray-500 text-sm mb-3">
                            Chọn các lớp môn học để tự động phiên điểm khi thêm chứng chỉ cho{' '}
                            {selectedStudentKeys?.length || 0} học viên đã chọn
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
