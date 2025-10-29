import TableCollapse from '@components/commons/tableCollapse'
import { formatDate } from '@lib/utils'
import type { Prisma } from '@workspace/db/client'
import { useFindManyStudentSubjectScore } from '@workspace/db/hooks'
import { Button, Checkbox, Col, Flex, Form, Input, InputNumber, Row } from 'antd'
import { useMemo } from 'react'

interface Props {
    subjectClassId: string | null
}

type StudentType = Prisma.StudentGetPayload<{
    include: {
        userProfile: {
            select: {
                fullname: true
            }
        }
    }
}>

export default function DanhSachSinhVien({ subjectClassId }: Props) {
    const [form] = Form.useForm()

    const { data = [], isLoading } = useFindManyStudentSubjectScore(
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
                        code: true,
                        room: {
                            select: {
                                id: true,
                                name: true,
                                capacity: true,
                            },
                        },
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

    const groupedData = useMemo(() => {
        const grouped = data.reduce(
            (acc, item) => {
                const roomId = item.subjectClass?.room?.id || ''
                const roomName = item.subjectClass?.room?.name || ''

                if (!acc[roomId]) {
                    acc[roomId] = {
                        id: roomId,
                        roomName: roomName,
                        capacity: item.subjectClass?.room?.capacity,
                        students: [],
                    }
                }

                acc[roomId].students.push(item)
                return acc
            },
            {} as Record<string, any>
        )

        Object.values(grouped).forEach((room) => {
            room.students.sort((a: StudentType, b: StudentType) => {
                const nameA = a.userProfile?.fullname || ''
                const nameB = b.userProfile?.fullname || ''
                return nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'vi')
            })
        })

        return Object.values(grouped)
    }, [data])

    const handleExamBanned = () => {
        const values = form.getFieldsValue()

        console.log(values)
    }

    return (
        <Row gutter={16}>
            <Col span={24}>
                <Row gutter={16} align="middle">
                    <Col span={12}>
                        <Flex align="start" gap={16}>
                            <div className="bg-blue-50 p-1 rounded-md border border-blue-300">
                                <span className="text-blue-700 font-semibold mr-2">Mã lớp:</span>
                                <span className="text-base font-bold text-blue-600">
                                    {data[0]?.subjectClass?.code || ''}
                                </span>
                            </div>
                            <div className="bg-green-50 p-1 rounded-md border border-green-300">
                                <span className="text-green-700 font-semibold mr-2">Tên lớp:</span>
                                <span className="text-base font-bold text-green-600">
                                    {data[0]?.subjectClass?.subject?.name || ''}
                                </span>
                            </div>
                        </Flex>
                    </Col>

                    <Col span={12}>
                        <Flex justify="end" align="center" gap={12}>
                            <Checkbox>Khóa nhập ĐQT</Checkbox>
                            <Checkbox>Khóa danh sách thi</Checkbox>
                            <Button type="primary" onClick={handleExamBanned}>
                                Lưu hoãn thi
                            </Button>
                            <Button type="primary">Phân phòng thi</Button>
                        </Flex>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Form form={form}>
                    <TableCollapse
                        rowKey="id"
                        id="danh-sach-sinh-vien"
                        headerTitleKey={(record) =>
                            `Phòng thi: ${record.roomName}${record.capacity ? ` (Sức chứa: ${record.capacity})` : ''}`
                        }
                        childrenFieldName="students"
                        defaultExpandAll
                        data={groupedData}
                        pagination={false}
                        loading={isLoading}
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                width: 100,
                                render: (_, record) => record.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 220,
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
                                width: 140,
                                align: 'center',
                                render: (_, record) => {
                                    const dob = record.student?.userProfile?.dateOfBirth
                                    return dob ? formatDate(dob) : undefined
                                },
                            },
                            {
                                title: 'Tên lớp',
                                width: 230,
                                render: (_, record) =>
                                    `${record.student?.fixedClass?.name || ''}-${
                                        record.student?.fixedClass?.trainingCourse?.name || ''
                                    }`,
                            },
                            {
                                title: 'Điểm CC',
                                width: 80,
                                align: 'center',
                                render: (_, record) => record.attendanceScore || '',
                            },
                            {
                                title: 'Điểm TX',
                                align: 'center',
                                width: 80,
                                render: (_, record) => record.midtermScore || '',
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0 w-full"
                                            name={[record.id, 'examScore']}
                                            initialValue={record.examScore || ''}
                                        >
                                            <InputNumber step={0.5} min={1} max={10} />
                                        </Form.Item>
                                    )
                                },
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
                                width: 80,
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
                                width: 80,
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
                        scroll={{ y: 'calc(100vh - 64px - 40px - 48px - 150px)' }}
                    />
                </Form>
            </Col>
        </Row>
    )
}
