import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ExpertProfile } from '@workspace/db'
import {
    useCreateExpertProfile,
    useFindManyLecturer,
    useFindUniqueExpertProfile,
    useFindUniqueLecturer,
    useUpdateExpertProfile,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'

export type PutExpertProfile = ExpertProfile
dayjs.locale('vi')

const PutExpertProfile = () => {
    const [form] = Form.useForm<PutExpertProfile>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutExpertProfile.name,
        onClose: form.resetFields,
    })
    const [selectedLecturerId, setSelectedLecturerId] = useState<string | undefined>()
    const { data: expert } = useFindUniqueExpertProfile({ where: { id: id } }, { enabled: !!id })

    const [isInternal, setIsInternal] = useState(true)

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: lecturer = [] } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })

    const { data: selectedLecturer } = useFindUniqueLecturer(
        {
            where: {
                id: selectedLecturerId,
            },
            include: {
                userProfile: true,
            },
        },
        {
            enabled: !!selectedLecturerId,
        }
    )

    useEffect(() => {
        if (expert) {
            form.setFieldsValue({
                ...expert,
            })
            setIsInternal(!!expert.lecturerId)
        }
    }, [expert, form])

    const { mutateAsync: createExpertProfile } = useCreateExpertProfile()
    const { mutateAsync: updateExpertProfile } = useUpdateExpertProfile()
    async function onOk(output?: PutExpertProfile) {
        if (!output) return

        let payload = {}

        if (selectedLecturer) {
            payload = {
                name: selectedLecturer.userProfile.fullname,
                phone: selectedLecturer.userProfile.phoneNumber,
                email: selectedLecturer.userProfile.email,
            }
        } else {
            payload = {
                title: output.title,
                specialization: output.specialization,
                workplace: output.workplace,
                phone: output.phone,
                email: output.email,
                name: output.name,
            }
        }

        try {
            showSpinner()
            if (id) {
                await updateExpertProfile({
                    where: { id: id },
                    data: payload,
                })
                message.success('Cập nhật thành công')
            } else {
                await createExpertProfile({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            onClose()
        } catch (_error) {
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
            title={id ? 'Chỉnh sửa chuyên gia' : 'Thêm mới chuyên gia'}
            className="w-[50vw]"
        >
            <Col span={24} className="mb-4">
                <Radio.Group
                    onChange={(e) => {
                        setIsInternal(e.target.value === 'internal')
                        if (!id) {
                            form.resetFields()
                        }
                    }}
                    value={isInternal ? 'internal' : 'external'}
                >
                    <Radio value="internal">Chuyên gia trong trường</Radio>
                    <Radio value="external">Chuyên gia ngoài trường</Radio>
                </Radio.Group>
            </Col>
            {isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="lecturerId" label="Chuyên gia hướng dẫn">
                        <Select
                            placeholder="Chọn chuyên gia hướng dẫn"
                            options={lecturer.map((item) => ({
                                label: `${item.userProfile.fullname} - ${item.code}`,
                                value: item.id,
                            }))}
                            allowClear
                            onChange={(value) => {
                                setSelectedLecturerId(value)
                            }}
                        />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="name" label="Họ và tên">
                        <Input placeholder="Nhập họ và tên" />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="title" label="Học hàm, học vị (GS, PGS, TS, ThS)">
                        <Input placeholder="Nhập học hàm, học vị" />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="specialization" label="Chuyên ngành">
                        <Input placeholder="Nhập chuyên ngành" />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="workplace" label="Đơn vị công tác">
                        <Input placeholder="Nhập đơn vị công tác" />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="phone" label="Số điện thoại">
                        <Input placeholder="Nhập số điện thoại" />
                    </FormItem>
                </Col>
            )}
            {!isInternal && (
                <Col span={12}>
                    <FormItem form={form} name="email" label="Email">
                        <Input placeholder="Nhập email" />
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutExpertProfile
