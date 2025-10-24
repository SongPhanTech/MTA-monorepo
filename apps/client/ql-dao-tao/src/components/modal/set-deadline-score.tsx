import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Col, Form, message, DatePicker as AntdDatePicker } from 'antd'
import { Dayjs } from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import DatePicker from '@components/commons/date-picker'
import locale from 'antd/es/date-picker/locale/vi_VN'
import { useUpdateSubjectClass } from '@workspace/db/hooks'
export type PutUpdateTime = {
    examScoreDeadline: Dayjs
    time: [Dayjs, Dayjs]
}
const PutDeadlineScoreModal = () => {
    const [form] = Form.useForm<PutUpdateTime>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<any>({
        tag: 'PutDeadlineScoreModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    async function onOk(output?: PutUpdateTime) {
        if (!output) return
        try {
            showSpinner()
            let dataSubmit: any = {}
            if (output?.time && output?.time.length === 2) {
                dataSubmit = {
                    scoreDeadline: output?.time[0],
                    examScoreDeadline: output?.time[1],
                }
            }
            if (output?.examScoreDeadline) {
                dataSubmit = {
                    ...dataSubmit,
                    examScoreDeadline: output?.examScoreDeadline,
                }
            }
            const res = await updateSubjectClass({
                data: dataSubmit,
                where: {
                    id,
                },
            })
            if (res) {
                message.success('Đặt hạn nhập điểm thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SubjectClass'],
            })
            onClose()
        } catch (error: any) {
            console.log(error)

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Đặt hạn nhập điểm'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name={'time'} label="Thời gian nhập điểm TX,CC">
                    <AntdDatePicker.RangePicker
                        locale={locale}
                        format={'DD/MM/YYYY'}
                        placeholder={['Bắt đầu', 'Kết thúc']}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name={'examScoreDeadline'} label="Hạn nhập điểm thi">
                    <DatePicker
                        format={'DD/MM/YYYY'}
                        placeholder={'Hạn nhập điểm thi'}
                        className="w-full"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutDeadlineScoreModal
