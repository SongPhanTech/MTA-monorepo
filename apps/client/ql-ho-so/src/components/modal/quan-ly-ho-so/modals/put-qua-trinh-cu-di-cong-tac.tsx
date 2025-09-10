import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { QuaTrinhCuDiCongTac } from '@workspace/db'
import { useFindManyDM_ChucVu } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutQuaTrinhCuDiCongTacModal() {
    const [form] = Form.useForm<QuaTrinhCuDiCongTac>()
    const { showSpinner, hideSpinner } = useSpinner()

    const { isOpen, onClose, input } = useDisclosure<
        Partial<QuaTrinhCuDiCongTac> & { onSave: (val: QuaTrinhCuDiCongTac) => void }
    >({
        tag: 'PutQuaTrinhCuDiCongTacModal',
        onClose: form.resetFields,
    })

    const { data: chucVuOptions } = useFindManyDM_ChucVu()

    async function onOk(output: QuaTrinhCuDiCongTac) {
        try {
            showSpinner()
            if (input?.onSave) {
                input.onSave(output)
            }
            message.success(
                isEdit
                    ? 'Cập nhật quá trình được cử đi công tác thành công'
                    : 'Thêm mới quá trình được cử đi công tác thành công'
            )
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        if (isOpen && input) {
            const { onSave, ...formData } = input
            if (Object.keys(formData).length > 0) {
                form.setFieldsValue({
                    ...formData,
                    tuThangNam: formData.tuThangNam ? dayjs(formData.tuThangNam) : '',
                    denThangNam: formData.denThangNam ? dayjs(formData.denThangNam) : '',
                })
            }
        }
    }, [isOpen, input, form])

    const isEdit = input && Object.keys(input).some((key) => key !== 'onSave')

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={isEdit ? 'Cập nhật cấp bậc' : 'Thêm mới cấp bậc'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Từ tháng năm" name="tuThangNam" required form={form}>
                    <DatePicker
                        placeholder="Chọn từ tháng năm"
                        className="w-full"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Đến tháng năm" name="denThangNam" required form={form}>
                    <DatePicker
                        placeholder="Chọn đến tháng năm"
                        className="w-full"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Đơn vị" name="donVi" required form={form}>
                    <Input placeholder="Nhập đơn vị" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Chức vụ" name="chucVuId" required form={form}>
                    <Select
                        placeholder="Chọn chức vụ"
                        options={chucVuOptions?.map((item) => ({
                            label: item.sTen,
                            value: item.Id,
                        }))}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
