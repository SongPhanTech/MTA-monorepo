import Table from '@components/commons/table'
import { formatDate } from '@lib/utils'
import { useFindManyStudentSubjectScore } from '@workspace/db/hooks'
import { Button, Checkbox, Col, Flex, Form, Input, Row, Space, Typography } from 'antd'
const { Text } = Typography
interface Props {
    subjectClassId: string | null
}

export default function DanhSachSinhVien({ subjectClassId }: Props) {
    const [form] = Form.useForm()

    const { data } = useFindManyStudentSubjectScore(
        {
            where: {
                subjectClassId: subjectClassId || undefined,
            },
            include: {
                student: {
                    include: {
                        userProfile: {
                            select: {
                                fullname: true,
                                code: true,
                                placeOfBirth: true,
                            },
                        },
                        fixedClass: {
                            select: {
                                name: true,
                                trainingCourse: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                subjectClass: {
                    select: {
                        subject: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!subjectClassId }
    )

    const listForm = Form.useWatch('list', form) || []

    console.log('students', data)

    return (
        <Row gutter={16}>
            <Col span={24}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 16 }}>
                            Mã lớp:
                        </Text>
                    </Space>

                    <Space>
                        <Button type="default">Lưu hoãn thi</Button>
                        <Button type="primary">Phân phòng thi</Button>
                    </Space>
                </Flex>
            </Col>
            <Col span={24}>
                <Form form={form}>
                    <Table
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                render: (_, record) => record.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <div className="text-left">
                                            {record.student?.userProfile?.fullname || ''}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Ngày sinh',
                                render: (_, record) => {
                                    const dob = record.student?.userProfile?.dateOfBirth
                                    return dob ? formatDate(dob) : undefined
                                },
                            },
                            {
                                title: 'Tên lớp',
                                render: (_, record) =>
                                    `${record.student?.fixedClass?.name || ''}-${
                                        record.student?.fixedClass?.trainingCourse?.name || ''
                                    }`,
                            },
                            {
                                title: 'Điểm CC',
                                align: 'center',
                                render: (_, record) => record.attendanceScore || '',
                            },
                            {
                                title: 'Điểm TX',
                                align: 'center',
                                render: (_, record) => record.midtermScore || '',
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                render: (_, record) => record.examScore || '',
                            },
                            {
                                title: 'Lý do cấm thi',
                                render: (_, record) => {
                                    const examBanned = listForm[record.id]?.examBanned
                                    return (
                                        <Form.Item
                                            name={['list', record.id, 'examBannedReason']}
                                            className="m-0"
                                        >
                                            <Input
                                                placeholder="Nhập lý do cấm thi"
                                                disabled={!examBanned}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Cấm thi',
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examBanned']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Lý do hoãn thi',
                                render: (_, record) => {
                                    const examPostponed = listForm[record.id]?.examPostponed
                                    return (
                                        <Form.Item
                                            name={[record.id, 'examPostponedReason']}
                                            className="m-0"
                                        >
                                            <Input
                                                placeholder="Nhập lý do hoãn thi"
                                                disabled={!examPostponed}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Hoãn thi',
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examPostponed']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Ghi chú',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={[record.id, 'description']}
                                            label=""
                                        >
                                            <Input placeholder="Nhập ghi chú" />
                                        </Form.Item>
                                    )
                                },
                            },
                        ]}
                        data={data}
                        pagination={false}
                        scroll={{ y: 950 }}
                    />
                </Form>
            </Col>
        </Row>
    )
}
