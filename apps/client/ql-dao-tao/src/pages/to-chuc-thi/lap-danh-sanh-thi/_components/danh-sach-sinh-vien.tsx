import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import { examPostponeReason } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { formatDate } from '@lib/utils'
import { useStore } from '@tanstack/react-store'
import { createId } from '@workspace/db'
import type { Prisma } from '@workspace/db/client'
import { useFindManyExamList, useFindUniqueExam, useUpdateExam } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { SqlTransactionBodyItem } from '@workspace/libs/api/schemas/sqlTransactionBodyItem'
import { AutoComplete, Button, Checkbox, Col, Flex, Form, Input, message, Row } from 'antd'
import { useEffect } from 'react'
import { keHoachThiStore } from '..'

interface Props {
    subjectClassId: string | null
}

interface StudentSubjectScoreFormType {
    list: Record<
        string,
        {
            examPostponed?: boolean
            examPostponedReason?: string
            description?: string
        }
    >
}

export default function DanhSachSinhVien() {
    const [form] = Form.useForm<StudentSubjectScoreFormType>()

    const { selectedExamId } = useStore(keHoachThiStore)

    const { data = [], isLoading } = useFindManyExamList(
        {
            where: {
                examRoom: {
                    examId: selectedExamId,
                    active: true,
                    deletedAt: null,
                },
            },
            select: {
                id: true,
                start: true,
                examRoom: {
                    select: {
                        room: {
                            select: {
                                name: true,
                            },
                        },
                        capacity: true,
                    },
                },
                examPapers: {
                    include: {
                        studentSubjectScore: {
                            include: {
                                student: {
                                    include: {
                                        userProfile: {
                                            select: {
                                                fullname: true,
                                                code: true,
                                                dateOfBirth: true,
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
                    },
                    orderBy: {
                        studentSubjectScore: {
                            student: {
                                userProfile: {
                                    firstName: 'asc',
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                examRoomId: {
                    nulls: 'first',
                    sort: 'desc',
                },
            },
        },
        { enabled: !!selectedExamId }
    )

    const { data: examData } = useFindUniqueExam({
        where: {
            id: selectedExamId,
        },
        select: {
            subjectClass: {
                select: {
                    isLockScore: true,
                    isLockExamScore: true,
                },
            },
            lockExamSessions: true,
        },
    })

    const { mutateAsync: updateExamData } = useUpdateExam()
    const { showSpinner, hideSpinner } = useSpinner()

    const listForm = Form.useWatch('list', form) || []

    const handleLayDiemCCTX = async () => {
        try {
            showSpinner()
            const resExam = await sqlTransaction([
                {
                    model: 'Exam' as const,
                    operation: 'findUnique',
                    data: {
                        where: {
                            id: selectedExamId,
                        },
                        select: {
                            subjectClass: {
                                select: {
                                    subjectClassStudent: true,
                                },
                            },
                            examRooms: {
                                include: {
                                    examList: true,
                                },
                            },
                        },
                    },
                },
            ])
            if (resExam.status !== 200 || !resExam.data) {
                throw new Error('Lấy kế hoạch thi thất bại')
            }
            const exam = resExam.data[0] as Prisma.ExamGetPayload<{
                select: {
                    subjectClass: {
                        select: {
                            subjectClassStudent: true
                        }
                    }
                    examRooms: {
                        select: {
                            capacity: true
                            examList: true
                        }
                    }
                }
            }>
            const allStudentSubjectScores = exam.subjectClass.flatMap((e) => e.subjectClassStudent)
            const examNonRoomId = createId()
            const examListNonRoomId = createId()
            const res = await sqlTransaction([
                {
                    model: 'ExamPaper' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examCode: null,
                            examList: {
                                examRoom: {
                                    examId: selectedExamId,
                                },
                            },
                        },
                    },
                },
                {
                    model: 'ExamList' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examRoom: {
                                examId: selectedExamId,
                                roomId: null,
                            },
                        },
                    },
                },
                {
                    model: 'ExamRoom' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examId: selectedExamId,
                            roomId: null,
                        },
                    },
                },
                {
                    model: 'ExamRoom' as const,
                    operation: 'create',
                    data: {
                        data: {
                            id: examNonRoomId,
                            examId: selectedExamId,
                            roomId: null,
                        },
                    },
                },
                {
                    model: 'ExamList' as const,
                    operation: 'create',
                    data: {
                        data: {
                            id: examListNonRoomId,
                            examRoomId: examNonRoomId,
                        },
                    },
                },
                ...allStudentSubjectScores.map((studentSubjectScore) => ({
                    model: 'ExamPaper' as const,
                    operation: 'create',
                    data: {
                        data: {
                            studentSubjectScoreId: studentSubjectScore.id,
                            examListId: examListNonRoomId,
                        },
                    },
                })),
            ])
            if (res.status !== 200) {
                throw new Error('Lấy điểm thất bại')
            }
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'ExamPaper'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'ExamList'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'Exam'],
            })
            message.success('Lấy điểm thành công')
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau!')
        } finally {
            hideSpinner()
        }
    }

    const handlePhanPhongThi = async () => {
        try {
            showSpinner()
            const resExam = await sqlTransaction([
                {
                    model: 'Exam' as const,
                    operation: 'findUnique',
                    data: {
                        where: {
                            id: selectedExamId,
                        },
                        select: {
                            subjectClass: {
                                select: {
                                    subjectClassStudent: true,
                                },
                            },
                            examRooms: {
                                include: {
                                    examList: true,
                                },
                            },
                        },
                    },
                },
            ])
            if (resExam.status !== 200 || !resExam.data) {
                throw new Error('Lấy kế hoạch thi thất bại')
            }
            const exam = resExam.data[0] as Prisma.ExamGetPayload<{
                select: {
                    subjectClass: {
                        select: {
                            subjectClassStudent: true
                        }
                    }
                    examRooms: {
                        select: {
                            capacity: true
                            examList: true
                        }
                    }
                }
            }>
            const allStudentSubjectScores = exam.subjectClass.flatMap((e) => e.subjectClassStudent)
            const allExamLists = exam.examRooms.flatMap((er) =>
                er.examList.map((el) => ({
                    ...el,
                    capacity: er.capacity,
                    studentSubjectScores: [] as typeof allStudentSubjectScores,
                }))
            )
            for (const el of allExamLists) {
                const capacity = el.capacity || 0
                for (let i = 0; i < capacity; i++) {
                    const studentSubjectScore = allStudentSubjectScores.shift()
                    if (!studentSubjectScore) {
                        break
                    }
                    el.studentSubjectScores.push(studentSubjectScore)
                }
            }
            const examNonRoomId = createId()
            const examListNonRoomId = createId()
            const res = await sqlTransaction([
                {
                    model: 'ExamPaper' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examCode: null,
                            examList: {
                                examRoom: {
                                    examId: selectedExamId,
                                },
                            },
                        },
                    },
                },
                {
                    model: 'ExamList' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examRoom: {
                                examId: selectedExamId,
                                roomId: null,
                            },
                        },
                    },
                },
                {
                    model: 'ExamRoom' as const,
                    operation: 'deleteMany',
                    data: {
                        where: {
                            examId: selectedExamId,
                            roomId: null,
                        },
                    },
                },
                {
                    model: 'ExamRoom' as const,
                    operation: 'create',
                    data: {
                        data: {
                            id: examNonRoomId,
                            examId: selectedExamId,
                            roomId: null,
                        },
                    },
                },
                {
                    model: 'ExamList' as const,
                    operation: 'create',
                    data: {
                        data: {
                            id: examListNonRoomId,
                            examRoomId: examNonRoomId,
                        },
                    },
                },
                ...allStudentSubjectScores.map((studentSubjectScore) => ({
                    model: 'ExamPaper' as const,
                    operation: 'create',
                    data: {
                        data: {
                            studentSubjectScoreId: studentSubjectScore.id,
                            examListId: examListNonRoomId,
                        },
                    },
                })),
                ...allExamLists
                    .flatMap((examList) =>
                        examList.studentSubjectScores.map((sss) => ({
                            examListId: examList.id,
                            studentSubjectScoreId: sss.id,
                        }))
                    )
                    .map(({ examListId, studentSubjectScoreId }) => ({
                        model: 'ExamPaper' as const,
                        operation: 'create',
                        data: {
                            data: {
                                studentSubjectScoreId: studentSubjectScoreId,
                                examListId: examListId,
                            },
                        },
                    })),
            ])
            if (res.status !== 200) {
                throw new Error('Lấy điểm thất bại')
            }
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'ExamPaper'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'ExamList'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'Exam'],
            })
            message.success('Lấy điểm thành công')
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau!')
        } finally {
            hideSpinner()
        }
    }

    const handleSaveExamDecision = async () => {
        try {
            showSpinner()
            const values = form.getFieldsValue()
            const valueListObject = Object.entries(values.list).map(([key, value_]) => {
                return {
                    id: key,
                    ...value_,
                }
            })

            const filteredValues = valueListObject.filter(
                (item) => item.examPostponed || item.examPostponedReason
            )

            const updateTransactions: SqlTransactionBodyItem[] = filteredValues.map((i) => ({
                model: 'StudentSubjectScore',
                operation: 'update',
                data: {
                    where: {
                        id: i.id,
                    },
                    data: {
                        examPostponed: i.examPostponed ?? false,
                        examPostponedReason: i.examPostponed ? i.examPostponedReason || null : null,
                    },
                },
            }))

            const res = await sqlTransaction(updateTransactions)

            if (res.status === 200) {
                message.success('Cập nhật thành công')
            }

            console.log(valueListObject)
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau!')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        if (selectedExamId && data.length > 0) {
            form.setFieldsValue({
                list: data
                    .flatMap((e) => e.examPapers)
                    .reduce(
                        (acc, cur) => {
                            acc[cur.studentSubjectScoreId] = {
                                examPostponed: cur?.studentSubjectScore?.examPostponed ?? false,
                                examPostponedReason:
                                    cur?.studentSubjectScore?.examPostponedReason ?? undefined,
                                description: cur?.studentSubjectScore?.description ?? undefined,
                            }
                            return acc
                        },
                        {} as StudentSubjectScoreFormType['list']
                    ),
            })
        }
    }, [selectedExamId, data, form])

    return (
        <Row gutter={16}>
            <Col span={24}>
                <Row gutter={16} align="middle">
                    <Col span={24}>
                        <Flex justify="end" align="center" gap={12}>
                            <Button type="primary" onClick={handleLayDiemCCTX}>
                                1. Lấy điểm SV
                            </Button>
                            <Button
                                type="primary"
                                className="bg-orange-500"
                                onClick={handleSaveExamDecision}
                            >
                                Lưu hoãn thi
                            </Button>
                            <Checkbox
                                indeterminate={
                                    !examData?.subjectClass.every((sc) => sc.isLockScore) &&
                                    examData?.subjectClass.some((sc) => sc.isLockScore)
                                }
                                onChange={async (e) => {
                                    try {
                                        await updateExamData({
                                            where: {
                                                id: selectedExamId || '',
                                            },
                                            data: {
                                                subjectClass: {
                                                    updateMany: {
                                                        data: {
                                                            isLockScore: e.target.checked,
                                                        },
                                                        where: {},
                                                    },
                                                },
                                            },
                                        })
                                    } catch (error) {}
                                }}
                                disabled={examData?.lockExamSessions}
                                checked={examData?.subjectClass.every((sc) => sc.isLockScore)}
                            >
                                Khóa nhập ĐQT
                            </Checkbox>
                            <Checkbox
                                onChange={async (e) => {
                                    try {
                                        await updateExamData({
                                            where: {
                                                id: selectedExamId || '',
                                            },
                                            data: {
                                                lockExamSessions: e.target.checked,
                                                subjectClass: e.target.checked
                                                    ? {
                                                          updateMany: {
                                                              data: {
                                                                  isLockScore: e.target.checked,
                                                              },
                                                              where: {},
                                                          },
                                                      }
                                                    : {},
                                            },
                                        })
                                    } catch (error) {}
                                }}
                                checked={examData?.lockExamSessions}
                            >
                                Khóa danh sách thi
                            </Checkbox>
                            <Button type="primary" onClick={handlePhanPhongThi}>
                                2. Phân phòng thi
                            </Button>
                            <Button type="dashed">Xuất DS thi</Button>
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
                            record.examRoom?.room
                                ? `Phòng thi: ${record.examRoom?.room?.name} - Ca ${record.start} ${record.examRoom?.capacity ? ` : ${record.examRoom?.capacity}` : ''}`
                                : 'Chưa phân phòng thi'
                        }
                        childrenFieldName="examPapers"
                        defaultExpandAll
                        data={data}
                        pagination={false}
                        loading={isLoading}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                width: 100,
                                render: (_, record) =>
                                    record?.studentSubjectScore?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 220,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <div className="text-left">
                                            {record?.studentSubjectScore?.student?.userProfile
                                                ?.fullname || ''}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Ngày sinh',
                                width: 80,
                                align: 'center',
                                render: (_, record) => {
                                    const dob =
                                        record?.studentSubjectScore?.student?.userProfile
                                            ?.dateOfBirth
                                    return dob ? formatDate(dob) : undefined
                                },
                            },
                            {
                                title: 'Tên lớp',
                                width: 280,
                                render: (_, record) =>
                                    `${record?.studentSubjectScore?.student?.fixedClass?.name || ''}-${
                                        record?.studentSubjectScore?.student?.fixedClass
                                            ?.trainingCourse?.name || ''
                                    }`,
                            },
                            {
                                title: 'Điểm CC',
                                width: 70,
                                align: 'center',
                                render: (_, record) =>
                                    record?.studentSubjectScore?.attendanceScore || '',
                            },
                            {
                                title: 'Điểm TX',
                                align: 'center',
                                width: 70,
                                render: (_, record) =>
                                    record?.studentSubjectScore?.midtermScore || '',
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                width: 70,
                                render: (_, record) => record?.studentSubjectScore?.examScore || '',
                            },
                            {
                                title: 'Cấm thi',
                                align: 'center',
                                width: 80,
                                render: (_, record) => {
                                    return (
                                        <Checkbox
                                            checked={record?.studentSubjectScore?.examBanned}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Lý do cấm thi',
                                render: (_, record) => {
                                    return record?.studentSubjectScore?.examBannedReason
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
                                title: 'Lý do hoãn thi',
                                render: (_, record) => {
                                    const examPostponed = listForm[record.studentSubjectScoreId]?.examPostponed
                                    return (
                                        <Form.Item
                                            name={['list', record.studentSubjectScoreId, 'examPostponedReason']}
                                            className="m-0"
                                        >
                                            {!examPostponed ? (
                                                <Input readOnly variant="underlined" />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do hoãn thi"
                                                    options={examPostponeReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!examPostponed}
                                                />
                                            )}
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
                                            name={['list', record.id, 'description']}
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
