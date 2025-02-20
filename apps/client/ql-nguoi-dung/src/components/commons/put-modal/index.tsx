import React from 'react'
import {
    Modal as AntdModal,
    type ModalProps as AntdModalProps,
    Col,
    Form,
    type FormInstance,
    Input,
    Row,
} from 'antd'
import FormItem from '../form-item'

export type PutModalFormType = {
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
            width={800}
            maskClosable={false}
            onOk={form.submit}
            {...rest}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    {children}
                    {/* <Col span={24}>
                        <FormItem form={form} label="Mô tả" name="description">
                            <Input.TextArea rows={4} />
                        </FormItem>
                    </Col> */}
                </Row>
            </Form>
        </AntdModal>
    )
}

export default PutFormModal
