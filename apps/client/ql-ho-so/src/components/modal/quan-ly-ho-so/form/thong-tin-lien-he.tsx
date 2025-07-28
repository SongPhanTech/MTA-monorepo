import FormItem from '@components/commons/form-item'
import type { DomProps } from '@constants/type'

import { Col, Collapse, Form, Input, Row, Typography } from 'antd'
import dayjs from 'dayjs'

const { Title, Text } = Typography
dayjs.locale('vi')
export default function ThongTinLienHe({ expland, setExpland }: DomProps) {
    const form = Form.useFormInstance<any>()

    const renderContent = () => {
        return (
            <div className="px-6">
                <div className="mb-6 font-semibold text-base">Thông tin cá nhân</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="phoneNumber"
                            label="Số điện thoại"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập số điện thoại" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="email" label="Thư điện tử" className="mb-0">
                            <Input placeholder="Nhập thư điện tử" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="healthInsuranceNumber"
                            label="Thẻ bảo hiểm y tế"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập thẻ bảo hiểm y tế" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="bankAccountNumber"
                            label="Số thẻ ngân hàng"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập số thẻ ngân hàng" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem form={form} name="bankName" label="Ngân hàng" className="mb-0">
                            <Input placeholder="Nhập ngân hàng" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="email"
                            label="Hộ khẩu thường trú"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập hộ khẩu thường trú" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="email" label="Nơi ở hiện tại" className="mb-0">
                            <Input placeholder="Nhập nơi ở hiện tại" className="h-9" />
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
                        key: 'thongTinLienHe',
                        label: (
                            <Title level={4} className="mb-0">
                                Thông tin liên hệ
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
