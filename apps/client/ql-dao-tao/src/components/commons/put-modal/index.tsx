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

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type PutModalFormType = {}
export type ModalProps<T = PutModalFormType> = {
    form: FormInstance<T>
    onFinish: (values: T) => void
    layout?: 'horizontal' | 'vertical' // Cho phép truyền layout là horizontal hoặc vertical
    labelCol?: { span: number }
    wrapperCol?: { span: number }
} & AntdModalProps

const PutFormModal = <T extends PutModalFormType>({
    onFinish,
    form,
    children,
    layout = 'vertical', // Mặc định layout là 'vertical' nếu không truyền
    labelCol,
    wrapperCol,
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
            <Form
                form={form}
                layout={layout}
                onFinish={onFinish}
                labelCol={labelCol}
                wrapperCol={wrapperCol}
            >
                <Row gutter={16}>{children}</Row>
            </Form>
        </AntdModal>
    )
}

export default PutFormModal
