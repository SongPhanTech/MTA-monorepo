import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import type { DomProps } from '@constants/type'
import { Col, Collapse, Form, Input, Row, Typography } from 'antd'
import dayjs from 'dayjs'

dayjs.locale('vi')
const { Title, Text } = Typography
export default function DoanDang({ expland, setExpland }: DomProps) {
    const form = Form.useFormInstance<any>()
    const renderContent = () => {
        return (
            <div className="px-6">
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="unionDate"
                            label="Ngày vào đoàn"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="unionPlace"
                            label="Nơi vào đoàn"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nơi vào đoàn" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="CPVJoinDate"
                            label="Ngày vào Đảng"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="officialCPVDate"
                            label="Ngày chính thức vào đảng"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="CPVJoinPlace"
                            label="Nơi vào Đảng"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nơi vào Đảng" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="tenureDate"
                            label="Ngày vào niên chế"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                </Row>
                <div className="mb-6 font-semibold text-base">CCCD/CMND</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="CCCD/CMND"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập CCCD/CMND!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập CCCD/CMND" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardDate"
                            label="Ngày cấp CCCD"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="code" label="Nơi cấp CCCD" className="mb-0">
                            <Input placeholder="Nhập nơi cấp" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardDate"
                            label="Ngày hết hạn CCCD"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                </Row>
            </div>
        )
    }
    return (
        <div className="mt-5">
            <Collapse
                items={[
                    {
                        key: 'DoanDang',
                        label: (
                            <Title level={4} className="mb-0">
                                Đoàn - Đảng
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                bordered={false}
                expandIconPosition="end"
                activeKey={expland}
                onChange={(value) => {
                    setExpland([...value])
                }}
                className="bg-transparent"
            />
        </div>
    )
}
