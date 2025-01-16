import { Form, FormInstance, FormItemProps as FormItemAntdrops } from 'antd'

type FormItemProps<T, K> = FormItemAntdrops & {
    form: FormInstance<T>
    name: K
}

const FormItem = <T extends Record<string, any>, K extends keyof T>({
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
                              message: `Vui lòng nhập ${rest.label?.toString()?.toLowerCase()}`,
                          },
                      ]
                    : []
            }
            {...rest}
        />
    )
}

export default FormItem
