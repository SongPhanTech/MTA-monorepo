import { Table, Row, Col, Input } from 'antd'
import { PutFormModal, Select } from '@workspace/ui'
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
<<<<<<< Updated upstream
            title: 'Thường xuyên',
=======
            title: 'TX',
>>>>>>> Stashed changes
            dataIndex: 'attendanceScore',
            width: 70,
            align: 'center' as const,
        },
        {
<<<<<<< Updated upstream
            title: 'Định kỳ',
=======
            title: 'GK',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            <Form form={form} layout="vertical">
                <Row gutter={[16, 12]}>
                    {/* HỌC KỲ */}
                    <Col span={6}>
                        <Form.Item label="Học kỳ">
                            <Select
                                placeholder="Chọn học kỳ"
                                defaultValue={data?.subjectClass?.semester?.id}
                                options={[
                                    {
                                        label: `${data?.subjectClass?.semester?.name} - ${data?.subjectClass?.semester?.schoolYear?.name}`,
                                        value: data?.subjectClass?.semester?.id,
                                    },
                                ]}
                                disabled
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item label="Lớp môn học">
                            <Select
                                placeholder="Chọn lớp"
                                defaultValue={data?.subjectClass?.id}
                                options={[
                                    {
                                        label: `${data?.subjectClass?.name} (${data?.subjectClass?.code})`,
                                        value: data?.subjectClass?.id,
                                    },
                                ]}
                                disabled
                            />
                        </Form.Item>
                    </Col>

                    {/* SINH VIÊN */}
                    <Col span={6}>
                        <Form.Item label="Sinh viên">
                            <Select
                                placeholder="Chọn sinh viên"
                                defaultValue={data?.student?.id}
                                options={[
                                    {
                                        label: data?.student?.userProfile?.fullname,
                                        value: data?.student?.id,
                                    },
                                ]}
                                disabled
                            />
                        </Form.Item>
                    </Col>

                    {/* MÃ SV */}
                    <Col span={6}>
                        <Form.Item label="Mã SV">
                            <Input value={data?.student?.code ?? ''} disabled />
                        </Form.Item>
                    </Col>

                    {/* THƯỜNG XUYÊN */}
                    <Col span={6}>
                        <Form.Item label="Thường xuyên">
                            <Input value={data?.attendanceScore?.toString?.() ?? ''} disabled />
                        </Form.Item>
                    </Col>

                    {/* ĐỊNH KỲ */}
                    <Col span={6}>
                        <Form.Item label="Định kỳ">
                            <Input value={data?.midtermScore?.toString?.() ?? ''} disabled />
                        </Form.Item>
                    </Col>

                    {/* THI */}
                    <Col span={6}>
                        <Form.Item label="Thi">
                            <Input value={data?.examScore?.toString?.() ?? ''} disabled />
                        </Form.Item>
                    </Col>

                    {/* TỔNG */}
                    <Col span={6}>
                        <Form.Item label="Tổng">
                            <Input value={data?.finalScore?.toString?.() ?? ''} disabled />
                        </Form.Item>
                    </Col>

                    {/* ĐIỂM CỘNG */}
                    <Col span={6}>
                        <Form.Item label="Điểm cộng">
                            <Input value={bonus?.toString?.()} disabled />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
            <Row className="mt-2">
                <Col span={24}>
                    <div className="bg-white rounded-lg border-gray-200">
                        <div className="px-4 pt-4 pb-2 text-lg font-semibold text-gray-800">
                            Lịch sử chỉnh sửa
                        </div>

                        <Table
                            size="small"
=======
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
>>>>>>> Stashed changes
                            rowKey="id"
                            columns={columns}
                            dataSource={data?.studentSubjectScoreHistory || []}
                            pagination={false}
<<<<<<< Updated upstream
                            bordered={false}
                            scroll={{ y: 260 }}
                            locale={{
                                emptyText: (
                                    <div className="py-6 text-gray-400 text-sm">
                                        Không có dữ liệu
                                    </div>
                                ),
                            }}
=======
                            bordered
                            scroll={{ y: 300 }}
>>>>>>> Stashed changes
                        />
                    </div>
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default ModalScoreDetail
