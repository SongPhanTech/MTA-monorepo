import { Form, type FormInstance, type FormItemProps as FormItemAntDrops } from "antd"

type FormItemProps<T, K> = FormItemAntDrops & {
  form: FormInstance<T>
  name: K
}

const FormItem = <T extends Record<string, unknown>, K extends keyof T>({
  form,
  ...rest
}: FormItemProps<T, K>) => {
  return (
    <Form.Item<typeof form>
      rules={
        rest.required
          ? [
              {
                required: true,
                message: `Vui lòng nhập ${rest.label ? rest.label.toString().toLowerCase() : "thông tin"}`,
              },
            ]
          : []
      }
      {...rest}
    />
  )
}

export default FormItem
