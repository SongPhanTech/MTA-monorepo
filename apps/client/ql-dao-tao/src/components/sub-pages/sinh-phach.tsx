import Table from '@components/commons/table'
import ExportPhach from '@components/modal/export-exam-session'
import { examSuspendedReason } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { diemPhongThiStore } from '@pages/quan-ly-diem/nhap-diem-theo-phach'
import { useStore } from '@tanstack/react-store'
import { useFindUniqueExamList, useUpdateExamList } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { SqlTransactionBodyItem } from '@workspace/libs/api/schemas'
import { useGenExamListCode } from '@workspace/libs/api/training'
import { AutoComplete, Button, Checkbox, Col, Flex, Form, Input, Modal, message } from 'antd'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
interface StudentExamFormType {
    list: Record<
        string,
        {
            suspended?: boolean
            suspendedReason?: string
            description?: string
        }
    >
}

export default function SinhPhach() {
    const router = useRouter()
    const { selectedExamListId } = useStore(diemPhongThiStore)
    const [form] = Form.useForm<StudentExamFormType>()

    const listForm = Form.useWatch('list', form) || []

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

    const { showSpinner, hideSpinner } = useSpinner()

    useEffect(() => {
        if (selectedExamListId && examList?.examPapers && examList?.examPapers?.length > 0) {
            form.setFieldsValue({
                list: examList?.examPapers.reduce(
                    (acc, cur) => {
                        acc[cur.studentSubjectScoreId] = {
                            suspended: cur?.studentSubjectScore?.suspended ?? false,
                            suspendedReason: cur?.studentSubjectScore?.suspendedReason ?? undefined,
                            description: cur?.studentSubjectScore?.description ?? undefined,
                        }
                        return acc
                    },
                    {} as StudentExamFormType['list']
                ),
            })
        }
    }, [selectedExamListId, examList, form])

    const handleSaveExamSuspended = async () => {
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
                (item) => item.suspended || item.suspendedReason
            )

            const updateTransactions: SqlTransactionBodyItem[] = filteredValues.map((i) => ({
                model: 'StudentSubjectScore',
                operation: 'update',
                data: {
                    where: {
                        id: i.id,
                    },
                    data: {
                        suspended: i.suspended ?? false,
                        suspendedReason: i.suspended ? i.suspendedReason || null : null,
                    },
                },
            }))
            const res = await sqlTransaction(updateTransactions)
            if (res.status === 200) {
                message.success('Cập nhật thành công')
            }
        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau!')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
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
                    <Flex justify="end" align="center" gap={8}>
                        <Button
                            type="primary"
                            className="bg-orange-500"
                            onClick={handleSaveExamSuspended}
                        >
                            Lưu đình chỉ thi
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                handleSave()
                            }}
                            disabled={examList?.lockExamCode}
                        >
                            Tạo phách
                        </Button>
                        <ExportPhach data={examList?.examPapers || []} />
                    </Flex>
                </Flex>
            </Col>
            <Col span={24}>
                <Form form={form} initialValues={{ list: {} }}>
                    <Table
                        rowKey="id"
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
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
                                title: 'Phách',
                                dataIndex: 'name',
                                width: 100,
                                align: 'center',
                                render: (_, record) => record?.examCode || '',
                            },
                            {
                                title: 'Đình chỉ thi',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={[
                                                'list',
                                                record.studentSubjectScoreId,
                                                'suspended',
                                            ]}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox disabled={examList?.lockExamCode} />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Lý do đình chỉ thi',
                                render: (_, record) => {
                                    const suspended =
                                        listForm[record.studentSubjectScoreId]?.suspended
                                    return (
                                        <Form.Item
                                            name={[
                                                'list',
                                                record.studentSubjectScoreId,
                                                'suspendedReason',
                                            ]}
                                            className="m-0"
                                        >
                                            {!suspended ? (
                                                <Input readOnly variant="underlined" />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do đình chỉ thi"
                                                    options={examSuspendedReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!suspended}
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
                        data={examList?.examPapers || []}
                        pagination={false}
                    />
                </Form>
            </Col>
        </div>
    )
}
