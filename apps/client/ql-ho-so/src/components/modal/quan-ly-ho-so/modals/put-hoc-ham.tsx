import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { HocHam } from '@workspace/db'
import { useCreateHocHam, useFindManyDM_HocHam, useUpdateHocHam } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutHocHamModal() {
    const [form] = Form.useForm<HocHam>()

    const { isOpen, onClose, input } = useDisclosure<HocHam>({
        tag: PutHocHamModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: hocHam = [] } = useFindManyDM_HocHam()

    const { mutateAsync: createHocHam } = useCreateHocHam()
    const { mutateAsync: updateHocHam } = useUpdateHocHam()

    async function onOk(output: HocHam) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await updateHocHam({
                    where: {
                        id: input.id,
                    },
                    data: {
                        academicRankTypeId: output.academicRankTypeId,
                        noiCap: output.noiCap,
                        soQuyetDinh: output.soQuyetDinh,
                        from: output.from,
                        to: output.to,
                    },
                })
            } else {
                await createHocHam({
                    data: {
                        academicRankTypeId: output.academicRankTypeId,
                        noiCap: output.noiCap,
                        soQuyetDinh: output.soQuyetDinh,
                        from: output.from,
                        to: output.to,
                    },
                })
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    useEffect(() => {
        if (input && isOpen) {
            form.setFieldsValue({
                academicRankTypeId: input.academicRankTypeId,
                noiCap: input.noiCap,
                soQuyetDinh: input.soQuyetDinh,
                from: input.from,
                to: input.to,
            })
        }
    }, [form, input, isOpen])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input?.id ? 'Cập nhật học hàm' : 'Thêm mới học hàm'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên học hàm" name="academicRankTypeId" required form={form}>
                    <Select
                        placeholder="Chọn học hàm"
                        options={hocHam.map((i) => ({ label: i.sTen, value: i.Id }))}
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Nơi Cấp" name="noiCap" required form={form}>
                    <Input placeholder="Nhập nơi cấp" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Số quyết định" name="soQuyetDinh" required form={form}>
                    <Input placeholder="Nhập số quyết định" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Thời gian bắt đầu" name="from" required form={form}>
                    <DatePicker
                        placeholder="Nhập thời gian bắt đầu"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Thời gian kết thúc" name="to" required form={form}>
                    <DatePicker
                        placeholder="Nhập thời gian kết thúc"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
