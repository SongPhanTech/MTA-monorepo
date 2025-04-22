import React, { useState } from 'react'
import {
    Button,
    Flex,
    Input,
    Popover,
    //   Select,
    Space,
    Typography,
    Divider,
    Row,
    Col,
    Form,
} from 'antd'
import {
    FilterOutlined,
    CloseOutlined,
    SearchOutlined,
    ControlOutlined,
} from '@ant-design/icons'
import { X, Search } from 'lucide-react'
import Select from '@components/commons/select'

const { Text } = Typography

export type FilterProps = {
    priorityObjectId: string | null //Đối tượng ưu tiên
    nationalityId: string | null //Quốc tịch
    religionId: string | null //Tôn giáo
    ethnicityId: string | null //Dân tộc
}

interface Props {
    onFilterChange: any
    onSearchChange: any
}
const options = [
    {
        value: '1',
        label: 'Đối tượng 1',
    },
]

const FilterDropdown = (props: Props) => {
    const { onFilterChange, onSearchChange } = props
    const [form] = Form.useForm<FilterProps>()
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.resetFields()
    }

    const handleApply = () => {
        console.log('filters', form.getFieldsValue())
        onFilterChange(form.getFieldsValue())
        setOpen(false)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

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

            <div style={{ padding: '0 16px' }}>
                <Form form={form} layout="horizontal" className="mt-4">
                    <Row gutter={[10, 0]}>
                        <Col span={24}>
                            <Form.Item
                                label="Đối tượng ưu tiên"
                                name="priorityObjectId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn đối tượng ưu tiên"
                                    options={options}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="Quốc tịch"
                                name="nationalityId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn quốc tịch"
                                    options={options}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="Tôn giáo"
                                name="religionId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn tôn giáo"
                                    options={options}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="Dân tộc"
                                name="ethnicityId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn dân tộc"
                                    options={options}
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
            <Input
                placeholder="Nhập tên giảng viên..."
                style={{ width: 300, marginRight: 8 }}
                prefix={
                    <Search
                        size={15}
                        style={{ color: 'rgba(0, 0, 0, 0.25)' }}
                    />
                }
                allowClear
                onChange={(e) => onSearchChange('searchText', e.target.value)}
            />
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

export default FilterDropdown
