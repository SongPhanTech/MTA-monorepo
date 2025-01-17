import React from 'react'
import {
    Modal as AntdModal,
    ModalProps as AntdModalProps,
    Button,
    Col,
    Form,
    FormInstance,
    Input,
    Row,
    Switch,
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
    const [isEdit, setIsEdit] = React.useState(false)
    return (
        <AntdModal
            okText="Lưu"
            cancelText="Hủy"
            width={800}
            maskClosable={false}
            onOk={form.submit}
            okButtonProps={{
                disabled: !isEdit,
            }}
            {...rest}
        >
            <div className="flex justify-end gap-2">
                <label
                    className="cursor-pointer inline select-none gap-2"
                    htmlFor="isEdit"
                >
                    {'Chỉnh sửa '}
                </label>
                <span className="flex gap-2 items-center">
                    <Switch id="isEdit" checked={isEdit} onChange={setIsEdit} />
                </span>
            </div>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    {children}
                    <Col span={24}>
                        <FormItem form={form} label="Mô tả" name="description">
                            <Input.TextArea rows={4} />
                        </FormItem>
                    </Col>
                </Row>
            </Form>
        </AntdModal>
    )
}

export default PutFormModal
