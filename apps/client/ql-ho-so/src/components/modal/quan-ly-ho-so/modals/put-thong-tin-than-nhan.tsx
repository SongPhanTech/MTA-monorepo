import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Relative } from '@workspace/db'
import { useCreateRelative, useFindManyDM_MoiQuanHe, useUpdateRelative } from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutThongTinThanNhan() {
    const [form] = Form.useForm<Relative>()

    const { isOpen, onClose, input } = useDisclosure<Relative>({
        tag: PutThongTinThanNhan.name,
        onClose: form.resetFields,
    })

    const { data: quanHeData = [] } = useFindManyDM_MoiQuanHe()

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutate: createRelative } = useCreateRelative()
    const { mutate: updateRelative } = useUpdateRelative()

    async function onOk(output: Relative) {
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await updateRelative({
                    where: {
                        id: input.id,
                    },
                    data: {
                        name: output.name,
                        dM_MoiQuanHeId: output.dM_MoiQuanHeId,
                        birthYear: output.birthYear,
                        job: output.job,
                        information: output.information,
                    },
                })
            } else {
                await createRelative({
                    data: {
                        name: output.name,
                        dM_MoiQuanHeId: output.dM_MoiQuanHeId,
                        birthYear: output.birthYear,
                        job: output.job,
                        information: output.information,
                    },
                })
            }
            message.success('Cập nhật thành công')
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    useEffect(() => {
        if (input && isOpen) {
            form.setFieldsValue({
                name: input.name,
                dM_MoiQuanHeId: input.dM_MoiQuanHeId,
                birthYear: input.birthYear,
                job: input.job,
                information: input.information,
            })
        }
    }, [input, isOpen, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input?.id ? 'Cập nhật thông tin thân nhân' : 'Thêm mới thông tin thân nhân'}
            layout="vertical"
            className="w-[40vw]"
        >
            <Col span={24}>
                <FormItem label="Tên thân nhân" name="name" required form={form}>
                    <Input placeholder="Nhập tên nhân thân" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Tên mối quan hệ" name="dM_MoiQuanHeId" required form={form}>
                    <Select
                        placeholder="Chọn mối quan hệ"
                        options={quanHeData.map((i) => ({
                            label: i.name,
                            value: i.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Năm sinh" name="birthYear" form={form}>
                    <InputNumber
                        precision={0}
                        style={{ width: '100%' }}
                        max={new Date().getFullYear()}
                        min={0}
                        placeholder="Nhập năm sinh"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Nhập nghề nghiệp" name="job" form={form}>
                    <Input placeholder="Nhập tên nghề nghiệp" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Tên thông tin khác" name="information" form={form}>
                    <Input placeholder="Nhập tên thông tin khác" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
