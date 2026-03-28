import { DatePicker as AntDatePicker, type DatePickerProps as AntDatePickerProps } from "antd"
import locale from "antd/es/date-picker/locale/vi_VN"

type DatePickerProps = AntDatePickerProps & {}

const DatePicker = ({ ...rest }: DatePickerProps) => {
  return (
    <AntDatePicker
      format={{
        format: "DD/MM/YYYY",
        type: "mask",
      }}
      needConfirm={false}
      locale={locale}
      {...rest}
    />
  )
}

export default DatePicker
