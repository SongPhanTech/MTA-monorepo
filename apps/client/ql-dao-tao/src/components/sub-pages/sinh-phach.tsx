import Table from '@components/commons/table'
import ExportPhach from '@components/modal/export-exam-session'
import { diemPhongThiStore } from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useFindUniqueExamList, useUpdateExamList } from '@workspace/db/hooks'
import { useGenExamListCode } from '@workspace/libs/api/training'
import { Button, Checkbox, Col, Flex, Modal, message } from 'antd'
import { useRouter } from 'next/router'

export default function SinhPhach() {
    const router = useRouter()
    const { selectedExamListId } = useStore(diemPhongThiStore)
    const { data: examList, refetch } = useFindUniqueExamList(
        {
            where: { id: selectedExamListId },
            include: {
                examPapers: {
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
        { enabled: !!selectedExamListId }
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
    const { mutateAsync: genCode } = useGenExamListCode()
    const { mutateAsync: updateExamList } = useUpdateExamList()
    const handleGenCode = async () => {
        const res = await genCode({
            data: { examListId: selectedExamListId ?? '' },
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
                    <Checkbox
                        onChange={async (e) => {
                            try {
                                await updateExamList({
                                    where: { id: selectedExamListId ?? '' },
                                    data: { lockExamCode: e.target.checked },
                                })
                            } catch (error) {}
                        }}
                        checked={examList?.lockExamCode}
                    >
                        Khoá sinh phách
                    </Checkbox>
                    <Flex justify="end" align="center">
                        <ExportPhach data={examList?.examPapers || []} />
                        <Button
                            type="primary"
                            className="ml-3"
                            onClick={() => {
                                handleSave()
                            }}
                            disabled={examList?.lockExamCode}
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
                            title: 'Mã SV',
                            dataIndex: 'name',
                            width: 150,
                            render: (_, record) =>
                                record?.studentSubjectScore?.student?.userProfile?.code || '',
                        },
                        {
                            title: 'Tên thí sinh',
                            dataIndex: 'fullname',
                            render: (_, record) =>
                                `${record?.studentSubjectScore?.student?.userProfile?.lastName} ${record?.studentSubjectScore?.student?.userProfile?.firstName}` ||
                                '',
                        },
                        {
                            title: 'Phách',
                            dataIndex: 'name',
                            width: 150,
                            render: (_, record) => record?.examCode || '',
                        },
                    ]}
                    data={examList?.examPapers || []}
                    pagination={false}
                />
            </Col>
        </>
    )
}
