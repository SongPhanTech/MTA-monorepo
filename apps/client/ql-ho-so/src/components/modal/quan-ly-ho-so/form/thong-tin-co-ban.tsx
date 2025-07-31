import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import type { DomProps } from '@constants/type'
import type { SubmitForm } from '@pages/quan-ly-ho-so/tao-moi'
import {
    useFindManyDM_DanToc,
    useFindManyDM_GioiTinh,
    useFindManyDM_QuocGia,
    useFindManyDM_TonGiao,
} from '@workspace/db/hooks'
import { Col, Collapse, Form, Input, Row, Typography } from 'antd'
import dayjs from 'dayjs'

dayjs.locale('vi')
const { Title, Text } = Typography
export default function ThongTinCoBan({ expland, setExpland }: DomProps) {
    const form = Form.useFormInstance<SubmitForm>()

    const { data: nationalityData = [] } = useFindManyDM_QuocGia()
    const { data: religionData = [] } = useFindManyDM_TonGiao()
    const { data: ethnicityData = [] } = useFindManyDM_DanToc()
    const { data: genderData = [] } = useFindManyDM_GioiTinh()

    const renderContent = () => {
        return (
            <div className="px-6">
                <div className="mb-6 font-semibold text-base">Thông tin chung</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
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
                            <Input placeholder="Nhập mã" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="lastName"
                            label="Họ và tên đệm"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="firstName"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="nationalityId"
                            label="Quốc tịch"
                            className="mb-0 w-full"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn quốc tịch"
                                className="h-9"
                                options={nationalityData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="religionId"
                            label="Tôn giáo"
                            className="mb-0"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn tôn giáo"
                                className="h-9 !w-full"
                                options={religionData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="ethnicityId"
                            label="Dân tộc"
                            className="mb-0"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn dân tộc"
                                className="h-9"
                                options={ethnicityData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="originalPlace"
                            label="Nguyên quán"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nguyên quán" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="dateOfBirth" label="Ngày sinh" className="mb-0">
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
                        <FormItem form={form} name="placeOfBirth" label="Nơi sinh" className="mb-0">
                            <Input placeholder="Nhập nơi sinh" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="genderId" label="Giới tính" className="mb-0">
                            <Select
                                allowClear
                                placeholder="Chọn giới tính"
                                className="h-9"
                                options={genderData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                </Row>
                <div className="mb-6 font-semibold text-base">CCCD/CMND</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardNumber"
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
                        <FormItem
                            form={form}
                            name="placeOfIdCardNumber"
                            label="Nơi cấp CCCD"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nơi cấp" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardExpirationDate"
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
        <div>
            <Collapse
                items={[
                    {
                        key: 'thongTinCoBan',
                        label: (
                            <Title level={4} className="mb-0">
                                Thông tin cơ bản
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
