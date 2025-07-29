import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { NgoaiNgu } from '@workspace/db'
import { useFindManyDM_NgoaiNgu } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutNgoaiNguModal() {
    const [form] = Form.useForm<NgoaiNgu>()
    const { showSpinner, hideSpinner } = useSpinner()
    const { data = [] } = useFindManyDM_NgoaiNgu()

    const { isOpen, onClose, input } = useDisclosure<
        Partial<NgoaiNgu> & { onSave: (val: NgoaiNgu) => void }
    >({
        tag: PutNgoaiNguModal.name,
        onClose: form.resetFields,
    })

    async function onOk(output: NgoaiNgu) {
        try {
            showSpinner()
            if (input?.onSave) {
                input.onSave(output)
            }
            message.success(
                input?.id ? 'Cập nhật ngoại ngữ thành công' : 'Thêm mới ngoại ngữ thành công'
            )
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

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
            title={input?.id ? 'Cập nhật ngoại ngữ' : 'Thêm mới ngoại ngữ'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Hình thức đào tạo" name="hinhThucDaoTao" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Trình độ" name="dM_NgoaiNguId" required form={form}>
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
