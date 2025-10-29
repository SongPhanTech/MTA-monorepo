import Table from '@components/commons/table'
import ExportPhach from '@components/modal/export-exam-session'
import { useFindManyExamSession, useUpdateExamRoom } from '@workspace/db/hooks'
import { useGenExamRoomCode } from '@workspace/libs/api/training'
import { Button, Checkbox, Col, Flex, Modal, message } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function SinhPhach({ examRoomId }: { examRoomId: string }) {
    const router = useRouter()
    const [checked, setChecked] = useState(false)
    const { data = [], refetch } = useFindManyExamSession(
        {
            where: {
                examRoomId,
            },
            include: {
                exam: true,
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
        {
            enabled: !!examRoomId,
        }
    )
    const disabled = useMemo(() => {
        const item = data[0]
        return !(item?.exam?.lockExamCode || true)
    }, [data])
    const handleSave = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn sinh phách không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                hanldeGenCode()
            },
        })
    }
    const { mutateAsync: genCode } = useGenExamRoomCode()
    const { mutateAsync: updateExamRoom } = useUpdateExamRoom()
    const hanldeGenCode = async () => {
        const res = await genCode({
            data: {
                examRoomId,
            },
        })
        if (res?.status === 200) {
            message.success('Sinh phách thành công')
            refetch()
        }
        if (checked !== data[0]?.exam?.lockExamCode) {
            await updateExamRoom({
                where: {
                    id: examRoomId,
                },
                data: {
                    lockExamCode: checked,
                },
            })
        }
    }
    return (
        <>
            <Col span={24}>
                <Flex justify="space-between" align="center">
                    <Checkbox
                        defaultChecked={checked}
                        onChange={(value) => {
                            setChecked(value.target.checked)
                        }}
                    >
                        Khoá sinh phách
                    </Checkbox>
                    <Flex justify="end" align="center">
                        <ExportPhach data={data} />
                        <Button
                            type="primary"
                            className="ml-3"
                            onClick={() => {
                                handleSave()
                            }}
                            disabled={disabled}
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
                    data={data}
                    pagination={false}
                />
            </Col>
        </>
    )
}
