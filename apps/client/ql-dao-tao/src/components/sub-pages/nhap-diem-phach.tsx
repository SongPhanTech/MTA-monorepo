import Table from '@components/commons/table'
import { diemPhongThiStore } from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useFindUniqueExamList } from '@workspace/db/hooks'
import { useSaveExamScore } from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, InputNumber, Modal, message } from 'antd'
import { useEffect } from 'react'
import { validateExamScore } from '@lib/utils'

export default function NhapDiemPhach() {
    const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
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
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { examCode: 'asc' },
                },
            },
        },
        { enabled: !!selectedExamListId }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <need selectedExamListId>
    useEffect(() => {
        if (examList) {
            form.setFieldsValue({
                list: examList.examPapers.reduce(
                    (acc, curr) => {
                        acc[curr.id] = {
                            score: curr.studentSubjectScore?.examScore ?? null,
                        }
                        return acc
                    },
                    {} as Record<string, { score: number | null }>
                ),
            })
        }
    }, [selectedExamListId, examList, form])

    const handleSave = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn lưu điểm không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleNhapDiem()
            },
        })
    }

    const { mutateAsync: saveScore } = useSaveExamScore()

    // const listForm = Form.useWatch('list', form) || []
    const handleNhapDiem = async () => {
        const dataForm = form.getFieldsValue()

        const dataSubmit: { score: number | null; id: string }[] = []
        for (const [key, { score }] of Object.entries(dataForm.list)) {
            try {
                await validateExamScore(score)
            } catch (_) {
                message.warning('Vui lòng kiểm tra lại điểm')
                return
            }
            dataSubmit.push({
                id: key,
                score,
            })
        }
        const res = await saveScore({
            data: dataSubmit,
        })
        if (res?.status === 200) {
            message.success('Lưu điểm thành công')
            refetch()
        }
    }
    return (
        <div className="max-w-screen-sm">
            <Col span={24}>
                <Flex justify="end" align="center">
                    <Button
                        type="primary"
                        onClick={() => {
                            handleSave()
                        }}
                    >
                        Lưu
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>
                <Form form={form}>
                    <Form.Item name="list">
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
                                    title: 'Phách',
                                    dataIndex: 'name',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'left',
                                    render: (_, record: any) => record?.examCode || '',
                                },
                                {
                                    title: 'Điểm',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'left',
                                    render: (_, record) => {
                                        return (
                                            <Form.Item
                                                className="w-full mb-0"
                                                name={['list', record.id, 'score']}
                                                label=""
                                                rules={[
                                                    {
                                                        validator: (_, value) =>
                                                            validateExamScore(value),
                                                    },
                                                ]}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    step={0.1}
                                                    controls={false}
                                                />
                                            </Form.Item>
                                        )
                                    },
                                },
                            ]}
                            data={examList?.examPapers}
                            pagination={false}
                        />
                    </Form.Item>
                </Form>
            </Col>
        </div>
    )
}
