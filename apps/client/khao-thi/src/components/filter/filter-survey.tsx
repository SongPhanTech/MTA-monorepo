import { FilterOutlined } from '@ant-design/icons'
import DatePicker from '@components/commons/date-picker'
import Select from '@components/commons/select'
import { useFindManySurveyObjectType, useFindManySurveyTopic } from '@workspace/db/hooks'
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

export type FilterSurveyProps = {
    surveyObjectTypeId: string | null
    surveyTopicId: string | null
    startDate: string | null
    endDate: string | null
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

const FilterSurvey = (props: Props) => {
    const { onFilterChange, onSearchChange } = props
    const [form] = Form.useForm<FilterSurveyProps>()
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

    const { data: surveyTopicData = [], refetch: refetchSurveyTopic } = useFindManySurveyTopic()
    const { data: surveyObjectTypeData = [], refetch: refetchSurveyObjectType } =
        useFindManySurveyObjectType()

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
                                label="Đối tượng khảo sát"
                                name="surveyObjectTypeId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    allowClear
                                    placeholder="Chọn đối tượng khảo sát"
                                    options={surveyObjectTypeData.map((item) => {
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
                                label="Chủ đề khảo sát"
                                name="surveyTopicId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    allowClear
                                    placeholder="Chọn chủ đề khảo sát"
                                    options={surveyTopicData.map((item) => {
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
                                label="Thời gian bắt đầu"
                                name="startDate"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <DatePicker
                                    format={{
                                        format: 'DD/MM/YYYY',
                                        type: 'mask',
                                    }}
                                    className="w-full"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="Thời gian kết thúc"
                                name="endDate"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <DatePicker
                                    format={{
                                        format: 'DD/MM/YYYY',
                                        type: 'mask',
                                    }}
                                    className="w-full"
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
                placeholder="Nhập tên khảo sát..."
                style={{ width: 300, marginRight: 8 }}
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

export default FilterSurvey
