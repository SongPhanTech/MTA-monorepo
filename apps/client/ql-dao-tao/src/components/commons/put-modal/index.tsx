import {
  Modal as AntdModal,
  type ModalProps as AntdModalProps,
  Form,
  type FormInstance,
  type FormProps,
  Row,
} from "antd"

export type PutModalFormType = {}
export type ModalProps<T = PutModalFormType> = {
  form: FormInstance<T>
  onFinish: (values: T) => void
  onOk?: () => void
  layout?: "horizontal" | "vertical" // Cho phép truyền layout là horizontal hoặc vertical
  labelCol?: { span: number }
  wrapperCol?: { span: number }
  rowWrap?: boolean
  formProps?: FormProps<T>
} & AntdModalProps

const PutFormModal = <T extends PutModalFormType>({
  onFinish,
  form,
  children,
  layout = "vertical", // Mặc định layout là 'vertical' nếu không truyền
  labelCol,
  wrapperCol,
  rowWrap = true,
  onOk = form.submit,
  ...rest
}: ModalProps<T>) => {
  return (
    <AntdModal
      okText="Lưu"
      cancelText="Hủy"
      width={800}
      maskClosable={false}
      onOk={onOk}
      {...rest}
      style={{
        top: 10,
        ...rest.style,
      }}
    >
      <Form
        form={form}
        layout={layout}
        onFinish={onFinish}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        {...rest.formProps}
      >
        {rowWrap ? <Row gutter={[8, 8]}>{children}</Row> : children}
      </Form>
    </AntdModal>
  )
}

export default PutFormModal
