import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { HocVi } from '@workspace/db'
import {
    useCreateHocVi,
    useFindManyDM_HocVi,
    useFindManyDM_QuocGia,
    useFindManyDM_TruongDaoTaoBacDH,
    useUpdateHocVi,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutHocViModal() {
    const [form] = Form.useForm<HocVi>()

    const { isOpen, onClose, input } = useDisclosure<HocVi>({
        tag: PutHocViModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: hocVi = [] } = useFindManyDM_HocVi()
    const { data: quocGia = [] } = useFindManyDM_QuocGia()
    const { data: truong = [] } = useFindManyDM_TruongDaoTaoBacDH()

    const { mutateAsync: createHocVi } = useCreateHocVi()
    const { mutateAsync: updateHocVi } = useUpdateHocVi()

    async function onOk(output: HocVi) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await updateHocVi({
                    where: {
                        id: input.id,
                    },
                    data: {
                        academicDegreeTypeId: output.academicDegreeTypeId,
                        linhVuc: output.linhVuc,
                        truongId: output.truongId,
                        nationalityId: output.nationalityId,
                        year: output.year,
                    },
                })
            } else {
                await createHocVi({
                    data: {
                        academicDegreeTypeId: output.academicDegreeTypeId,
                        linhVuc: output.linhVuc,
                        truongId: output.truongId,
                        nationalityId: output.nationalityId,
                        year: output.year,
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
                academicDegreeTypeId: input.academicDegreeTypeId,
                linhVuc: input.linhVuc,
                truongId: input.truongId,
                nationalityId: input.nationalityId,
                year: input.year,
            })
        }
    }, [input, isOpen, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input?.id ? 'Cập nhật học vị' : 'Thêm mới học vị'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên học vị" name="academicDegreeTypeId" required form={form}>
                    <Select
                        placeholder="Chọn học vị"
                        options={hocVi.map((i) => ({ label: i.sTen, value: i.Id }))}
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Lĩnh vực" name="linhVuc" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Trường" name="truongId" required form={form}>
                    <Select
                        placeholder="Chọn trường"
                        options={truong.map((i) => ({ label: i.name, value: i.id }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Quốc gia" name="nationalityId" required form={form}>
                    <Select
                        placeholder="Chọn quốc gia"
                        options={quocGia.map((i) => ({ label: i.sTen, value: i.Id }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Năm nhận" name="year" required form={form}>
                    <InputNumber
                        precision={0}
                        style={{ width: '100%' }}
                        max={new Date().getFullYear()}
                        min={0}
                        placeholder="Nhập năm nhận"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
