import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import { CUSSTOM_VI_LOCALE } from '@constants/constants'
import type { TrainingScoreSession } from '@workspace/db'
import { useFindManyTrainingObjectType } from '@workspace/db/hooks'
import { DatePicker, Form, Input, Modal, Select } from 'antd'
import type React from 'react'
import { useEffect } from 'react'

const { TextArea } = Input

interface ModalDotDanhGiaProps {
    visible: boolean
    onCancel: () => void
    onSubmit: (values: TrainingScoreSession) => void
    onEdit: (id: string, values: TrainingScoreSession) => void
    data: TrainingScoreSession | null
    isEdit?: boolean
}

const ModalDotDanhGia: React.FC<ModalDotDanhGiaProps> = ({
    visible,
    onCancel,
    onSubmit,
    onEdit,
    data,
    isEdit = false,
}) => {
    const [form] = Form.useForm()

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                console.log('Received values:', values)
                if (isEdit) {
                    onEdit(data?.id, values)
                } else {
                    onSubmit(values)
                }
                form.resetFields()
            })
            .catch((info) => {
                console.log('Validate Failed:', info)
            })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    useEffect(() => {
        console.log('ModalDotDanhGia useEffect', isEdit, data)
        if (isEdit && data) {
            form.setFieldsValue({
                tenDot: data.name,
                hocKi: data.semesterId,
                ghiChu: data.description,
                doituong: data.trainingObjectTypeId,
                //TODO: không set value này được
                // thoiGian: data.time ? moment(data.time) : null,
            })
        }
    }, [isEdit, data, form])

    return (
        <Modal
            title="Thêm đợt đánh giá"
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnClose
            okText="Đồng ý"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="tenDot"
                    label="Tên đợt"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đợt' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="hocKi"
                    label="Học kì"
                    rules={[{ required: true, message: 'Vui lòng nhập học kì' }]}
                >
                    <TreeSelectSemester style={{ height: 40 }} placeholder="Học kỳ" />
                </Form.Item>
                <Form.Item
                    name="doituong"
                    label="Đối tượng"
                    rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
                >
                    <Select
                        options={trainingObjectTypeData.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        placeholder="Chọn đối tượng"
                    />
                </Form.Item>
                <Form.Item
                    name="thoiGian"
                    label="Thời gian"
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        locale={CUSSTOM_VI_LOCALE}
                        format="DD/MM/YYYY"
                    />
                </Form.Item>
                <Form.Item name="ghiChu" label="Ghi chú">
                    <TextArea rows={4} />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ModalDotDanhGia
