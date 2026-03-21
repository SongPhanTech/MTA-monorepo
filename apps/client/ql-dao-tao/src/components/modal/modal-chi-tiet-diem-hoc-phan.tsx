import { Table, Divider, Row, Col } from 'antd'
import { PutFormModal } from '@workspace/ui'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { Form } from 'antd'
import { useFindUniqueStudentSubjectScore } from '@workspace/db/hooks'

const ModalScoreDetail = () => {
    const [form] = Form.useForm()

    const { isOpen, onClose, input } = useDisclosure<{
        id: string
    }>({
        tag: 'ModalScoreDetail',
        onClose: () => form.resetFields(),
    })

    const id = input?.id

    const { data } = useFindUniqueStudentSubjectScore(
        {
            where: { id },
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
                subjectClass: {
                    include: {
                        semester: {
                            include: {
                                schoolYear: true,
                            },
                        },
                    },
                },
                awards: {
                    include: {
                        archivedAward: true,
                    },
                },
                studentSubjectScoreHistory: {
                    include: {
                        updatedBy: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        },
        {
            enabled: isOpen && !!id,
        }
    )

    if (!data) return null

    const bonus =
        data?.awards?.reduce(
            (sum: number, a: any) => sum + (a?.archivedAward?.bonusScore || 0),
            0
        ) || 0

    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            width: 180,
            align: 'center' as const,
            render: (v: string) => new Date(v).toLocaleString(),
        },
        {
            title: 'TX',
            dataIndex: 'attendanceScore',
            width: 70,
            align: 'center' as const,
        },
        {
            title: 'GK',
            dataIndex: 'midtermScore',
            width: 70,
            align: 'center' as const,
        },
        {
            title: 'Thi',
            dataIndex: 'examScore',
            width: 70,
            align: 'center' as const,
        },
        {
            title: 'Tổng',
            dataIndex: 'finalScore',
            width: 80,
            align: 'center' as const,
            render: (v: any) => v?.toString?.() ?? '-',
        },
        {
            title: 'Người sửa',
            width: 160,
            align: 'center' as const,
            render: (_: any, r: any) => r?.updatedBy?.fullname || '-',
        },
    ]

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            title="Chi tiết điểm học phần"
            onCancel={onClose}
            onFinish={onClose}
            okText="Đóng"
            cancelButtonProps={{ className: 'hidden' }}
            width={850}
            centered
        >
            <div className="flex gap-4 mb-2 w-full">
                {/* LỚP */}
                <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                    <div className="text-gray-500 text-lg">Lớp học</div>
                    <div className="font-semibold text-lg">
                        {data?.subjectClass?.name} ({data?.subjectClass?.code})
                    </div>

                    <div className="mt-2 text-gray-500 text-lg">Học kỳ</div>
                    <div className="font-semibold text-lg">
                        {data?.subjectClass?.semester?.name} -{' '}
                        {data?.subjectClass?.semester?.schoolYear?.name}
                    </div>
                </div>

                {/* SINH VIÊN */}
                <div className="flex-1 bg-blue-50 p-4 rounded-xl">
                    <div className="text-gray-500 text-lg">Sinh viên</div>
                    <div className="font-semibold text-lg">
                        {data?.student?.userProfile?.fullname}
                    </div>

                    <div className="mt-2 text-gray-500 text-lg">Mã SV</div>
                    <div className="font-semibold text-lg">{data?.student?.code}</div>
                </div>

                {/* ĐIỂM */}
                <div className="flex-1 bg-white border rounded-xl p-4 shadow-sm">
                    <div className="font-semibold mb-2 text-lg">Điểm hiện tại</div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                            <div className="text-gray-500 text-lg">TX</div>
                            <div className="font-semibold text-lg">
                                {data?.attendanceScore ?? '-'}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-lg">GK</div>
                            <div className="font-semibold text-lg">{data?.midtermScore ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-lg">Thi</div>
                            <div className="font-semibold text-lg">{data?.examScore ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-lg">Tổng</div>
                            <div className="font-bold text-green-600 text-lg">
                                {data?.finalScore?.toString?.() ?? '-'}
                            </div>
                        </div>
                    </div>

                    <Divider className="my-2" />

                    <div className="text-center text-lg">
                        <div className="text-gray-500 text-lg">Điểm cộng</div>
                        <div className="font-semibold text-blue-600">+{bonus}</div>
                    </div>
                </div>
            </div>

            <Row>
                <Col span={24}>
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <div className="font-semibold mb-3 text-lg">Lịch sử chỉnh sửa</div>

                        <Table
                            size="middle"
                            rowKey="id"
                            columns={columns}
                            dataSource={data?.studentSubjectScoreHistory || []}
                            pagination={false}
                            bordered
                            scroll={{ y: 300 }}
                        />
                    </div>
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default ModalScoreDetail
