import {
  Modal as AntdModal,
  type ModalProps as AntdModalProps,
  Form,
  type FormInstance,
  Row,
} from "antd"

export type PutModalFormType = {}
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
        <Row gutter={16}>{children}</Row>
      </Form>
    </AntdModal>
  )
}

export default PutFormModal
