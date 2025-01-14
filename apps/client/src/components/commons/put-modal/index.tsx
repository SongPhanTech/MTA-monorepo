import React from 'react'
import {
    Modal as AntdModal,
    ModalProps as AntdModalProps,
    Col,
    Form,
    FormInstance,
    Input,
    Row,
} from 'antd'
import FormItem from '../form-item'

export type PutModalFormType = {
    name: string
    code: string
    description: string
}
export type ModalProps<T = PutModalFormType> = {
    form: FormInstance<T>
    onFinish: (values: T) => void
} & AntdModalProps

const PutFormModal = <T extends PutModalFormType>({
    onFinish,
    form,
    children,
    ...rest
}: ModalProps<T>) => {
    return (
        <AntdModal
            okText="Lưu"
            cancelText="Hủy"
            className="w-[40vw]"
            onOk={form.submit}
            {...rest}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            label="Mã"
                            required={true}
                            rules={[
                                {
                                    required: true,
                                    message: 'Nhập mã',
                                },
                            ]}
                            name="code"
                        >
                            <Input />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            label="Tên"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Nhập tên',
                                },
                            ]}
                        >
                            <Input />
                        </FormItem>
                    </Col>
                    {children}
                    <Col span={24}>
                        <FormItem
                            form={form}
                            label="Mô tả"
                            name="description"
                            rules={[
                                {
                                    required: true,
                                    message: 'Nhập mô tả',
                                },
                            ]}
                        >
                            <Input.TextArea rows={4} />
                        </FormItem>
                    </Col>
                </Row>
            </Form>
        </AntdModal>
    )
}

export default PutFormModal
