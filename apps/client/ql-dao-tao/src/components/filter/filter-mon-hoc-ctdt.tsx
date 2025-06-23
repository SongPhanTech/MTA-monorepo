import { FilterOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import type { TrainingObjectType } from '@workspace/db'
import {
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Popover,
    Row,
    Space,
    Typography,
} from 'antd'
import { X } from 'lucide-react'
import { useState } from 'react'
const { Text } = Typography

interface FilterProps {
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
}

interface Props {
    filters: FilterProps

    setFilters: any

    debouncedRefetch: any
}

const FilterMonHocCTDT = (props: Props) => {
    const { filters, setFilters, debouncedRefetch } = props
    const [form] = Form.useForm<FilterProps>()
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.resetFields()
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

    const handleApply = () => {
        console.log('filters', form.getFieldsValue())
        const values = form.getFieldsValue()

        const newFilters = {
            ...filters,
            ...values,
        }
        setFilters(newFilters)
        setOpen(false)
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

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
                <Text style={{ fontSize: '1rem' }}>Bộ lọc</Text>
                <Button
                    type="text"
                    icon={<X size={20} />}
                    onClick={() => setOpen(false)}
                    size="small"
                    style={{ marginRight: -8 }}
                />
            </div>

            <div style={{ padding: '0 16px 10px' }}>
                <Form form={form} layout="horizontal" className="mt-4">
                    <Row gutter={[10, 10]}>
                        <Col span={24}>
                            <Form.Item
                                className="mb-2"
                                label="Đối tượng đào tạo"
                                name="trainingObjectId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn đối tượng đào tạo"
                                    options={trainingObjectTypeData.map(
                                        (i: TrainingObjectType) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingObjectTypeId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                className="mb-0"
                                label="Khóa đào tạo"
                                name="trainingCourseId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn khoá đào tạo"
                                    options={trainingCourseData.map(
                                        (i: TrainingObjectType) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingLevelId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Button onClick={handleReset} style={{ background: '#f5f5f5' }}>
                    Bỏ lọc
                </Button>
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
            <Popover
                content={filterContent}
                trigger="click"
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                align={{
                    offset: [100, 0],
                }}
                arrow={false}
                overlayStyle={{
                    width: 450,
                }}
                overlayInnerStyle={{
                    padding: 0,
                }}
                destroyTooltipOnHide
            >
                <Button
                    icon={<FilterOutlined />}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </Popover>
        </Flex>
    )
}

export default FilterMonHocCTDT
