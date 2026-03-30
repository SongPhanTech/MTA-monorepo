import { cn } from "@workspace/ui/lib/utils"
import { Form, type FormInstance, type FormItemProps as FormItemAntDrops } from "antd"

type FormItemProps<T, K> = FormItemAntDrops & {
  form: FormInstance<T>
  name: K
}

const FormItem = <
  T extends Record<string, unknown>,
  K extends keyof T | (keyof T | string | number)[],
>({
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
      className={cn("mb-0 mt-2", rest.className)}
    />
  )
}

export { FormItem }
