import Table from '@components/commons/table'
import { useStore } from '@tanstack/react-store'
import { useFindManyExamPaper } from '@workspace/db/hooks'
import { getExportSubjectClassScoreUrl, useSaveExamScore } from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, InputNumber, Modal, message } from 'antd'
import { useEffect } from 'react'
import { validateExamScore } from '@lib/utils'
import { kythiStore } from '@pages/quan-ly-diem/nhap-diem-theo-phach'
import { Printer } from 'lucide-react'
import { getRuntimeEnv } from '@workspace/libs/utils'
import { getUrl } from '@workspace/libs/api/custom-instance'
import { useDisclosure } from 'react-hook-disclosure-modal/dist/hook'

export default function NhapDiemPhach() {
    const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
    const { examId } = useStore(kythiStore)

    const { data: examPapers = [], refetch } = useFindManyExamPaper(
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
            orderBy: {
                examCode: 'asc',
            },
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

    // const examPapers = useMemo(() => {
    //     if (!examRooms) return []
    //     return examRooms.flatMap((e) => e.examList.flatMap((e) => e.examPapers))
    // }, [examRooms])

    useEffect(() => {
        if (examPapers) {
            form.setFieldsValue({
                list: examPapers.reduce(
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
    }, [examPapers, form])

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
                        onClick={() => {
                            openXemTaiLieu({
                                uri: getUrl(
                                    getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') ||
                                        'https://api.daotao.mta.swantech.vn',
                                    `${getExportSubjectClassScoreUrl({
                                        examId: examId,
                                        type: 'DIEM-KEM-PHACH',
                                    })}`
                                ),
                                name: 'Danh sách phách',
                                mimeType: 'xlsx',
                                convertTo: 'pdf',
                            })
                        }}
                    >
                        <Printer />
                        In phiếu điểm kèm phách
                    </Button>
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
                            maxHeight={'calc(100vh - 390px)'}
                            scrollable
                            data={examPapers}
                            pagination={false}
                        />
                    </Form.Item>
                </Form>
            </Col>
        </div>
    )
}
