import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DiplomaVerificationApplication } from '@workspace/db'
import { useCreateDiplomaVerificationApplication } from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'

export type PutDiplomaVerificationApplication = DiplomaVerificationApplication

export default function ĐONANGKY() {
    const [form] = Form.useForm<PutDiplomaVerificationApplication>()

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createKnowledgeBlock } = useCreateDiplomaVerificationApplication()
    async function onOk(output?: PutDiplomaVerificationApplication) {
        if (!output) return
        try {
            showSpinner()

            const data = {
                fullname: output.fullname,
                idCardNumber: output.idCardNumber,
                dateOfBirth: output.dateOfBirth,
                phoneNumber: output.phoneNumber,
                email: output.email,
                reason: output.reason,
            }
            await createKnowledgeBlock({
                data: data,
            })
            message.success('Thêm mới thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    return (
        <Form form={form} layout="vertical" onFinish={onOk}>
            <Row gutter={16}>
                <Col span={12}>
                    <FormItem form={form} name="fullname" label="Họ và tên" required>
                        <Input placeholder="Nhập họ và tên" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="idCardNumber" label="Căn cước công dân" required>
                        <Input placeholder="Nhập căn cước công dân" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="dateOfBirth" label="Ngày sinh" required>
                        <DatePicker
                            format={{
                                format: 'DD/MM/YYYY',
                                type: 'mask',
                            }}
                            className="w-full"
                            placeholder="Chọn ngày sinh"
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="phoneNumber" label="Số điện thoại" required>
                        <Input placeholder="Nhập số điện thoại" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="email" label="Email" required>
                        <Input placeholder="Nhập email" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="reason" label="Lý do làm đơn">
                        <Input.TextArea placeholder="Nhập lý do" />
                    </FormItem>
                </Col>
            </Row>
            <Flex justify="end">
                <Button type="primary" onClick={() => form.submit()}>
                    Tạo đơn
                </Button>
            </Flex>
        </Form>
    )
}

ĐONANGKY.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
