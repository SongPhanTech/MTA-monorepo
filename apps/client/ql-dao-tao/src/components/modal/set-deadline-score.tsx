import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useSession } from '@workspace/auth/react'
import { useUpdateSubjectClass } from '@workspace/db/hooks'
import { DatePicker as AntdDatePicker, Col, Form, message } from 'antd'
import locale from 'antd/es/date-picker/locale/vi_VN'
import type { Dayjs } from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'

export type PutUpdateTime = {
    time: [Dayjs, Dayjs]
    examScoreDeadline: Dayjs
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
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    async function onOk(output?: PutUpdateTime) {
        if (!output) return
        try {
            showSpinner()
            await updateSubjectClass({
                where: { id },
                data: {
                    scoreDeadLineStart: output?.time[0].toISOString(),
                    scoreDeadline: output?.time[1].toISOString(),
                    examScoreDeadline: output?.examScoreDeadline.toISOString(),
                },
                select: {},
            })

            message.success('Đặt hạn nhập điểm thành công')
            onClose()
        } catch (error: unknown) {
            console.error(error)
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
