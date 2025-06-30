import { FilterOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import {
    useFindManyDM_DanToc,
    useFindManyDM_QuocGia,
    useFindManyDM_TonGiao,
    useFindManyPriorityObject,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Popover,
    Row,
    //   Select,
    Space,
    Typography,
} from 'antd'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

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
const _options = [
    {
        value: '1',
        label: 'Đối tượng 1',
    },
]

const FilterLecture = (props: Props) => {
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

    const { data: priorityObjectData = [], refetch: refetchPriorityObject } =
        useFindManyPriorityObject()
    const { data: nationalityData = [], refetch: refetchNationality } = useFindManyDM_QuocGia()
    const { data: religionData = [], refetch: refetchReligion } = useFindManyDM_TonGiao()
    const { data: ethnicityData = [], refetch: refetchEthnicity } = useFindManyDM_DanToc()

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
                                    options={priorityObjectData.map((item) => {
                                        return {
                                            value: item.id,
                                            label: item.name,
                                        }
                                    })}
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
                                    options={nationalityData.map((item) => {
                                        return {
                                            value: item.Id,
                                            label: item.sTen,
                                        }
                                    })}
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
                                    options={religionData.map((item) => {
                                        return {
                                            value: item.Id,
                                            label: item.sTen,
                                        }
                                    })}
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
                                    options={ethnicityData.map((item) => {
                                        return {
                                            value: item.Id,
                                            label: item.sTen,
                                        }
                                    })}
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
                placeholder="Tìm kiếm theo tên giảng viên..."
                style={{ width: 300, marginRight: 8 }}
                className="py-0"
                prefix={<Search size={15} style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                allowClear
                onChange={(e) => onSearchChange('searchText', e.target.value)}
            />
            <Popover
                content={filterContent}
                trigger="click"
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                arrow={false}
                overlayStyle={{
                    width: 450,
                }}
                overlayInnerStyle={{
                    padding: 0,
                }}
                destroyTooltipOnHide
                align={{
                    offset: [100, 0], // Di chuyển popup sang trái 300px
                }}
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

export default FilterLecture
