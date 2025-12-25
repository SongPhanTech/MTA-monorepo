import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import {
    Checkbox,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Row,
    Tabs,
    type TabsProps,
    Typography,
} from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import {
    CloudUploadOutlined,
    DollarOutlined,
    SettingOutlined,
    SolutionOutlined,
} from '@ant-design/icons'
import DocumentPaths from '@components/commons/documentPaths'
import { CouncilProposalStatus, CouncilRole, type DocumentFile } from '@workspace/db'
import {
    useCreateCouncil,
    useCreateCouncilMember,
    useCreatePaymentRecord,
    useCreateSupervisorPaymentRecord,
    useDeleteCouncilMember,
    useFindManyDefenseSession,
    useFindManyExpertProfile,
    useFindManyRoom,
    useFindUniqueThesisProject,
    useUpdateCouncilMember,
    useUpdateDefenseRecord,
    useUpdateLibrarySubmission,
    useUpdatePaymentRecord,
    useUpdateSupervisorPaymentRecord,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useState } from 'react'
// import  {useEffect} from 'react'
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
    thesisLibraryId?: string
    isHardcopy?: boolean
    isSoftcopy?: boolean
    librarianNote?: string
    submissionDate?: Date
    documentFile?: DocumentFile[]
    supervisorPaymentRecordId?: string
    supervisorId?: string
    supervisorName?: string
    supervisorPaymentAmount?: number
    supervisorPaymentDate?: string
    supervisorPaymentTransactionCode?: string
    coSupervisorId?: string
    coSupervisorName?: string
    coSupervisorPaymentRecordId?: string
    coSupervisorPaymentAmount?: number
    coSupervisorPaymentDate?: string
    coSupervisorPaymentTransactionCode?: string
    councilChairmanName?: string
    councilChairmanId?: string
    councilChairmanPaymentAmount?: number
    councilSecretaryName?: string
    councilSecretaryId?: string
    councilSecretaryPaymentAmount?: number
    councilReviewer1Name?: string
    councilReviewer1Id?: string
    councilReviewer1PaymentAmount?: number
    councilReviewer2Name?: string
    councilReviewer2Id?: string
    councilReviewer2PaymentAmount?: number
    councilMemberName?: string
    councilMemberId?: string
    councilMemberPaymentAmount?: number
    finalResult?: number
    commentsCouncil?: string
    isCompleteCouncil?: boolean
    attachments?: DocumentFile[]
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
    const { TextArea } = Input
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [attachments, setAttachments] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<ModalCauHinhLuanVanType>()
    const [activeTabKey, setActiveTabKey] = useState<string>('defenseConfig')
    const { isOpen, onClose, input } = useDisclosure<{
        thesisProjectId: string
        thesisSessionId: string
    }>({
        tag: 'ModalCauHinhLuanVan',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const formItemLayout = {
        labelCol: { flex: '0 0 150px' },
        wrapperCol: { flex: '1' },
    }

    const handleConfigDefense = async (data?: ModalCauHinhLuanVanType) => {
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
            }

            if (thesisProjectData?.councilId) {
                const councilId = thesisProjectData.councilId

                await updateThesisProject({
                    where: { id: thesisProjectId },
                    data: updateThesisProjectPayload,
                })

                const currentMemberIds = thesisProjectData?.council?.members ?? []

                if (currentMemberIds.length > 0) {
                    const hardDeletePromises = currentMemberIds.map((member) => {
                        return Promise.all([
                            updateCouncilMember({
                                where: { id: member.id },
                                data: { deletedAt: new Date() },
                            }),
                            updatePaymentRecord({
                                where: { id: member.payment?.id },
                                data: { deletedAt: new Date() },
                            }),
                        ])
                    })
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
                    .filter((key) => Number.isNaN(Number(key)))
                    .map(async (key) => {
                        const expertId = rolesMapping[key as keyof typeof CouncilRole]

                        if (!expertId) return

                        const payload = {
                            role: CouncilRole[key as keyof typeof CouncilRole],
                            expertId: expertId,
                            councilId: councilId,
                        }
                        const councilMember = await createCouncilMember({ data: payload })
                        const payment = {
                            amount: new Decimal(0),
                            expertId: expertId,
                            councilMemberId: councilMember?.id ?? '',
                        }
                        await createPaymentRecord({ data: payment })
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
                    .filter((key) => Number.isNaN(Number(key)))
                    .map(async (key) => {
                        const expertId = rolesMapping[key as keyof typeof CouncilRole]
                        if (!expertId) return

                        const payload = {
                            role: CouncilRole[key as keyof typeof CouncilRole],
                            expertId: expertId,
                            councilId: councilId,
                        }
                        const councilMember = await createCouncilMember({ data: payload })
                        const payment = {
                            amount: new Decimal(0),
                            expertId: expertId,
                            councilMemberId: councilMember?.id ?? '',
                        }
                        await createPaymentRecord({ data: payment })
                    })
                    .filter(Boolean) as Promise<any>[]

                await Promise.all(creationPromises)

                const dataThesisProject = {
                    ...updateThesisProjectPayload,
                    council: {
                        connect: { id: councilId },
                    },
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

    const handleSubmitThesis = async (data: ModalCauHinhLuanVanType) => {
        // const filesInForm = (data as any).documentFile || []
        // const initialFiles = document
        // const thesisLibraryId = thesisProjectData?.librarySubmission?.id
        // if (!thesisLibraryId) {
        //     message.error('Không tìm thấy ID nộp luận văn thư viện.')
        //     return
        // }
        // try {
        //     showSpinner()
        //     const dataSubmit = {
        //         submissionDate: data.submissionDate,
        //         isHardcopy: data.isHardcopy,
        //         isSoftcopy: data.isSoftcopy,
        //         librarianNote: data.librarianNote,
        //         documentFile: {
        //             upsert: filesInForm
        //                 .filter((file: DocumentFile) => !!file.id)
        //                 .map((file: DocumentFile) => ({
        //                     where: { id: file.id },
        //                     create: {
        //                         name: file.name,
        //                         path: file.path,
        //                         mimeType: file.mimeType,
        //                         size: file.size,
        //                     },
        //                     update: {
        //                         name: file.name,
        //                         path: file.path,
        //                         mimeType: file.mimeType,
        //                         size: file.size,
        //                     },
        //                 })),
        //             create: filesInForm
        //                 .filter((file: DocumentFile) => !file.id)
        //                 .map((file: DocumentFile) => ({
        //                     name: file.name,
        //                     path: file.path,
        //                     mimeType: file.mimeType,
        //                     size: file.size,
        //                 })),
        //             disconnect: initialFiles
        //                 .filter(
        //                     (initialFile) =>
        //                         !filesInForm.some(
        //                             (finalFile: DocumentFile) => finalFile.id === initialFile.id
        //                         )
        //                 )
        //                 .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
        //         },
        //     }
        //     await updateLibrarySubmission({
        //         where: { id: thesisLibraryId },
        //         data: dataSubmit,
        //     })
        //     message.success('Cập nhật thông tin nộp luận văn thành công')
        //     onClose()
        // } catch (error: any) {
        //     const errorMessage =
        //         error?.info?.message || 'Đã xảy ra lỗi khi cập nhật thông tin nộp luận văn.'
        //     message.error(errorMessage)
        // } finally {
        //     hideSpinner()
        // }
    }
    const handlePaymentThesis = async (data: ModalCauHinhLuanVanType) => {
        // try {
        //     showSpinner()
        //     if (thesisProjectData?.supervisorPayments?.length === 0) {
        //         const gvhd1Payment = {
        //             expert: { connect: { id: thesisProjectData?.supervisor?.id ?? '' } },
        //             amount: new Decimal(data.supervisorPaymentAmount ?? 0),
        //             thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //             description: '1',
        //         }
        //         await createSupervisorPaymentRecord({ data: gvhd1Payment })
        //         if (data?.coSupervisorId) {
        //             const gvhd2Payment = {
        //                 expert: { connect: { id: data?.coSupervisorId ?? '' } },
        //                 amount: new Decimal(data.coSupervisorPaymentAmount ?? 0),
        //                 thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //                 description: '2',
        //             }
        //             await createSupervisorPaymentRecord({ data: gvhd2Payment })
        //         }
        //     } else if (thesisProjectData?.supervisorPayments?.length === 1) {
        //         const gvhd1Payment = {
        //             expert: { connect: { id: thesisProjectData?.supervisor?.id ?? '' } },
        //             amount: new Decimal(data.supervisorPaymentAmount ?? 0),
        //             thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //             description: '1',
        //         }
        //         await updateSupervisorPaymentRecord({
        //             data: gvhd1Payment,
        //             where: { id: thesisProjectData?.supervisorPayments[0]?.id ?? '' },
        //         })
        //         if (data?.coSupervisorId) {
        //             const gvhd2Payment = {
        //                 expert: { connect: { id: data?.coSupervisorId ?? '' } },
        //                 amount: new Decimal(data.coSupervisorPaymentAmount ?? 0),
        //                 thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //                 description: '2',
        //             }
        //             await createSupervisorPaymentRecord({ data: gvhd2Payment })
        //         }
        //     } else if (thesisProjectData?.supervisorPayments?.length === 2) {
        //         const gvhd1Payment = {
        //             expert: { connect: { id: thesisProjectData?.supervisor?.id ?? '' } },
        //             amount: new Decimal(data.supervisorPaymentAmount ?? 0),
        //             thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //             description: '1',
        //         }
        //         await updateSupervisorPaymentRecord({
        //             data: gvhd1Payment,
        //             where: { id: thesisProjectData?.supervisorPayments[0]?.id ?? '' },
        //         })
        //         if (data?.coSupervisorId) {
        //             const gvhd2Payment = {
        //                 expert: { connect: { id: data?.coSupervisorId ?? '' } },
        //                 amount: new Decimal(data.coSupervisorPaymentAmount ?? 0),
        //                 thesisProject: { connect: { id: thesisProjectData?.id ?? '' } },
        //                 description: '2',
        //             }
        //             await updateSupervisorPaymentRecord({
        //                 data: gvhd2Payment,
        //                 where: { id: thesisProjectData?.supervisorPayments[1]?.id ?? '' },
        //             })
        //         }
        //     }
        //     message.success('Cập nhật thanh toán thành công')
        //     onClose()
        // } catch (error: any) {
        //     const errorMessage = error?.info?.message || 'Đã xảy ra lỗi khi cập nhật thanh toán.'
        //     message.error(errorMessage)
        // } finally {
        //     hideSpinner()
        // }
    }
    const handleInforSubmit = async (data: ModalCauHinhLuanVanType) => {
        // try {
        //     showSpinner()
        //     const filesInForm = (data as any).attachments || []
        //     const initialFiles = attachments
        //     const payload = {
        //         finalScore: new Decimal(data.finalResult ?? 0),
        //         comments: data.commentsCouncil,
        //         isProfileComplete: data.isCompleteCouncil,
        //         documents: {
        //             upsert: filesInForm
        //                 .filter((file: DocumentFile) => !!file.id)
        //                 .map((file: DocumentFile) => ({
        //                     where: { id: file.id },
        //                     create: {
        //                         name: file.name,
        //                         path: file.path,
        //                         mimeType: file.mimeType,
        //                         size: file.size,
        //                     },
        //                     update: {
        //                         name: file.name,
        //                         path: file.path,
        //                         mimeType: file.mimeType,
        //                         size: file.size,
        //                     },
        //                 })),
        //             create: filesInForm
        //                 .filter((file: DocumentFile) => !file.id)
        //                 .map((file: DocumentFile) => ({
        //                     name: file.name,
        //                     path: file.path,
        //                     mimeType: file.mimeType,
        //                     size: file.size,
        //                 })),
        //             disconnect: initialFiles
        //                 .filter(
        //                     (initialFile) =>
        //                         !filesInForm.some(
        //                             (finalFile: DocumentFile) => finalFile.id === initialFile.id
        //                         )
        //                 )
        //                 .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
        //         },
        //     }
        //     await updateDefenseRecord({
        //         data: payload,
        //         where: { id: thesisProjectData?.defenseRecord?.id ?? '' },
        //     })
        //     message.success('Cập nhật thông tin hồ sơ và kết quả bảo vệ thành công')
        //     onClose()
        // } catch (error: any) {
        //     const errorMessage =
        //         error?.info?.message ||
        //         'Đã xảy ra lỗi khi cập nhật thông tin hồ sơ và kết quả bảo vệ.'
        //     message.error(errorMessage)
        // } finally {
        //     hideSpinner()
        // }
    }
    const onOk = async () => {
        const defenseConfigFields: (keyof ModalCauHinhLuanVanType)[] = [
            'chairman',
            'secretary',
            'reviewer1',
            'reviewer2',
            'member',
            'roomId',
            'defenseDate',
            'sessionId',
        ]

        const submitThesisFields: (keyof ModalCauHinhLuanVanType)[] = [
            'submissionDate',
            'isHardcopy',
            'isSoftcopy',
            'librarianNote',
            'documentFile',
        ]

        const paymentThesisFields: (keyof ModalCauHinhLuanVanType)[] = [
            'supervisorPaymentAmount',
            'coSupervisorPaymentAmount',
        ]
        const inforSubmitFields: (keyof ModalCauHinhLuanVanType)[] = [
            'finalResult',
            'commentsCouncil',
            'isCompleteCouncil',
            'attachments',
        ]
        const dataFormValue = form.getFieldsValue()

        try {
            if (activeTabKey === 'defenseConfig') {
                await form.validateFields(defenseConfigFields as string[])
                await handleConfigDefense(dataFormValue)
            } else if (activeTabKey === 'defenseInforSubmit') {
                await form.validateFields(submitThesisFields as string[])
                await handleSubmitThesis(dataFormValue)
            } else if (activeTabKey === 'defenseInforPayment') {
                await form.validateFields(paymentThesisFields as string[])
                await handlePaymentThesis(dataFormValue)
            } else if (activeTabKey === 'inforSubmit') {
                await form.validateFields(inforSubmitFields as string[])
                await handleInforSubmit(dataFormValue)
            }
        } catch (error) {
            return
        }
    }

    const { data: expertProfileData = [] } = useFindManyExpertProfile()
    const { data: roomData = [] } = useFindManyRoom()
    const { data: defenseSessionData = [] } = useFindManyDefenseSession()
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    const { mutateAsync: createCouncil } = useCreateCouncil()
    const { mutateAsync: createCouncilMember } = useCreateCouncilMember()
    const { mutateAsync: createPaymentRecord } = useCreatePaymentRecord()
    const { mutateAsync: updatePaymentRecord } = useUpdatePaymentRecord()
    const { mutateAsync: deleteCouncilMember } = useDeleteCouncilMember()
    const { mutateAsync: updateCouncilMember } = useUpdateCouncilMember()
    const { mutateAsync: updateLibrarySubmission } = useUpdateLibrarySubmission()
    const { mutateAsync: createSupervisorPaymentRecord } = useCreateSupervisorPaymentRecord()
    const { mutateAsync: updateSupervisorPaymentRecord } = useUpdateSupervisorPaymentRecord()
    const { mutateAsync: updateDefenseRecord } = useUpdateDefenseRecord()
    const { data: thesisProjectData } = useFindUniqueThesisProject({
        where: { id: input?.thesisProjectId },
        include: {
            council: {
                include: {
                    members: {
                        include: {
                            expert: true,
                            payment: true,
                        },
                    },
                },
            },
            room: true,
            defenseSession: true,
            defenseRecord: {
                include: {
                    documents: true,
                },
            },
            librarySubmission: {
                include: {
                    documentFile: true,
                },
            },
            supervisor: true,
            coSupervisor: true,
            // supervisorPayments: {
            //     include: {
            //         expert: true,
            //     },

            //     orderBy: {
            //         description: 'asc',
            //     },
            // },
        },
    })

    // useEffect(() => {
    //     if (thesisProjectData) {
    //         // form.setFieldsValue({
    //         //     chairman: thesisProjectData?.council?.members.find(
    //         //         (member) => member.role === CouncilRole.CHAIRMAN
    //         //     )?.expert?.id,
    //         //     secretary: thesisProjectData?.council?.members.find(
    //         //         (member) => member.role === CouncilRole.SECRETARY
    //         //     )?.expert?.id,
    //         //     reviewer1: thesisProjectData?.council?.members.find(
    //         //         (member) => member.role === CouncilRole.REVIEWER_1
    //         //     )?.expert?.id,
    //         //     reviewer2: thesisProjectData?.council?.members.find(
    //         //         (member) => member.role === CouncilRole.REVIEWER_2
    //         //     )?.expert?.id,
    //         //     member: thesisProjectData?.council?.members.find(
    //         //         (member) => member.role === CouncilRole.MEMBER
    //         //     )?.expert?.id,
    //         //     roomId: thesisProjectData?.room?.id,
    //         //     defenseDate: thesisProjectData?.defenseDate
    //         //         ? dayjs(thesisProjectData?.defenseDate)
    //         //         : undefined,
    //         //     sessionId: thesisProjectData?.defenseSession?.id,
    //         //     submissionDate: thesisProjectData?.librarySubmission?.submissionDate
    //         //         ? dayjs(thesisProjectData?.librarySubmission?.submissionDate)
    //         //         : undefined,
    //         //     isHardcopy: thesisProjectData?.librarySubmission?.isHardcopy,
    //         //     isSoftcopy: thesisProjectData?.librarySubmission?.isSoftcopy,
    //         //     librarianNote: thesisProjectData?.librarySubmission?.librarianNote ?? '',
    //         //     supervisorId: thesisProjectData?.supervisorId ?? '',
    //         //     supervisorName: thesisProjectData?.supervisor?.name ?? '',
    //         //     coSupervisorId: thesisProjectData?.coSupervisorId ?? '',
    //         //     coSupervisorName: thesisProjectData?.coSupervisor?.name ?? '',
    //         //     supervisorPaymentAmount:
    //         //         thesisProjectData?.supervisorPayments[0]?.amount?.toNumber() ?? 0,
    //         //     coSupervisorPaymentAmount:
    //         //         thesisProjectData?.supervisorPayments[1]?.amount?.toNumber() ?? 0,
    //         //     supervisorPaymentTransactionCode:
    //         //         thesisProjectData?.supervisorPayments[0]?.transactionCode ?? '',
    //         //     coSupervisorPaymentTransactionCode:
    //         //         thesisProjectData?.supervisorPayments[1]?.transactionCode ?? '',
    //         //     finalResult: thesisProjectData?.defenseRecord?.finalScore?.toNumber() ?? 0,
    //         //     commentsCouncil: thesisProjectData?.defenseRecord?.comments ?? '',
    //         //     isCompleteCouncil: thesisProjectData?.defenseRecord?.isProfileComplete ?? false,
    //         //     attachments: thesisProjectData?.defenseRecord?.documents ?? [],
    //         // })
    //         // setDocument(thesisProjectData?.librarySubmission?.documentFile ?? [])
    //         // setAttachments(thesisProjectData?.defenseRecord?.documents ?? [])
    //     } else {
    //         setDocument([])
    //         setAttachments([])
    //     }
    // }, [form, thesisProjectData])
    const itemTab: TabsProps['items'] = [
        {
            key: 'defenseConfig',
            label: 'Cấu hình bảo vệ',
            icon: <SettingOutlined />,
            children: (
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
            ),
        },
        {
            key: 'defenseInforSubmit',
            label: 'Thông tin nộp luận văn',
            icon: <CloudUploadOutlined />,
            children: (
                <Row gutter={32} className="w-full mt-4">
                    <Col span={24}>
                        <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                            Thông tin nộp luận văn thư viện
                        </Title>
                        <Row gutter={16}>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="submissionDate"
                                    label="Ngày nộp"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                    rules={[{ required: true, message: 'Vui lòng chọn Ngày nộp' }]}
                                >
                                    <DatePicker
                                        placeholder="Chọn Ngày nộp"
                                        format={{
                                            format: 'DD/MM/YYYY',
                                            type: 'mask',
                                        }}
                                        className="w-full"
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                submissionDate: value,
                                            })
                                        }}
                                    />
                                </FormItem>
                            </Col>

                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="isHardcopy"
                                    label="Nộp bản cứng"
                                    className="mb-5"
                                    labelAlign="left"
                                    valuePropName="checked"
                                >
                                    <Checkbox
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                isHardcopy: value.target.checked,
                                            })
                                        }}
                                    />
                                </FormItem>
                            </Col>

                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="isSoftcopy"
                                    label="Nộp bản mềm"
                                    className="mb-5"
                                    labelAlign="left"
                                    valuePropName="checked"
                                >
                                    <Checkbox
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                isSoftcopy: value.target.checked,
                                            })
                                        }}
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <FormItem
                            form={form}
                            name="librarianNote"
                            label="Ghi chú"
                            className="mb-5"
                            labelAlign="left"
                            {...formItemLayout}
                        >
                            <TextArea
                                placeholder="Nhập Ghi chú "
                                rows={4}
                                className="w-full"
                                onChange={(e) => {
                                    form.setFieldsValue({
                                        librarianNote: e.target.value,
                                    })
                                }}
                            />
                        </FormItem>

                        <FormItem
                            form={form}
                            name="documentFile"
                            label="File minh chứng"
                            className="mb-5"
                            labelAlign="left"
                            {...formItemLayout}
                        >
                            <DocumentPaths
                                form={form}
                                data={document}
                                relationId={thesisProjectData?.librarySubmission?.id ?? ''}
                                relationType="librarySubmissionId"
                                titleForm="documentFile"
                            />
                        </FormItem>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'defenseInforPayment',
            label: 'Thông tin thanh toán',
            icon: <DollarOutlined />,
            children: (
                <Row gutter={32} className="w-full mt-4">
                    {/* Cột chính chứa thông tin thanh toán */}
                    <Col span={24}>
                        <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                            Thanh toán giảng viên hướng dẫn
                        </Title>

                        {/* --- GVHD 1 --- */}
                        <Row gutter={16} align="middle">
                            {/* Phần hiển thị Tên GVHD 1 (chiếm 12/24 cột) */}
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="supervisorName"
                                    label="GVHD 1"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                                <FormItem
                                    form={form}
                                    name="supervisorId"
                                    label="GVHD 1"
                                    className="mb-5 hidden"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="supervisorPaymentAmount" // Tên trường mới
                                    label="Số tiền "
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue('supervisorName'),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        placeholder="Nhập số tiền"
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        suffix="VNĐ"
                                        disabled={!form.getFieldValue('supervisorName')}
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="coSupervisorName"
                                    label="GVHD 2"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>
                            <FormItem
                                form={form}
                                name="coSupervisorId"
                                label="GVHD 2"
                                className="mb-5 hidden"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Input className="w-full" disabled />
                            </FormItem>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="coSupervisorPaymentAmount" // Tên trường mới
                                    label="Số tiền"
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue('coSupervisorName'),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        placeholder="Nhập số tiền"
                                        suffix="VNĐ"
                                        disabled={!form.getFieldValue('coSupervisorName')}
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                            Thanh toán hội đồng
                        </Title>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilChairmanName"
                                    label="Chủ tịch "
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                                <FormItem
                                    form={form}
                                    name="councilChairmanId"
                                    label="GVHD 1"
                                    className="mb-5 hidden"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilChairmanPaymentAmount" // Tên trường mới
                                    label="Số tiền "
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue(
                                                'councilChairmanPaymentAmount'
                                            ),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        placeholder="Nhập số tiền"
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        suffix="VNĐ"
                                        disabled={
                                            !form.getFieldValue('councilChairmanPaymentAmount')
                                        }
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilSecretaryName"
                                    label="Thư kí"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>
                            <FormItem
                                form={form}
                                name="councilSecretaryId"
                                label="Thư kí"
                                className="mb-5 hidden"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Input className="w-full" disabled />
                            </FormItem>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilSecretaryPaymentAmount" // Tên trường mới
                                    label="Số tiền"
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue(
                                                'councilSecretaryPaymentAmount'
                                            ),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        placeholder="Nhập số tiền"
                                        suffix="VNĐ"
                                        disabled={
                                            !form.getFieldValue('councilSecretaryPaymentAmount')
                                        }
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilReviewer1Name"
                                    label="Phản biện 1"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                                <FormItem
                                    form={form}
                                    name="councilReviewer1Id"
                                    label="Phản biện 1"
                                    className="mb-5 hidden"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilReviewer1PaymentAmount" // Tên trường mới
                                    label="Số tiền "
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue(
                                                'councilReviewer1PaymentAmount'
                                            ),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        placeholder="Nhập số tiền"
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        suffix="VNĐ"
                                        disabled={
                                            !form.getFieldValue('councilReviewer1PaymentAmount')
                                        }
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilReviewer2Name"
                                    label="Phản biện 2"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                                <FormItem
                                    form={form}
                                    name="councilReviewer2Id"
                                    label="Phản biện 1"
                                    className="mb-5 hidden"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilReviewer2PaymentAmount" // Tên trường mới
                                    label="Số tiền "
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue(
                                                'councilReviewer2PaymentAmount'
                                            ),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        placeholder="Nhập số tiền"
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        suffix="VNĐ"
                                        disabled={
                                            !form.getFieldValue('councilReviewer2PaymentAmount')
                                        }
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilMemberName"
                                    label="Ủy viên"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                                <FormItem
                                    form={form}
                                    name="councilMemberId"
                                    label="Ủy viên"
                                    className="mb-5 hidden"
                                    labelAlign="left"
                                    {...formItemLayout}
                                >
                                    <Input className="w-full" disabled />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="councilMemberPaymentAmount" // Tên trường mới
                                    label="Số tiền "
                                    className="mb-5"
                                    labelAlign="left"
                                    rules={[
                                        {
                                            required: !!form.getFieldValue(
                                                'councilMemberPaymentAmount'
                                            ),
                                            message: 'Vui lòng nhập số tiền thanh toán',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        placeholder="Nhập số tiền"
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, '') as unknown as number
                                        }
                                        suffix="VNĐ"
                                        disabled={!form.getFieldValue('councilMemberPaymentAmount')}
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'inforSubmit',
            label: 'Hồ sơ và Kết quả bảo vệ',
            icon: <SolutionOutlined />,
            children: (
                <Row gutter={32} className="w-full mt-4">
                    <Col span={24}>
                        <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
                            Hồ sơ và Kết quả bảo vệ
                        </Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="finalResult"
                                    label="Kết quả cuối cùng"
                                    className="mb-5"
                                    labelAlign="left"
                                    {...formItemLayout}
                                    rules={[{ required: true, message: 'Vui lòng nhập kết quả' }]}
                                >
                                    <InputNumber
                                        className="w-2/3"
                                        min={0}
                                        placeholder="Nhập kết quả"
                                    />
                                </FormItem>
                            </Col>

                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="isCompleteCouncil"
                                    label="Hoàn thành bảo vệ"
                                    className="mb-5"
                                    labelAlign="left"
                                    valuePropName="checked"
                                >
                                    <Checkbox
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                isCompleteCouncil: value.target.checked,
                                            })
                                        }}
                                    />
                                </FormItem>
                            </Col>
                        </Row>

                        <FormItem
                            form={form}
                            name="commentsCouncil"
                            label="Nhận xét"
                            className="mb-5"
                            labelAlign="left"
                            {...formItemLayout}
                        >
                            <TextArea
                                placeholder="Nhập Nhận xét của hội đồng"
                                rows={4}
                                className="w-full"
                                onChange={(e) => {
                                    form.setFieldsValue({
                                        commentsCouncil: e.target.value,
                                    })
                                }}
                            />
                        </FormItem>

                        <FormItem
                            form={form}
                            name="attachments"
                            label="File đính kèm"
                            className="mb-5"
                            labelAlign="left"
                            {...formItemLayout}
                        >
                            <DocumentPaths
                                form={form}
                                data={attachments}
                                relationId={thesisProjectData?.librarySubmission?.id ?? ''}
                                relationType="librarySubmissionId"
                                titleForm="attachments"
                            />
                        </FormItem>
                    </Col>
                </Row>
            ),
        },
    ]
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onOk={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Cấu hình bảo vệ Luận văn/Đề án'}
            layout="horizontal"
            width={1000}
        >
            <Tabs
                defaultActiveKey="defenseConfig"
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                items={itemTab}
                className="w-full mt-4"
            />
        </PutFormModal>
    )
}

export default ModalCauHinhLuanVan
