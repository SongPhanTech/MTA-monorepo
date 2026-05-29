import { cn } from "@workspace/ui/lib/utils"
import { Form, type FormInstance, type FormItemProps as FormItemAntDrops } from "antd"

type FormItemProps<T extends object, K extends keyof T = keyof T> = FormItemAntDrops & {
  form: FormInstance<T>
  name: K | (string | number)[]
}

const FormItem = <T extends object, K extends keyof T>({
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
      className={cn("m-0", rest.className)}
    />
  )
}

export default FormItem
