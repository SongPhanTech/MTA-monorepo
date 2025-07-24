import FormItem from '@components/commons/form-item'
import { Col, Form, Input, Row } from 'antd'

export default function ThongTinCoBan() {
    const form = Form.useFormInstance<any>()
    return (
        <div>
            <div className="text-lg font-semibold mb-6">Thông tin cơ bản</div>
            <div className="px-2">
                <div className="mb-6 font-semibold text-md">Thông tin chung</div>
                <Row gutter={[16, 16]}>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Mã"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mã!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập mã" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Nguyên quán"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mã!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập mã" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Họ và tên đệm"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-[36px]" />
                        </FormItem>
                    </Col>
                </Row>
            </div>
        </div>
    )
}
