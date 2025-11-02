import Table from '@components/commons/table'
import ExportPhach from '@components/modal/export-exam-session'
import { useFindUniqueExamRoom, useUpdateExamRoom } from '@workspace/db/hooks'
import { useGenExamRoomCode } from '@workspace/libs/api/training'
import { Button, Checkbox, Col, Flex, Modal, message } from 'antd'
import { useRouter } from 'next/router'

export default function SinhPhach({ examRoomId }: { examRoomId: string }) {
    const router = useRouter()
    const { data: examRoom, refetch } = useFindUniqueExamRoom(
        {
            where: { id: examRoomId },
            include: {
                examSessions: {
                    include: {
                        studentSubjectScore: {
                            include: {
                                student: {
                                    include: {
                                        userProfile: true,
                                        fixedClass: true,
                                    },
                                },
                                subjectClass: {
                                    include: {
                                        fixedClasses: {
                                            include: {
                                                trainingCourse: true,
                                            },
                                        },
                                    },
                                },
                                subjectVersion: true,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!examRoomId }
    )
    const handleSave = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn sinh phách không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleGenCode()
            },
        })
    }
    const { mutateAsync: genCode } = useGenExamRoomCode()
    const { mutateAsync: updateExamRoom } = useUpdateExamRoom()
    const handleGenCode = async () => {
        const res = await genCode({
            data: {
                examRoomId,
            },
        })
        if (res?.status === 200) {
            message.success('Sinh phách thành công')
            refetch()
        }
    }
    return (
        <>
            <Col span={24}>
                <Flex justify="space-between" align="center">
                    <Checkbox checked={examRoom?.lockExamCode}>Khoá sinh phách</Checkbox>
                    <Flex justify="end" align="center">
                        <ExportPhach data={examRoom?.examSessions || []} />
                        <Button
                            type="primary"
                            className="ml-3"
                            onClick={() => {
                                handleSave()
                            }}
                            disabled={examRoom?.lockExamCode}
                        >
                            Tạo phách
                        </Button>
                    </Flex>
                </Flex>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="id"
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Mã học sinh',
                            dataIndex: 'name',
                            width: 150,
                            render: (_, record: any) =>
                                record?.studentSubjectScore?.student?.userProfile?.code || '',
                        },
                        {
                            title: 'Tên thí sinh',
                            dataIndex: 'fullname',
                            render: (_, record: any) =>
                                `${record?.studentSubjectScore?.student?.userProfile?.lastName} ${record?.studentSubjectScore?.student?.userProfile?.firstName}` ||
                                '',
                        },
                        {
                            title: 'Phách',
                            dataIndex: 'name',
                            width: 150,
                            render: (_, record: any) => record?.examCode || '',
                        },
                    ]}
                    data={examRoom?.examSessions || []}
                    pagination={false}
                />
            </Col>
        </>
    )
}
