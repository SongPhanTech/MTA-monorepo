import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { QuaTrinhCuDiDaoTao } from '@workspace/db'
import { useFindManyDM_LoaiHinhDiHocTap } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutQuaTrinhCuDiBoiDuongModal() {
    const [form] = Form.useForm<QuaTrinhCuDiDaoTao>()
    const { showSpinner, hideSpinner } = useSpinner()

    const { isOpen, onClose, input } = useDisclosure<
        Partial<QuaTrinhCuDiDaoTao> & { onSave: (val: QuaTrinhCuDiDaoTao) => void }
    >({
        tag: PutQuaTrinhCuDiBoiDuongModal.name,
        onClose: form.resetFields,
    })

    const { data: loaiHinhList } = useFindManyDM_LoaiHinhDiHocTap()

    async function onOk(output: QuaTrinhCuDiDaoTao) {
        try {
            showSpinner()
            if (input?.onSave) {
                input.onSave(output)
            }
            message.success(
                input?.id
                    ? 'Cập nhật quá trình được cử đi đào tạo bồi dưỡng thành công'
                    : 'Thêm mới quá trình được cử đi đào tạo bồi dưỡng thành công'
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
            title={
                input?.id
                    ? 'Cập nhật quá trình đi đào tạo bồi dưỡng'
                    : 'Thêm mới quá trình đi đào tạo bồi dưỡng'
            }
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Khóa đào tạo, bồi dưỡng tập huấn" name="ten" required form={form}>
                    <Input placeholder="Nhập khóa đào tạo, bồi dưỡng tập huấn" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Đơn vị tổ chức" name="donViToChuc" required form={form}>
                    <Input placeholder="Nhập đơn vị tổ chức" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Loại" name="loaiId" required form={form}>
                    <Select
                        placeholder="Chọn loại"
                        options={loaiHinhList?.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Từ ngày" name="tuNgay" required form={form}>
                    <DatePicker placeholder="Từ ngày" format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Đến ngày " name="denNgay" required form={form}>
                    <DatePicker placeholder="Đến ngày" format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
