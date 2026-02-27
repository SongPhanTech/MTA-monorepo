import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import type { DocumentFile } from '@workspace/db'
import {
    useCountStudent,
    useCreateArchivedCertificate,
    useFindManyCertificate,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, InputNumber, message, Typography } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export type PutArchivedCertificate = {
    documentFiles?: DocumentFile[]
    trainingCoursesId?: string
    fixedClassesId?: string
    student: Record<
        string,
        {
            certificateId: string
            score?: number
            issuedBy: string
            issuedDate?: dayjs.Dayjs
            expiredDate?: dayjs.Dayjs
        }
    >
}
dayjs.locale('vi')

const { Title } = Typography

const PutCertificateArchivedModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [allUploadedFiles, setAllUploadedFiles] = useState<DocumentFile[]>([])
    const [uploadingCount, setUploadingCount] = useState<number>(0)
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
            setStudentCurrentPage(1)
        },
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedCertificate } = useCreateArchivedCertificate()
    const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
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
    // Lấy certificateId từ form
    const fixedClassId = Form.useWatch('fixedClassesId', form)
    const trainingCoursesId = Form.useWatch('trainingCoursesId', form)
    const uploadedFiles = Form.useWatch('allDocumentFiles', form)
    const studentFormData = Form.useWatch('student', form) ?? {}

    // Lấy danh sách FixedClass
    const { data: fixedClasses = [] } = useFindManyFixedClass({
        where: {
            trainingCourseId: trainingCoursesId ?? undefined,
        },
    })

    useEffect(() => {
        if (uploadedFiles) {
            setAllUploadedFiles((prev) => {
                const existingPaths = new Set(prev.map((f) => f.path))
                const newFiles = uploadedFiles.filter((f: any) => !existingPaths.has(f.path))
                return [...prev, ...newFiles]
            })
        }
    }, [uploadedFiles])

    // Build where condition for student query
    const studentWhere = useMemo(() => {
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
                userProfile: {
                    select: {
                        code: true,
                        dateOfBirth: true,
                        fullname: true,
                    },
                },
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
        { enabled: !!trainingObjectTypeId && !!fixedClassId }
    )

    // Đếm tổng số sinh viên
    const { data: studentCount = 0 } = useCountStudent(
        {
            where: studentWhere || {},
        },
        { enabled: !!trainingObjectTypeId && !!fixedClassId }
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
                // await updateArchivedCertificate({
                //     data: {
                //         studentId: id,
                //         certificateId: rest.certificateId,
                //         finalScore: rest.finalScore || 0,
                //         score: rest.score,
                //         issuedBy: rest.issuedBy,
                //         issuedDate: rest.issuedDate,
                //         expiredDate: rest.expiredDate,
                //         documentFiles: {
                //             upsert: (rest.documentFiles || [])
                //                 .filter((file) => !!file.id)
                //                 .map((file) => ({
                //                     where: { id: file.id },
                //                     create: {
                //                         name: file.name,
                //                         path: file.path,
                //                         mimeType: file.mimeType,
                //                         size: file.size,
                //                         curriculum: { connect: { id } },
                //                     },
                //                     update: {
                //                         name: file.name,
                //                         path: file.path,
                //                         mimeType: file.mimeType,
                //                         size: file.size,
                //                     },
                //                 })),
                //             create: (rest.documentFiles || [])
                //                 .filter((file) => !file.id)
                //                 .map((file) => ({
                //                     name: file.name,
                //                     path: file.path,
                //                     mimeType: file.mimeType,
                //                     size: file.size,
                //                 })),
                //             disconnect: document
                //                 .filter(
                //                     (existing) =>
                //                         !rest.documentFiles?.some((f) => f.id === existing.id)
                //                 )
                //                 .map((file) => ({ id: file.id })),
                //         },
                //     },
                //     where: { id: id },
                // })
                // message.success('Cập nhật thành công')
            } else {
                // Xử lý thêm mới cho nhiều sinh viên

                const createdCertificates: any[] = []

                // Tạo chứng chỉ cho từng sinh viên với file riêng
                for (const studentId of Object.keys(studentFormData)) {
                    const studentDataForId = studentFormData[studentId]
                    if (!studentDataForId.certificateId) continue
                    const studentDetail = studentData.find((s) => s.id === studentId)
                    const studentCode = studentDetail?.userProfile?.code || ''

                    // Lấy file có tên chứa mã sinh viên
                    const studentFiles = allUploadedFiles.filter((file: DocumentFile) =>
                        file.name.toLowerCase().includes(studentCode.toLowerCase())
                    )
                    const result = await createArchivedCertificate({
                        data: {
                            studentId,
                            certificateId: studentDataForId.certificateId,
                            finalScore: 0,
                            score: studentDataForId.score || 0,
                            issuedBy: studentDataForId.issuedBy || '',
                            issuedDate: studentDataForId.issuedDate?.toDate() as Date,
                            expiredDate: studentDataForId.expiredDate?.toDate() || null,
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

                message.success(`Đã thêm mới ${createdCertificates.length} chứng chỉ`)
                // refetch() lại danh sách level
                queryClient.invalidateQueries({
                    queryKey: ['ArchivedCertificate'],
                })
                onClose()
                return
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

    // Tính toán trạng thái upload cho từng sinh viên dựa trên tên file
    const studentUploadStatus = useMemo(() => {
        if (allUploadedFiles.length === 0) {
            return {}
        }

        const status: Record<string, { count: number; files: DocumentFile[] }> = {}

        studentData.forEach((student) => {
            const studentCode = student?.userProfile?.code || ''

            // Tìm file có tên chứa mã sinh viên (không phân biệt hoa thường)
            const matchedFiles = allUploadedFiles.filter((file: DocumentFile) =>
                file.name.toLowerCase().includes(studentCode.toLowerCase())
            )

            status[student.id as string] = {
                count: matchedFiles.length,
                files: matchedFiles,
            }
        })

        return status
    }, [allUploadedFiles, studentData])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        // if () {
        //     // form.setFieldsValue({
        //     //     ...initialData,
        //     //     documentFiles: initialData.documentFiles,
        //     //     trainingCoursesId: initialData?.student?.fixedClass?.trainingCourseId || '',
        //     //     fixedClassesId: initialData?.student?.fixedClassId || '',
        //     // })
        //     // setDocument(initialData.documentFiles)
        // } else {
        form.setFieldsValue({
            documentFiles: [],
        })
        setDocument([])
        setAllUploadedFiles([])
        setUploadingCount(0)
        // }
    }, [])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa đơn phiên điểm chứng chỉ cho môn học'
                    : 'Thêm mới đơn phiên điểm chứng chỉ cho môn học'
            }
            className="w-[95vw]"
        >
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
                            Học viên, sinh viên
                        </Title>
                    </div>
                    {!studentWhere ? (
                        <div className="text-gray-500 text-center py-4 border rounded">
                            Vui lòng chọn Khoá hoặc Lớp quản lý để hiển thị danh sách sinh viên
                        </div>
                    ) : (
                        <Table
                            rowKey="id"
                            data={studentData}
                            scroll={{ y: 300 }}
                            columns={[
                                {
                                    title: 'TT',
                                    width: 35,
                                    align: 'center',
                                    render: (_, __, index) =>
                                        index + 1 + (studentCurrentPage - 1) * studentPageSize,
                                },
                                {
                                    title: 'Mã SV',
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) =>
                                        `${record?.userProfile?.code || ''}`.trim(),
                                },
                                {
                                    title: 'Họ và tên',
                                    align: 'left',
                                    render: (_, record) =>
                                        `${record?.userProfile?.fullname || ''}`.trim(),
                                },
                                {
                                    title: 'Ngày sinh',
                                    width: 100,
                                    align: 'center',
                                    render: (_, record) =>
                                        record?.userProfile?.dateOfBirth
                                            ? dayjs(record?.userProfile?.dateOfBirth).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Chứng chỉ',
                                    width: 250,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.id, 'certificateId']}
                                        >
                                            <Select
                                                variant="underlined"
                                                options={certificate.map((item) => ({
                                                    label: item.name,
                                                    value: item.id,
                                                }))}
                                                placeholder="Chọn chứng chỉ"
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'Điểm phiên',
                                    width: 250,
                                    align: 'center',
                                    render: (_, record) =>
                                        certificate
                                            .find(
                                                (c) =>
                                                    c.id ===
                                                    studentFormData?.[record.id]?.certificateId
                                            )
                                            ?.subjects.map((sub) => (
                                                <p>
                                                    {sub.subject.name}: <b>{sub.finalScore}</b>
                                                </p>
                                            )),
                                },
                                {
                                    title: 'Điểm chứng chỉ',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.id, 'score']}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.id]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập điểm chứng chỉ',
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                min={1}
                                                variant="underlined"
                                                className="w-full"
                                                placeholder="Nhập điểm phiên cho môn học"
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'Nơi cấp',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.id, 'issuedBy']}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.id]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập nơi cấp',
                                                },
                                            ]}
                                        >
                                            <Input
                                                variant="underlined"
                                                className="w-full"
                                                placeholder="Nhập nơi cấp"
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'Ngày cấp',
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.id, 'issuedDate']}
                                            dependencies={[['student', record.id, 'expiredDate']]}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.id]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập ngày cấp',
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const expiredDate = getFieldValue([
                                                            'student',
                                                            record.id,
                                                            'expiredDate',
                                                        ])
                                                        if (
                                                            !value ||
                                                            !expiredDate ||
                                                            value.isBefore(expiredDate) ||
                                                            value.isSame(expiredDate, 'day')
                                                        ) {
                                                            return Promise.resolve()
                                                        }
                                                        return Promise.reject(
                                                            new Error('Ngày cấp không hợp lệ')
                                                        )
                                                    },
                                                }),
                                            ]}
                                        >
                                            <DatePicker
                                                variant="underlined"
                                                className="w-full"
                                                placeholder="Chọn ngày"
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'Ngày hết hạn',
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.id, 'expiredDate']}
                                            dependencies={[['student', record.id, 'issuedDate']]}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.id]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập ngày hết hạn',
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const issuedDate = getFieldValue([
                                                            'student',
                                                            record.id,
                                                            'issuedDate',
                                                        ])
                                                        if (
                                                            !value ||
                                                            !issuedDate ||
                                                            value.isAfter(issuedDate) ||
                                                            value.isSame(issuedDate, 'day')
                                                        ) {
                                                            return Promise.resolve()
                                                        }
                                                        return Promise.reject(
                                                            new Error('Ngày hết hạn không hợp lệ')
                                                        )
                                                    },
                                                }),
                                            ]}
                                        >
                                            <DatePicker
                                                variant="underlined"
                                                className="w-full"
                                                placeholder="Chọn ngày"
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'Minh chứng',
                                    width: 100,
                                    align: 'center',
                                    render: (_, record) => {
                                        const status = studentUploadStatus[record.id]
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
            {/* {id && (
                <Col span={24} className="mb-4">
                    <FormItem form={form} name="studentId" label="Học viên, sinh viên" required>
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Chọn sinh viên"
                            options={studentData.map((item) => ({
                                label: `${item.userProfile?.code || ''} - ${item.userProfile?.fullname}`,
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
            )} */}

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
            <Col span={24} className="mb-0">
                <div>
                    <div className="mb-0">
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
                    <div className="mt-2">
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
                    </div>
                    <p className="text-blue-500 text-xs mt-0">
                        <strong>Hướng dẫn:</strong> Tên file phải chứa MSSV để hệ thống tự động nhận
                        diện.
                    </p>
                </div>
            </Col>
        </PutFormModal>
    )
}

export default PutCertificateArchivedModal
