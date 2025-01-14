import {
    DatePicker as AntDatePicker,
    DatePickerProps as AntDatePickerProps,
} from 'antd'
import locale from 'antd/es/date-picker/locale/vi_VN'

type DatePickerProps = AntDatePickerProps & {}

const DatePicker = ({ ...rest }: DatePickerProps) => {
    return <AntDatePicker locale={locale} {...rest} />
}

export default DatePicker
