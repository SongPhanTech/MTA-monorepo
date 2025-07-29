import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { TrinhDoLyLuanChinhTri } from '@workspace/db'
import { useFindManyDM_TrinhDoLyLuanChinhTri } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutTrinhDoLyLuanChinhTriModal() {
    const [form] = Form.useForm<TrinhDoLyLuanChinhTri>()
    const { showSpinner, hideSpinner } = useSpinner()

    const { isOpen, onClose, input } = useDisclosure<
        Partial<TrinhDoLyLuanChinhTri> & { onSave: (val: TrinhDoLyLuanChinhTri) => void }
    >({
        tag: PutTrinhDoLyLuanChinhTriModal.name,
        onClose: form.resetFields,
    })

    const { data = [] } = useFindManyDM_TrinhDoLyLuanChinhTri()

    async function onOk(output: TrinhDoLyLuanChinhTri) {
        try {
            showSpinner()

            const dataToSave: TrinhDoLyLuanChinhTri = {
                ...output,
            }

            if (input?.onSave) {
                input.onSave(dataToSave)
            }
            message.success(
                input?.id
                    ? 'Cập nhật lý luận chính trị thành công'
                    : 'Thêm mới lý luận chính trị thành công'
            )
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // Load dữ liệu khi edit
    useEffect(() => {
        if (isOpen && input) {
            const { onSave, ...formData } = input
            if (Object.keys(formData).length > 0) {
                form.setFieldsValue(formData)
            }
        }
    }, [isOpen, input, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={
                input?.id
                    ? 'Cập nhật trình độ lý luận chính trị'
                    : 'Thêm mới trình độ lý luận chính trị'
            }
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Hình thức đào tạo" name="hinhThucDaoTao" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Trình độ" name="trinhDoId" required form={form}>
                    <Select
                        placeholder="Chọn trình độ"
                        options={data.map((i) => ({ label: i.name, value: i.id }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Cơ sở đào tạo" name="noiDaoTao" required form={form}>
                    <Input placeholder="Nhập cơ sở đào tạo" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Thời gian bắt đầu" name="thoiGianBatDau" required form={form}>
                    <DatePicker
                        placeholder="Chọn thời gian bắt đầu"
                        className="w-full"
                        format="DD/MM/YYYY"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Thời gian kết thúc" name="thoiGianKetThuc" required form={form}>
                    <DatePicker
                        placeholder="Chọn thời gian kết thúc"
                        className="w-full"
                        format="DD/MM/YYYY"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
