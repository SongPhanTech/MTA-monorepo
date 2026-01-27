import Table from '@components/commons/table'
import { examSuspendedReason } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { kythiStore } from '@pages/quan-ly-diem/nhap-diem-theo-phach'
import { useStore } from '@tanstack/react-store'
import {
    useFindManyExamPaper,
    useFindManyExamRoom,
    useUpdateManyExamList,
    useUpdateManySubjectClass,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { SqlTransactionBodyItem } from '@workspace/libs/api/schemas'
import { getExportSubjectClassScoreUrl, useGenExamListCode } from '@workspace/libs/api/training'
import { AutoComplete, Button, Checkbox, Col, Flex, Form, Input, Modal, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { Printer } from 'lucide-react'
import { getUrl } from '@workspace/libs/api/custom-instance'
import { getRuntimeEnv } from '@workspace/libs/utils'
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
    const { examId } = useStore(kythiStore)
    const [form] = Form.useForm<StudentExamFormType>()

    const listForm = Form.useWatch('list', form) || []

    const { data: examRooms = [], refetch } = useFindManyExamRoom(
        {
            where: {
                examId,
            },
            include: {
                examList: {
                    select: {
                        lockExamCode: true,
                    },
                },
            },
        },
        { enabled: !!examId }
    )

    const { data: examPapers = [], refetch: refreshExamPaper } = useFindManyExamPaper(
        {
            where: {
                examList: {
                    examRoom: {
                        examId,
                    },
                },
            },
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
            orderBy: [
                {
                    studentSubjectScore: {
                        student: {
                            userProfile: {
                                firstName: 'asc',
                            },
                        },
                    },
                },
                {
                    studentSubjectScore: {
                        student: {
                            userProfile: {
                                lastName: 'asc',
                            },
                        },
                    },
                },
            ],
        },
        { enabled: !!examId }
    )

    const { onOpen: openXemTaiLieu } = useDisclosure<{
        uri: string
        name?: string
        mimeType?: string
        mode?: 'view' | 'edit'
        convertTo?: string
    }>({
        tag: 'XemTaiLieu',
    })

    const lockExamCode = examRooms.every((er) => er.examList.every((el) => el.lockExamCode))

    // const examPapers = useMemo(() => {
    //     if (!examRooms) return []
    //     return examRooms.flatMap((e) => e.examList.flatMap((e) => e.examPapers))
    // }, [examRooms])

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
    const { mutateAsync: updateManyExamList } = useUpdateManyExamList()
    const { mutateAsync: genCode } = useGenExamListCode()
    const { mutateAsync: updateManySubjectClass } = useUpdateManySubjectClass()
    const handleGenCode = async () => {
        const res = await genCode({
            data: { examId: examId ?? '' },
        })
        if (res?.status === 200) {
            message.success('Sinh phách thành công')
            refetch()
            refreshExamPaper()
        }
    }

    const { showSpinner, hideSpinner } = useSpinner()

    useEffect(() => {
        if (examId) {
            form.setFieldsValue({
                list: examPapers.reduce(
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
    }, [examId, examPapers, form])

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
                                await updateManyExamList({
                                    where: {
                                        examRoom: {
                                            examId,
                                        },
                                    },
                                    data: { lockExamCode: e.target.checked },
                                })
                                await updateManySubjectClass({
                                    where: {
                                        exam: {
                                            examRooms: {
                                                some: {
                                                    examList: {
                                                        some: {
                                                            id: examId ?? '',
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    data: {
                                        isLockExamScore: e.target.checked,
                                    },
                                })
                            } catch (error) {}
                        }}
                        checked={lockExamCode}
                    >
                        Khoá sinh phách
                    </Checkbox>
                    <Flex justify="end" align="center" gap={8}>
                        <Button
                            type="primary"
                            className="bg-orange-500"
                            disabled={lockExamCode}
                            onClick={handleSaveExamSuspended}
                        >
                            Lưu đình chỉ thi
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                handleSave()
                            }}
                            disabled={lockExamCode}
                        >
                            Tạo phách
                        </Button>
                        <Button
                            onClick={() => {
                                openXemTaiLieu({
                                    uri: getUrl(
                                        getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') ||
                                            'https://api.daotao.mta.swantech.vn',
                                        `${getExportSubjectClassScoreUrl({
                                            examId: examId,
                                            type: 'DANH-SACH-PHACH',
                                        })}`
                                    ),
                                    name: 'Danh sách phách',
                                    mimeType: 'xlsx',
                                    convertTo: 'pdf',
                                })
                            }}
                        >
                            <Printer />
                            In phách
                        </Button>
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
                                    record?.studentSubjectScore?.attendanceScore ?? '',
                            },
                            {
                                title: 'Điểm TX',
                                align: 'center',
                                width: 70,
                                render: (_, record) =>
                                    record?.studentSubjectScore?.midtermScore ?? '',
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                width: 70,
                                render: (_, record) => record?.studentSubjectScore?.examScore ?? '',
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
                                            <Checkbox
                                                disabled={lockExamCode}
                                                onChange={(e) => {
                                                    if (!e.target.checked) {
                                                        form.setFieldValue(
                                                            [
                                                                'list',
                                                                record.studentSubjectScoreId,
                                                                'suspendedReason',
                                                            ],
                                                            undefined
                                                        )
                                                    }
                                                }}
                                            />
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
                                                <Input.TextArea
                                                    autoSize
                                                    readOnly
                                                    variant="underlined"
                                                />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do đình chỉ thi"
                                                    options={examSuspendedReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!suspended}
                                                >
                                                    <Input.TextArea
                                                        autoSize
                                                        readOnly
                                                        variant="underlined"
                                                    />
                                                </AutoComplete>
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
                                            <Input.TextArea
                                                autoSize
                                                variant="underlined"
                                                placeholder="Nhập ghi chú"
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                        ]}
                        scrollable
                        maxHeight={'calc(100vh - 390px)'}
                        data={examPapers}
                        pagination={false}
                    />
                </Form>
            </Col>
        </div>
    )
}
