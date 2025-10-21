import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma } from '@workspace/db/client'
import {
    useFindManyExam,
    useFindManyRoom,
    useCreateManyExamRoom,
    useFindManyExamRoom,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, InputNumber, Popconfirm, Row, message } from 'antd'
import { useEffect, useState } from 'react'

type SubjectClassTypeWithRelation = Prisma.SubjectClassGetPayload<{
    include: {
        subject: {
            select: {
                name: true
            }
        }
    }
}>

export default function KyThiPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const [form] = Form.useForm()
    const { mutateAsync: createManyExamRoom } = useCreateManyExamRoom()

    const { data: examData = [], refetch: refetchExam } = useFindManyExam({
        include: {
            subjectClass: {
                include: {
                    subject: true,
                },
            },
            studentSubjectScore: true,
        },
    })

    const { data: roomData = [] } = useFindManyRoom({
        where: {
            deletedAt: null,
        },
    })

    const { data: examRoomData = [] } = useFindManyExamRoom({
        include: {
            room: true,
        },
    })

    useEffect(() => {
        if (examData.length > 0 && examRoomData.length > 0) {
            const formValues: Record<string, any> = {}

            const examRoomsByExamId = examRoomData.reduce(
                (acc, examRoom) => {
                    if (!acc[examRoom.examId]) {
                        acc[examRoom.examId] = []
                    }
                    acc[examRoom.examId].push(examRoom)
                    return acc
                },
                {} as Record<string, typeof examRoomData>
            )

            for (const exam of examData) {
                const examRooms = examRoomsByExamId[exam.id] || []

                if (examRooms.length > 0) {
                    // Lấy danh sách roomId duy nhất
                    const uniqueRoomIds = Array.from(
                        new Set(examRooms.map((er) => er.roomId).filter(Boolean))
                    )

                    const numberOfExamSession =
                        uniqueRoomIds.length > 0
                            ? Math.floor(examRooms.length / uniqueRoomIds.length)
                            : 1

                    formValues[exam.id] = {
                        examRoom: uniqueRoomIds,
                        numberOfExamSession: numberOfExamSession,
                    }
                } else {
                    formValues[exam.id] = {
                        numberOfExamSession: 1,
                    }
                }
            }

            form.setFieldsValue(formValues)
        }
    }, [examData, examRoomData, form])

    const onSubmit = async () => {
        try {
            const dataSubmit = form.getFieldsValue()

            const listObject = Object.entries(dataSubmit).map(([key, value_]) => {
                return {
                    id: key,
                    ...(value_ as any),
                }
            })

            const examRoomsToCreate: Array<{
                examId: string
                roomId: string
            }> = []

            for (const exam of listObject) {
                const examRooms = exam.examRoom || []
                const numberOfExamSession = exam.numberOfExamSession || 1

                // Với mỗi phòng và mỗi ca thi, tạo một ExamRoom
                for (const roomId of examRooms) {
                    for (let session = 1; session <= numberOfExamSession; session++) {
                        examRoomsToCreate.push({
                            examId: exam.id,
                            roomId: roomId,
                        })
                    }
                }
            }

            if (examRoomsToCreate.length === 0) {
                message.warning('Vui lòng chọn ít nhất một phòng thi!')
                return
            }

            // Tạo ExamRoom hàng loạt
            await createManyExamRoom({
                data: examRoomsToCreate,
            })

            message.success('Tạo phòng thi thành công!')
            refetchExam()
        } catch (error) {
            console.error('Lỗi khi tạo phòng thi:', error)
            message.error('Có lỗi xảy ra khi tạo phòng thi!')
        }
    }

    return (
        <div>
            <Row gutter={[0, 0]}>
                <Col span={24}>
                    <Flex justify="end" gap={4}>
                        <Popconfirm
                            title="Xác nhận lưu kỳ thi?"
                            okText="Xác nhận"
                            cancelText="Hủy"
                            onConfirm={onSubmit}
                        >
                            <Button type="primary">Lưu</Button>
                        </Popconfirm>
                    </Flex>
                </Col>
                <Form form={form} className="w-full">
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Môn học',
                                width: 50,
                                render: (_, record) => {
                                    const subjectNames = record.subjectClass
                                        ?.map(
                                            (sc: SubjectClassTypeWithRelation) => sc.subject?.name
                                        )
                                        .filter(
                                            (name: string, index: number, self: string[]) =>
                                                self.indexOf(name) === index
                                        )

                                    if (!subjectNames || subjectNames.length === 0) return ''
                                    if (subjectNames.length === 1) return subjectNames[0]
                                },
                            },
                            {
                                title: 'Mã lớp môn học',
                                width: 50,
                                render: (_, record) => {
                                    const subjectClassCodes = record.subjectClass?.map(
                                        (sc: SubjectClassTypeWithRelation) => sc.code
                                    )

                                    if (!subjectClassCodes || subjectClassCodes.length === 0)
                                        return ''
                                    return subjectClassCodes.join(', ')
                                },
                            },
                            {
                                title: 'Số sinh viên',
                                width: 50,
                                align: 'center',
                                render: (_, record) => record.studentSubjectScore?.length || 0,
                            },
                            {
                                title: 'Phòng thi',
                                width: 120,
                                render: (_, record) => {
                                    return (
                                        <Form.Item name={[record.id, 'examRoom']} className="mb-0">
                                            <Select
                                                placeholder="Chọn phòng thi"
                                                mode="multiple"
                                                options={roomData?.map((room) => {
                                                    return {
                                                        label: `${room.name}-${room.capacity}`,
                                                        value: room.id,
                                                    }
                                                })}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Số ca thi',
                                width: 10,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            name={[record.id, 'numberOfExamSession']}
                                            className="mb-0"
                                        >
                                            <InputNumber
                                                min={1}
                                                defaultValue={1}
                                                className="w-full"
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                        ]}
                        data={examData}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Form>
            </Row>
        </div>
    )
}

KyThiPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
