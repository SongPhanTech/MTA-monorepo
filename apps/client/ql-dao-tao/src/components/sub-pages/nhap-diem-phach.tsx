import Table from '@components/commons/table'
import { useFindManyExamSession } from '@workspace/db/hooks'
import {  useSaveExamScore } from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, InputNumber, message, Modal } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export default function NhapdiemPhach() {
    const router = useRouter()
    const [form] = Form.useForm<{list:{score: number|null}[]}>()
    const examRoomId = router.query.examRoomId as string
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
                            },
                        },
                    },
                },
            },
            orderBy:{
                examCode: 'asc'
            }
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
    const { mutateAsync: saveScore } = useSaveExamScore()

        // const listForm = Form.useWatch('list', form) || []
    const hanldeGenCode = async () => {
        const dataForm=form.getFieldsValue()
        const dataSubmit= Object.entries(dataForm.list).map(([key, value_]) => {
                return {
                    id: key,
                    ...value_
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
                                                                    name={[
                                                                        'list',
                                                                        record.id,
                                                                        'score',
                                                                    ]}
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
                    data={data}
                    pagination={false}
                />
                                                    </Form.Item>
                                                </Form>
               
            </Col>
        </>
    )
}
