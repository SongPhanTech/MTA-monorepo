import { FilterOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import { useFindManySurvey, useFindManySurveyQuestionType } from '@workspace/db/hooks'
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

export type FilterSurveyQuestionProps = {
    surveyQuestionTypeId: string | null
    surveyId: string | null
}

interface Props {
    onFilterChange: any
    onSearchChange: any
}

const FilterSurveyQuestion = (props: Props) => {
    const { onFilterChange, onSearchChange } = props
    const [form] = Form.useForm<FilterSurveyQuestionProps>()
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.resetFields()
    }

    const handleApply = () => {
        onFilterChange(form.getFieldsValue())
        setOpen(false)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

    const { data: surveyData = [], refetch: refetchSurvey } = useFindManySurvey()
    const { data: surveyQuestionTypeData = [], refetch: refetchSurveyType } =
        useFindManySurveyQuestionType()

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
                                label="Loại câu hỏi"
                                name="surveyQuestionTypeId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    allowClear
                                    placeholder="Chọn loại khảo sát"
                                    options={surveyQuestionTypeData.map((item) => {
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
                                label="Khảo sát"
                                name="surveyId"
                                labelCol={{ span: 7 }}
                                wrapperCol={{ span: 17 }}
                                labelAlign="left"
                            >
                                <Select
                                    allowClear
                                    placeholder="Chọn khảo sát"
                                    options={surveyData.map((item) => {
                                        return {
                                            value: item.id,
                                            label: item.name,
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
                placeholder="Nhập câu hỏi khảo sát..."
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

export default FilterSurveyQuestion
