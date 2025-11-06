import Table from '@components/commons/table'
import { diemPhongThiStore } from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useFindUniqueExamList } from '@workspace/db/hooks'
import { useSaveExamScore } from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, InputNumber, Modal, message } from 'antd'
import { useMemo } from 'react'

export default function NhapDiemPhach() {
    const [form] = Form.useForm<{ list: { score: number | null }[] }>()
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
    const disabled = useMemo(() => {
        return examList?.lockExamCode || true
    }, [examList?.lockExamCode])

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
    const { mutateAsync: saveScore } = useSaveExamScore()

    // const listForm = Form.useWatch('list', form) || []
    const handleGenCode = async () => {
        const dataForm = form.getFieldsValue()
        const dataSubmit = Object.entries(dataForm.list).map(([key, value_]) => {
            return {
                id: key,
                ...value_,
            }
        })
        const res = await saveScore({
            data: dataSubmit,
        })
        if (res?.status === 200) {
            message.success('Sinh phách thành công')
            refetch()
        }
    }
    return (
        <>
            <Col span={24}>
                <Flex justify="end" align="center">
                    <Button
                        type="primary"
                        onClick={() => {
                            handleSave()
                        }}
                        disabled={disabled}
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
                                    render: (_, record: any) => record?.examCode || '',
                                },
                                {
                                    title: 'Điểm',
                                    width: 200,
                                    align: 'center',
                                    fixed: 'left',
                                    render: (_, record) => {
                                        return (
                                            <Form.Item
                                                className="w-full mb-0"
                                                name={['list', record.id, 'score']}
                                                label=""
                                            >
                                                <InputNumber
                                                    min={0}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    step={0}
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
        </>
    )
}
