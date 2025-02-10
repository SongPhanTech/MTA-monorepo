import {
    Form,
    type FormInstance,
    type FormItemProps as FormItemAntdrops,
} from 'antd'

type FormItemProps<T, K> = FormItemAntdrops & {
    form: FormInstance<T>
    name: K
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
