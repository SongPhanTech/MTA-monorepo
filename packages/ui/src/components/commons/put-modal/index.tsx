import {
  Modal as AntdModal,
  type ModalProps as AntdModalProps,
  Form,
  type FormInstance,
  Row,
} from "antd"
import type { AnyObject } from "antd/es/_util/type"
import type { FormLayout } from "antd/es/form/Form"
import type { FormProps } from "antd/lib"
import React from "react"

export type PutModalFormType = AnyObject

export type ModalProps<T = PutModalFormType> = {
  form: FormInstance<T>
  onFinish: (values: T) => void
  initialValues?: Partial<T>
  layout?: FormLayout
  formProps?: FormProps<T>
} & AntdModalProps

const PutFormModal = <T extends PutModalFormType>({
  onFinish,
  form,
  children,
  initialValues,
  layout = "vertical",
  formProps,
  ...rest
}: ModalProps<T>) => {
  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
    }
  }, [initialValues, form])

  return (
    <AntdModal
      okText="Lưu"
      cancelText="Hủy"
      width={800}
      maskClosable={false}
      style={{
        top: "10px",
      }}
      onOk={form.submit}
      {...rest}
    >
      <Form form={form} layout={layout} onFinish={onFinish} {...formProps}>
        <Row gutter={[12, 12]}>{children}</Row>
      </Form>
    </AntdModal>
  )
}

export { PutFormModal }
