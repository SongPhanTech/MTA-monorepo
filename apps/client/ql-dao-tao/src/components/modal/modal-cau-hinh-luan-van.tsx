import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { Form, message, Typography, Row, Col, DatePicker } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import {
    useCreateCouncil,
    useCreateCouncilMember,
    useDeleteCouncilMember,
    useFindManyDefenseSession,
    useFindManyExpertProfile,
    useFindManyRoom,
    useFindUniqueThesisProject,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import dayjs from 'dayjs'
import { CouncilProposalStatus, CouncilRole } from '@workspace/db'
import { useEffect } from 'react'

const { Title } = Typography

export type CouncilMemberType = {
    expertProfileId?: string
    role: string
}

export type ModalCauHinhLuanVanType = {
    chairman?: string
    secretary?: string
    reviewer1?: string
    reviewer2?: string
    member?: string
    roomId?: string
    defenseDate?: Date
    sessionId?: string
}

const ModalCauHinhLuanVan = () => {
    const isCouncilRolesDuplicated = (data: ModalCauHinhLuanVanType): boolean => {
        const expertIds = [
            data.chairman,
            data.secretary,
            data.reviewer1,
            data.reviewer2,
            data.member,
        ]
        const validExpertIds = expertIds.filter((id): id is string => !!id && id.trim() !== '')

        const uniqueIds = new Set(validExpertIds)

        return validExpertIds.length !== uniqueIds.size
    }
    const [form] = Form.useForm<ModalCauHinhLuanVanType>()
    const { isOpen, onClose, input } = useDisclosure<{
        thesisProjectId: string
        thesisSessionId: string
    }>({
        tag: 'ModalCauHinhLuanVan',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const formItemLayout = {
        labelCol: { flex: '0 0 110px' },
        wrapperCol: { flex: '1' },
    }

    async function onOk(data?: ModalCauHinhLuanVanType) {
        if (!data) return

        if (isCouncilRolesDuplicated(data)) {
            message.error('Một thành viên không thể có nhiều vai trò trong Hội đồng.')
            return
        }
        const thesisProjectId = input?.thesisProjectId || thesisProjectData?.id
        if (!thesisProjectId) {
            message.error('Không tìm thấy ID dự án.')
            return
        }

        try {
            showSpinner()

            const updateThesisProjectPayload = {
                defenseDate: data.defenseDate,
                room: { connect: { id: data.roomId } },
                defenseSession: { connect: { id: data.sessionId } },
                thesisSession: { connect: { id: input?.thesisSessionId } },
            }

            if (thesisProjectData?.councilId) {
                const councilId = thesisProjectData.councilId

                await updateThesisProject({
                    where: { id: thesisProjectId },
                    data: updateThesisProjectPayload,
                })

                const currentMemberIds = thesisProjectData?.council?.members.map((m) => m.id) ?? []

                if (currentMemberIds.length > 0) {
                    const hardDeletePromises = currentMemberIds.map((memberId) =>
                        deleteCouncilMember({ where: { id: memberId } })
                    )
                    await Promise.all(hardDeletePromises)
                }

                const rolesMapping = {
                    CHAIRMAN: data.chairman,
                    SECRETARY: data.secretary,
                    REVIEWER_1: data.reviewer1,
                    REVIEWER_2: data.reviewer2,
                    MEMBER: data.member,
                }

                const creationPromises = Object.keys(rolesMapping)
                    .filter((key) => isNaN(Number(key)))
                    .map(async (key) => {
                        const expertId = rolesMapping[key as keyof typeof CouncilRole]

                        if (!expertId) return

                        const payload = {
                            role: CouncilRole[key as keyof typeof CouncilRole],
                            expertId: expertId,
                            councilId: councilId,
                        }
                        console.log(payload)
                        return createCouncilMember({ data: payload })
                    })
                    .filter(Boolean) as Promise<any>[]

                await Promise.all(creationPromises)

                message.success('Cấu hình bảo vệ luận văn được cập nhật thành công')
            } else {
                const payloadCouncil = {
                    proposedDate: new Date(),
                    status: CouncilProposalStatus.PENDING,
                }
                const council = await createCouncil({ data: payloadCouncil })
                const councilId = council?.id ?? ''

                if (!councilId) {
                    throw new Error('Không thể tạo Hội đồng.')
                }

                const rolesMapping = {
                    CHAIRMAN: data.chairman,
                    SECRETARY: data.secretary,
                    REVIEWER_1: data.reviewer1,
                    REVIEWER_2: data.reviewer2,
                    MEMBER: data.member,
                }

                const creationPromises = Object.keys(rolesMapping)
                    .filter((key) => isNaN(Number(key)))
                    .map(async (key) => {
                        const expertId = rolesMapping[key as keyof typeof CouncilRole]
                        if (!expertId) return

                        const payload = {
                            role: CouncilRole[key as keyof typeof CouncilRole],
                            expertId: expertId,
                            councilId: councilId,
                        }
                        return createCouncilMember({ data: payload })
                    })
                    .filter(Boolean) as Promise<any>[]

                await Promise.all(creationPromises)

                const dataThesisProject = {
                    ...updateThesisProjectPayload,
                    council: {
                        connect: { id: councilId },
                    },
                    thesisSession: { connect: { id: input?.thesisSessionId } },
                }

                await updateThesisProject({
                    where: { id: thesisProjectId },
                    data: dataThesisProject,
                })

                message.success('Cấu hình bảo vệ luận văn thành công')
            }

            onClose()
        } catch (error: any) {
            const errorMessage = error?.message || 'Đã xảy ra lỗi, vui lòng kiểm tra lại'
            message.error(errorMessage)
        } finally {
            hideSpinner()
        }
    }

    const { data: expertProfileData = [] } = useFindManyExpertProfile()
    const { data: roomData = [] } = useFindManyRoom()
    const { data: defenseSessionData = [] } = useFindManyDefenseSession()
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    const { mutateAsync: createCouncil } = useCreateCouncil()
    const { mutateAsync: createCouncilMember } = useCreateCouncilMember()
    const { mutateAsync: deleteCouncilMember } = useDeleteCouncilMember()
    const { data: thesisProjectData } = useFindUniqueThesisProject({
        where: { id: input?.thesisProjectId },
        include: {
            council: {
                include: {
                    members: {
                        include: {
                            expert: true,
                        },
                    },
                },
            },
            room: true,
            defenseSession: true,
        },
    })

    useEffect(() => {
        if (thesisProjectData) {
            form.setFieldsValue({
                chairman: thesisProjectData?.council?.members.find(
                    (member) => member.role === CouncilRole.CHAIRMAN
                )?.expert?.id,
                secretary: thesisProjectData?.council?.members.find(
                    (member) => member.role === CouncilRole.SECRETARY
                )?.expert?.id,
                reviewer1: thesisProjectData?.council?.members.find(
                    (member) => member.role === CouncilRole.REVIEWER_1
                )?.expert?.id,
                reviewer2: thesisProjectData?.council?.members.find(
                    (member) => member.role === CouncilRole.REVIEWER_2
                )?.expert?.id,
                member: thesisProjectData?.council?.members.find(
                    (member) => member.role === CouncilRole.MEMBER
                )?.expert?.id,
                roomId: thesisProjectData?.room?.id,
                defenseDate: thesisProjectData?.defenseDate
                    ? dayjs(thesisProjectData?.defenseDate)
                    : undefined,
                sessionId: thesisProjectData?.defenseSession?.id,
            })
        }
    }, [form, thesisProjectData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Cấu hình bảo vệ luận văn/Đề án'}
            layout="horizontal"
            width={1000}
        >
            <Row gutter={32} className="w-full mt-4">
                <Col span={12}>
                    <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                        Hội đồng bảo vệ
                    </Title>

                    <FormItem
                        form={form}
                        name="chairman"
                        label="Chủ tịch"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn Chủ tịch' }]}
                    >
                        <Select
                            value={
                                thesisProjectData?.council?.members.find(
                                    (member) => member.role === CouncilRole.CHAIRMAN
                                )?.expert?.id
                            }
                            placeholder="Chọn Chủ tịch"
                            allowClear
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            onChange={(value) => {
                                form.setFieldsValue({
                                    chairman: value,
                                })
                            }}
                            options={expertProfileData.map((expert) => ({
                                value: expert.id,
                                label: expert.name,
                            }))}
                        />
                    </FormItem>

                    <FormItem
                        form={form}
                        name="secretary"
                        label="Thư ký"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn Thư ký' }]}
                    >
                        <Select
                            placeholder="Chọn Thư ký"
                            allowClear
                            showSearch
                            onChange={(value) => {
                                form.setFieldsValue({
                                    secretary: value,
                                })
                            }}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={expertProfileData.map((expert) => ({
                                value: expert.id,
                                label: expert.name,
                            }))}
                        />
                    </FormItem>

                    <FormItem
                        form={form}
                        name="reviewer1"
                        label="Phản biện 1"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn Phản biện 1' }]}
                    >
                        <Select
                            placeholder="Chọn Phản biện 1"
                            allowClear
                            showSearch
                            onChange={(value) => {
                                form.setFieldsValue({
                                    reviewer1: value,
                                })
                            }}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={expertProfileData.map((expert) => ({
                                value: expert.id,
                                label: expert.name,
                            }))}
                        />
                    </FormItem>

                    <FormItem
                        form={form}
                        name="reviewer2"
                        label="Phản biện 2"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn Phản biện 2' }]}
                    >
                        <Select
                            placeholder="Chọn Phản biện 2"
                            allowClear
                            showSearch
                            onChange={(value) => {
                                form.setFieldsValue({
                                    reviewer2: value,
                                })
                            }}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={expertProfileData.map((expert) => ({
                                value: expert.id,
                                label: expert.name,
                            }))}
                        />
                    </FormItem>

                    <FormItem
                        form={form}
                        name="member"
                        label="Ủy viên"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn Ủy viên' }]}
                    >
                        <Select
                            placeholder="Chọn Ủy viên"
                            allowClear
                            showSearch
                            onChange={(value) => {
                                form.setFieldsValue({
                                    member: value,
                                })
                            }}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={expertProfileData.map((expert) => ({
                                value: expert.id,
                                label: expert.name,
                            }))}
                        />
                    </FormItem>
                </Col>

                <Col span={12}>
                    <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                        Phòng bảo vệ và Ca bảo vệ
                    </Title>

                    <FormItem
                        form={form}
                        name="roomId"
                        label="Phòng"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn phòng bảo vệ' }]}
                    >
                        <Select
                            placeholder="Chọn phòng bảo vệ"
                            allowClear
                            showSearch
                            onChange={(value) => {
                                form.setFieldsValue({
                                    roomId: value,
                                })
                            }}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={roomData.map((room) => ({
                                value: room.id,
                                label: room.name,
                            }))}
                        />
                    </FormItem>
                    <FormItem
                        form={form}
                        name="defenseDate"
                        label="Ngày bảo vệ"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn ngày bảo vệ' }]}
                    >
                        <DatePicker
                            placeholder="Chọn ngày bảo vệ"
                            format={{
                                format: 'DD/MM/YYYY',
                                type: 'mask',
                            }}
                            className="w-full"
                            onChange={(value) => {
                                form.setFieldsValue({
                                    defenseDate: value,
                                })
                            }}
                        />
                    </FormItem>
                    <FormItem
                        form={form}
                        name="sessionId"
                        label="Ca bảo vệ"
                        className="mb-5"
                        labelAlign="left"
                        {...formItemLayout}
                        rules={[{ required: true, message: 'Vui lòng chọn ca bảo vệ' }]}
                    >
                        <Select
                            placeholder="Chọn ca bảo vệ"
                            allowClear
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            options={defenseSessionData.map((session) => ({
                                value: session.id,
                                label: session.startTime
                                    ? dayjs(session.startTime).format('HH:mm')
                                    : '',
                            }))}
                        />
                    </FormItem>
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default ModalCauHinhLuanVan
