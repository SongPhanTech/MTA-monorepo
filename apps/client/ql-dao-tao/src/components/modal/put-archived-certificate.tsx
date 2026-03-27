import { DeleteOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import FileUploadButton from '@components/commons/file-upload-button'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import type { DocumentFile } from '@workspace/db'
import {
    useCreateArchivedCertificate,
    useFindManyCertificate,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, Input, InputNumber, message, Typography } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

// Mỗi dòng trong table có rowId duy nhất (cho phép 1 SV chọn nhiều lần)
type SelectedStudentRow = {
    rowId: string
    studentId: string
    code: string
    fullname: string
    dateOfBirth: Date | string | null
}

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
            decisionNumber?: string
            issuedDate?: dayjs.Dayjs
            expiredDate?: dayjs.Dayjs
            documentFiles?: DocumentFile[]
        }
    >
}
dayjs.locale('vi')

const { Title } = Typography

const PutCertificateArchivedModal = () => {
    const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])
    const [selectedStudents, setSelectedStudents] = useState<SelectedStudentRow[]>([])
    const [rowCounter, setRowCounter] = useState(0)
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
            setSelectedStudents([])
            setRowCounter(0)
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
            where: { trainingObjectTypeId },
            orderBy: {
                semesterStart: {
                    startDate: 'desc',
                },
            },
        },
        { enabled: !!trainingObjectTypeId }
    )
    // Lấy certificateId từ form
    const fixedClassId = Form.useWatch('fixedClassesId', form)
    const trainingCoursesId = Form.useWatch('trainingCoursesId', form)
    const studentFormData = Form.useWatch('student', form) ?? {}

    // Lấy danh sách FixedClass
    const { data: fixedClasses = [] } = useFindManyFixedClass({
        where: {
            trainingCourseId: trainingCoursesId ?? undefined,
        },
    })

    // Build where condition for student query
    const studentWhere = useMemo(() => {
        return {
            fixedClass: {
                ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
                ...(fixedClassId ? { id: fixedClassId } : {}),
            },
        }
    }, [trainingCoursesId, fixedClassId])

    // Lấy danh sách sinh viên cho dropdown chọn
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
        },
        { enabled: !!trainingObjectTypeId }
    )

    // Thêm sinh viên vào danh sách đã chọn
    const handleAddStudent = useCallback(
        (studentId: string) => {
            const student = studentData.find((s: any) => s.id === studentId)
            if (!student) return

            const newRowId = `row_${rowCounter}`
            setRowCounter((prev) => prev + 1)
            setSelectedStudents((prev) => [
                ...prev,
                {
                    rowId: newRowId,
                    studentId: student.id,
                    code: student.userProfile?.code || '',
                    fullname: student.userProfile?.fullname || '',
                    dateOfBirth: student.userProfile?.dateOfBirth || null,
                },
            ])
        },
        [studentData, rowCounter]
    )

    // Xoá dòng khỏi danh sách
    const handleRemoveRow = useCallback(
        (rowId: string) => {
            setSelectedStudents((prev) => prev.filter((r) => r.rowId !== rowId))
            // Xoá form data của dòng đó
            const currentStudent = form.getFieldValue('student') || {}
            delete currentStudent[rowId]
            form.setFieldValue('student', currentStudent)
        },
        [form]
    )

    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
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

                // Tạo chứng chỉ cho từng dòng đã chọn
                for (const row of selectedStudents) {
                    const studentDataForRow = studentFormData[row.rowId]
                    if (!studentDataForRow?.certificateId) continue

                    // Lấy file đã upload cho dòng này
                    const studentFiles = studentDataForRow.documentFiles || []

                    const result = await createArchivedCertificate({
                        data: {
                            studentId: row.studentId,
                            certificateId: studentDataForRow.certificateId,
                            finalScore: 0,
                            score: studentDataForRow.score || 0,
                            issuedBy: studentDataForRow.issuedBy || '',
                            decisionNumber: studentDataForRow.decisionNumber || null,
                            issuedDate: studentDataForRow.issuedDate?.toDate() as Date,
                            expiredDate: studentDataForRow.expiredDate?.toDate() || null,
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
                        createdCertificates.push({ id: result.id, studentId: row.studentId })
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
        setDocumentFiles([])

        // }
    }, [])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đơn phiên điểm' : 'Thêm mới đơn phiên điểm'}
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

            {/* Bảng chọn sinh viên - chỉ hiện khi thêm mới */}
            {!id && (
                <Col span={24} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <Title level={5} className="m-0">
                            Học viên, sinh viên
                        </Title>
                    </div>

                    {/* Input chọn sinh viên */}
                    <div className="mb-3">
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Tìm và chọn sinh viên để thêm vào danh sách..."
                            value={undefined}
                            onSelect={(value: string) => handleAddStudent(value)}
                            options={studentData.map((item: any) => ({
                                label: `${item.userProfile?.code || ''} - ${item.userProfile?.fullname || ''}`,
                                value: item.id,
                            }))}
                            filterOption={(input, option) =>
                                String(option?.label ?? '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                        />
                    </div>

                    {/* Table danh sách đã chọn */}
                    {selectedStudents.length > 0 && (
                        <Table
                            rowKey="rowId"
                            data={selectedStudents}
                            scroll={{ y: 300 }}
                            columns={[
                                {
                                    title: 'TT',
                                    width: 35,
                                    align: 'center',
                                    render: (_, __, index) => index + 1,
                                },
                                {
                                    title: 'Mã SV',
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) => record.code,
                                },
                                {
                                    title: 'Họ và tên',
                                    align: 'left',
                                    render: (_, record) => record.fullname,
                                },
                                {
                                    title: 'Ngày sinh',
                                    width: 100,
                                    align: 'center',
                                    render: (_, record) =>
                                        record.dateOfBirth
                                            ? dayjs(record.dateOfBirth).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Chứng chỉ',
                                    width: 250,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.rowId, 'certificateId']}
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
                                                    studentFormData?.[record.rowId]?.certificateId
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
                                    render: (_, record) => {
                                        const selectedCert = certificate.find(
                                            (c) =>
                                                c.id ===
                                                studentFormData?.[record.rowId]?.certificateId
                                        )
                                        return (
                                            <FormItem
                                                form={form}
                                                name={['student', record.rowId, 'score']}
                                                rules={[
                                                    {
                                                        required: !!selectedCert?.isUsingScore,
                                                        message: 'Vui lòng nhập điểm chứng chỉ',
                                                    },
                                                ]}
                                            >
                                                <InputNumber
                                                    min={1}
                                                    variant="underlined"
                                                    className="w-full"
                                                    placeholder="Nhập điểm phiên cho môn học"
                                                    disabled={!selectedCert?.isUsingScore}
                                                />
                                            </FormItem>
                                        )
                                    },
                                },
                                {
                                    title: 'Nơi cấp',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.rowId, 'issuedBy']}
                                            // rules={[
                                            //     {
                                            //         required:
                                            //             !!studentFormData?.[record.rowId]
                                            //                 ?.certificateId,
                                            //         message: 'Vui lòng nhập nơi cấp',
                                            //     },
                                            // ]}
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
                                    title: 'Số quyết định',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['student', record.rowId, 'decisionNumber']}
                                        >
                                            <Input
                                                variant="underlined"
                                                className="w-full"
                                                placeholder="Nhập số QĐ"
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
                                            name={['student', record.rowId, 'issuedDate']}
                                            dependencies={[
                                                ['student', record.rowId, 'expiredDate'],
                                            ]}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.rowId]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập ngày cấp',
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const expiredDate = getFieldValue([
                                                            'student',
                                                            record.rowId,
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
                                            name={['student', record.rowId, 'expiredDate']}
                                            dependencies={[['student', record.rowId, 'issuedDate']]}
                                            rules={[
                                                {
                                                    required:
                                                        !!studentFormData?.[record.rowId]
                                                            ?.certificateId,
                                                    message: 'Vui lòng nhập ngày hết hạn',
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const issuedDate = getFieldValue([
                                                            'student',
                                                            record.rowId,
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
                                    width: 200,
                                    align: 'center',
                                    render: (_, record) => (
                                        <FileUploadButton
                                            form={form}
                                            fieldName={['student', record.rowId, 'documentFiles']}
                                        />
                                    ),
                                },
                                {
                                    title: '',
                                    width: 50,
                                    align: 'center',
                                    render: (_, record) => (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            onClick={() => handleRemoveRow(record.rowId)}
                                        />
                                    ),
                                },
                            ]}
                            pagination={false}
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
                            data={documentFiles}
                            relationId={id ?? ''}
                            relationType="curriculumId"
                        />
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutCertificateArchivedModal
