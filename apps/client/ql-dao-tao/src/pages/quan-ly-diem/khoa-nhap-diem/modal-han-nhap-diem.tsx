import {
    CalendarOutlined,
    CloseOutlined,
    ControlOutlined,
    FilterOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import type { SubjectClass } from '@workspace/db'
import { useUpdateSubjectClass } from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
    Col,
    DatePicker,
    Divider,
    Flex,
    Form,
    Input,
    Modal,
    Popover,
    Row,
    //   Select,
    Space,
    Switch,
    Tag,
    Typography,
} from 'antd'
import { Calendar, Check, Search, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
const { Text } = Typography
import dayjs from 'dayjs'
import 'dayjs/locale/vi' // Import Vietnamese locale for dayjs
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { date } from 'zod'

dayjs.extend(customParseFormat)
// export type DataProps = {
//     isLockExamScore?: boolean
//     isLockScore?: boolean
//     examScoreDeadline?: Date | null
//     scoreDeadline?: Date | null
// }

interface Props {
    onFilterChange: any
    data: SubjectClass | null
    onApply: (data: SubjectClass) => void
}

const HanNhapDiem = (props: Props) => {
    const { onFilterChange, data, onApply } = props
    const [form] = Form.useForm<SubjectClass>()
    const [open, setOpen] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.setFieldsValue({
            isLockExamScore: false,
            isLockScore: false,
            examScoreDeadline: null,
            scoreDeadline: null,
        })

        console.log('Reset filters', form.getFieldsValue())
        onApply(form.getFieldsValue())
        setOpen(false)
    }
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    const handleEditDate = () => {
        if (data?.examDate) {
            const examDate = new Date(data.examDate)
            const examScoreDeadline = new Date(
                form.getFieldValue('examScoreDeadline')
            )
            data.examScoreDeadline = examScoreDeadline
            if (
                data.examScoreDeadline <
                new Date(new Date().setHours(24, 0, 0, 0))
            ) {
                data.isLockExamScore = true
            } else if (examDate > new Date(new Date().setHours(24, 0, 0, 0))) {
                data.isLockExamScore = true
            } else {
                data.isLockExamScore = false
            }

            const scoreDeadline = new Date(form.getFieldValue('scoreDeadline'))
            data.scoreDeadline = scoreDeadline
            if (
                data.scoreDeadline < new Date(new Date().setHours(24, 0, 0, 0))
            ) {
                data.isLockScore = true
            } else {
                data.isLockScore = false
            }
            updateSubjectClass({
                where: { id: data.id },
                data: {
                    examScoreDeadline,
                    isLockExamScore: data.isLockExamScore,
                    scoreDeadline,
                    isLockScore: data.isLockScore,
                },
            }).catch((error) => {
                console.error(
                    'Error updating examScoreDeadline for item:',
                    data.id,
                    error
                )
            })
        }
    }

    const handleApply = () => {
        handleEditDate()
        setOpen(false)
        setIsActive(true)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

    useEffect(() => {
        console.log('Filter values updated:', data)
        form.setFieldsValue({
            isLockExamScore: data?.isLockExamScore || false,
            isLockScore: data?.isLockScore || false,
            examScoreDeadline: data?.examScoreDeadline
                ? dayjs(data.examScoreDeadline)
                : null,
            scoreDeadline: data?.scoreDeadline
                ? dayjs(data.scoreDeadline)
                : null,
        })
    }, [data, form])

    const filterContent = (
        <div style={{ width: '100%', borderRadius: '10px' }}>
            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#E5E7EB',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                }}
            >
                <Text style={{ fontSize: '1rem' }}>
                    Điều chỉnh hạn nhập điểm
                </Text>
                {/* <Button
                    type="text"
                    icon={<X size={20} />}
                    onClick={() => setOpen(false)}
                    size="small"
                    style={{ marginRight: -8 }}
                /> */}
            </div>

            <div style={{ padding: '0 16px' }}>
                <Form form={form} layout="horizontal" className="mt-4">
                    <Row gutter={[10, 0]}>
                        <Col span={12}>
                            <Col span={24}>
                                <Form.Item
                                    label="Khóa điểm CC, TX"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                    name="isLockScore"
                                >
                                    {data?.isLockScore ? (
                                        <Tag color="red">Đã khóa</Tag>
                                    ) : (
                                        <Tag color="green">Chưa khóa</Tag>
                                    )}
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item
                                    label="Khóa điểm thi"
                                    name="isLockExamScore"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    {data?.isLockExamScore ? (
                                        <Tag color="red">Đã khóa</Tag>
                                    ) : (
                                        <Tag color="green">Chưa khóa</Tag>
                                    )}
                                </Form.Item>
                            </Col>
                        </Col>
                        <Col span={12}>
                            <Col span={24}>
                                <Form.Item
                                    label="Hạn nhập điểm CC, TX "
                                    name="scoreDeadline"
                                    labelCol={{ span: 10 }}
                                    wrapperCol={{ span: 14 }}
                                    labelAlign="left"
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        placeholder="Chọn ngày"
                                        format="DD/MM/YYYY"
                                        onChange={(date, dateString) => {
                                            console.log(
                                                'Selected date:',
                                                date,
                                                dateString
                                            )
                                            form.setFieldsValue({
                                                scoreDeadline: dayjs(date),
                                            })
                                        }}
                                        // value={form.getFieldValue('scoreDeadline')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Hạn nhập điểm thi "
                                    name="examScoreDeadline"
                                    labelCol={{ span: 10 }}
                                    wrapperCol={{ span: 14 }}
                                    labelAlign="left"
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        placeholder="Chọn ngày"
                                        format="DD/MM/YYYY"
                                        onChange={(date, dateString) => {
                                            form.setFieldsValue({
                                                examScoreDeadline: dayjs(date),
                                            })
                                        }}
                                        // value={form.getFieldValue('examScoreDeadline')}
                                    />
                                </Form.Item>
                            </Col>
                        </Col>
                    </Row>
                </Form>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}
            >
                {/* <Button onClick={handleReset} style={{ background: '#f5f5f5' }}>
                    Bỏ lọc
                </Button> */}
                <Space>
                    <Button onClick={handleCancel}>Hủy</Button>
                    <Button type="primary" onClick={handleApply}>
                        Áp dụng
                    </Button>
                </Space>
            </div>
        </div>
    )

    return (
        <Flex>
            <>
                <Button
                    icon={<CalendarOutlined />}
                    onClick={() => setOpen(true)}
                    style={{
                        height: '40px',
                        width: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
                <Modal
                    visible={open}
                    onCancel={handleCancel}
                    footer={null}
                    width={900}
                    destroyOnClose
                >
                    {filterContent}
                </Modal>
            </>
        </Flex>
    )
}

export default HanNhapDiem
