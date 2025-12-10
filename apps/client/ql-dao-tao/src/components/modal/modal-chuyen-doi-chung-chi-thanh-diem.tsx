import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import {
    useFindManyCertificate,
    useCreateManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyStudent,
} from '@workspace/db/hooks'
import { Modal, message, Row, Col, Typography } from 'antd'
import type React from 'react'
import { useState, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title } = Typography

interface ConvertCertificateInput {
    studentIds: string[]
    studentNames: string[]
    studentCodes?: string[]
}

const ModalChuyenDoiChungChiThanhDiem = () => {
    const { showSpinner, hideSpinner } = useSpinner()

    const { isOpen, onClose, input } = useDisclosure<ConvertCertificateInput>({
        tag: 'ModalChuyenDoiChungChiThanhDiem',
    })

    const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null)
    const [selectedSubjectClassIds, setSelectedSubjectClassIds] = useState<string[]>([])

    // Lấy danh sách sinh viên
    const { data: students = [] } = useFindManyStudent(
        {
            where: {
                id: {
                    in: input?.studentIds || [],
                },
            },
            include: {
                userProfile: true,
            },
        },
        { enabled: !!input?.studentIds && input.studentIds.length > 0 }
    )

    // Lấy danh sách chứng chỉ
    const { data: certificates = [] } = useFindManyCertificate({
        include: {
            subjects: {
                include: {
                    subject: true,
                },
            },
        },
    })

    // Lấy danh sách SubjectClass có liên quan đến chứng chỉ
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

    // Lấy danh sách lớp môn học có thể phiên điểm từ chứng chỉ đã chọn
    const availableSubjectClasses = useMemo(() => {
        if (!selectedCertificateId) return []
        const certificate = certificates.find((c: any) => c.id === selectedCertificateId)

        if (!certificate?.subjects) return []

        // Lấy danh sách subjectId từ chứng chỉ
        const certificateSubjectIds = certificate.subjects.map((cs: any) => cs.subjectId)

        // Lọc SubjectClass có subject thuộc chứng chỉ
        const filteredClasses = subjectClasses.filter((sc: any) =>
            certificateSubjectIds.includes(sc.subject?.subjectId)
        )

        // Map với điểm phiên từ chứng chỉ
        return filteredClasses.map((sc: any) => {
            const certSubject = certificate.subjects.find(
                (cs: any) => cs.subjectId === sc.subject?.subjectId
            )

            return {
                ...sc,
                finalScore: certSubject?.finalScore || 0,
            }
        })
    }, [selectedCertificateId, certificates, subjectClasses])

    const { mutateAsync: createManyStudentSubjectScore } = useCreateManyStudentSubjectScore()

    const handleSubmit = async () => {
        if (!selectedCertificateId) {
            message.warning('Vui lòng chọn chứng chỉ')
            return
        }

        if (selectedSubjectClassIds.length === 0) {
            message.warning('Vui lòng chọn ít nhất một lớp môn học để phiên điểm')
            return
        }

        if (!input?.studentIds || input.studentIds.length === 0) {
            message.warning('Không có học viên nào được chọn')
            return
        }

        try {
            showSpinner()

            // Tạo danh sách bản ghi StudentSubjectScore
            const records: any[] = []

            input.studentIds.forEach((studentId) => {
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
                            exempted: true, // Được miễn học do chuyển điểm từ chứng chỉ
                        })
                    }
                })
            })

            if (records.length === 0) {
                message.warning('Không có bản ghi nào để tạo')
                return
            }

            await createManyStudentSubjectScore({
                data: records,
            })

            message.success(
                `Đã chuyển đổi thành công ${records.length} bản ghi điểm cho ${input.studentIds.length} học viên`
            )

            // Reset state
            setSelectedCertificateId(null)
            setSelectedSubjectClassIds([])
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

    const handleClose = () => {
        setSelectedCertificateId(null)
        setSelectedSubjectClassIds([])
        onClose()
    }

    const certificateRowSelection = {
        type: 'radio' as const,
        selectedRowKeys: selectedCertificateId ? [selectedCertificateId] : [],
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedCertificateId(selectedKeys[0] as string)
            setSelectedSubjectClassIds([]) // Reset lớp môn học khi đổi chứng chỉ
        },
    }

    const subjectClassRowSelection = {
        selectedRowKeys: selectedSubjectClassIds,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedSubjectClassIds(selectedKeys as string[])
        },
    }

    return (
        <Modal
            title="Chuyển đổi chứng chỉ thành điểm môn học"
            open={isOpen}
            onCancel={handleClose}
            onOk={handleSubmit}
            width={1400}
            okText="Xác nhận chuyển đổi"
            cancelText="Hủy"
            destroyOnClose
        >
            <div className="mb-4">
                <Title level={5}>Danh sách học viên được chọn ({students.length})</Title>
                <Table
                    rowKey="id"
                    dataSource={students}
                    pagination={false}
                    size="small"
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_, __, index) => index + 1,
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
                            render: (_, record: any) =>
                                `${record.userProfile?.lastName || ''} ${record.userProfile?.firstName || ''}`.trim(),
                        },
                    ]}
                />
            </div>

            <Row gutter={16}>
                <Col span={12}>
                    <Title level={5}>1. Chọn chứng chỉ</Title>
                    <Table
                        rowKey="id"
                        dataSource={certificates}
                        pagination={false}
                        rowSelection={certificateRowSelection}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Tên chứng chỉ',
                                dataIndex: 'name',
                                align: 'left',
                            },
                            {
                                title: 'Số môn',
                                align: 'center',
                                width: 100,
                                render: (_, record: any) => record?.subjects?.length || 0,
                            },
                        ]}
                    />
                </Col>

                <Col span={12}>
                    <Title level={5}>2. Chọn lớp môn học cần phiên điểm</Title>
                    {!selectedCertificateId ? (
                        <div className="flex items-center justify-center h-96 text-gray-400">
                            Vui lòng chọn chứng chỉ bên trái
                        </div>
                    ) : availableSubjectClasses.length === 0 ? (
                        <div className="flex items-center justify-center h-96 text-orange-500">
                            Chứng chỉ này chưa có lớp môn học nào để phiên điểm
                        </div>
                    ) : (
                        <Table
                            rowKey="id"
                            dataSource={availableSubjectClasses}
                            pagination={false}
                            rowSelection={subjectClassRowSelection}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    align: 'center',
                                    render: (_, __, index) => index + 1,
                                },
                                {
                                    title: 'Mã MH',
                                    dataIndex: ['subject', 'code'],
                                    align: 'center',
                                    width: 100,
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
                                    width: 100,
                                },
                                {
                                    title: 'Học kỳ',
                                    dataIndex: ['semester', 'name'],
                                    align: 'center',
                                    width: 120,
                                },
                                {
                                    title: 'Điểm phiên',
                                    dataIndex: 'finalScore',
                                    align: 'center',
                                    width: 100,
                                    render: (score) => (
                                        <strong className="text-blue-600">{score}</strong>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Col>
            </Row>
        </Modal>
    )
}

export default ModalChuyenDoiChungChiThanhDiem
