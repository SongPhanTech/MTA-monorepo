import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
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
} from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import {
  CloudUploadOutlined,
  DollarOutlined,
  SettingOutlined,
  SolutionOutlined,
} from "@ant-design/icons"
import DocumentPaths from "@components/commons/documentPaths"
import {
  CouncilProposalStatus,
  CouncilRole,
  type DocumentFile,
  PaymentStatus,
  SupervisorRole,
} from "@workspace/db"
import {
  useCreateCouncil,
  useCreateCouncilMember,
  useCreatePaymentRecord,
  useCreateSupervisorPaymentRecord,
  useFindManyDefaultCouncilRolePayAmount,
  useFindManyDefaultSupervisorPayAmount,
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
} from "@workspace/db/hooks"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useCallback, useEffect, useState } from "react"

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
    const expertIds = [data.chairman, data.secretary, data.reviewer1, data.reviewer2, data.member]
    const validExpertIds = expertIds.filter((id): id is string => !!id && id.trim() !== "")

    const uniqueIds = new Set(validExpertIds)

    return validExpertIds.length !== uniqueIds.size
  }
  const { TextArea } = Input
  const [document, setDocument] = useState<DocumentFile[]>([])

  const [attachments, setAttachments] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<ModalCauHinhLuanVanType>()

  const [activeTabKey, setActiveTabKey] = useState<string>("defenseConfig")
  const { isOpen, onClose, input } = useDisclosure<{
    thesisProjectId: string
    thesisSessionId: string
  }>({
    tag: "ModalCauHinhLuanVan",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const formItemLayout = {
    labelCol: { flex: "0 0 150px" },
    wrapperCol: { flex: "1" },
  }

  const handleConfigDefense = async (data?: ModalCauHinhLuanVanType) => {
    if (!data) return

    if (isCouncilRolesDuplicated(data)) {
      throw new Error("Một thành viên không thể có nhiều vai trò trong Hội đồng.")
    }

    const thesisProjectId = input?.thesisProjectId || thesisProjectData?.id
    if (!thesisProjectId) {
      return
    }

    const updateThesisProjectPayload: any = {}

    if (data.defenseDate) {
      updateThesisProjectPayload.defenseDate = data.defenseDate
    }
    if (data.roomId) {
      updateThesisProjectPayload.room = { connect: { id: data.roomId } }
    }
    if (data.sessionId) {
      updateThesisProjectPayload.defenseSession = { connect: { id: data.sessionId } }
    }

    let councilId = thesisProjectData?.councilId

    if (
      !councilId &&
      (data.chairman || data.secretary || data.reviewer1 || data.reviewer2 || data.member)
    ) {
      const newCouncil = await createCouncil({
        data: {
          proposedDate: new Date(),
          status: CouncilProposalStatus.PENDING,
        },
      })
      councilId = newCouncil?.id
      if (!councilId) throw new Error("Không thể tạo Hội đồng.")

      updateThesisProjectPayload.council = { connect: { id: councilId } }
    }

    if (Object.keys(updateThesisProjectPayload).length > 0) {
      await updateThesisProject({
        where: { id: thesisProjectId },
        data: updateThesisProjectPayload,
      })
    }

    const rolesMapping = [
      { role: CouncilRole.CHAIRMAN, expertId: data.chairman },
      { role: CouncilRole.SECRETARY, expertId: data.secretary },
      { role: CouncilRole.REVIEWER_1, expertId: data.reviewer1 },
      { role: CouncilRole.REVIEWER_2, expertId: data.reviewer2 },
      { role: CouncilRole.MEMBER, expertId: data.member },
    ]

    const currentMembers = thesisProjectData?.council?.members ?? []

    const memberPromises = rolesMapping
      .filter((item) => !!item.expertId)
      .map((item) => {
        const existingMember = currentMembers.find((m) => m.role === item.role)

        if (existingMember) {
          return updateCouncilMember({
            where: { id: existingMember.id },
            data: { expertId: item.expertId },
          })
        }
        return createCouncilMember({
          data: {
            role: item.role,
            expertId: item.expertId || "",
            councilId: councilId || "",
          },
        })
      })

    await Promise.all(memberPromises)
  }

  const handleSubmitThesis = async (data: ModalCauHinhLuanVanType) => {
    const filesInForm = (data as any).documentFile || []
    const initialFiles = document
    const thesisLibraryId = thesisProjectData?.librarySubmission?.id
    if (!thesisLibraryId) {
      return
    }

    const dataSubmit = {
      submissionDate: data.submissionDate,
      isHardcopy: data.isHardcopy,
      isSoftcopy: data.isSoftcopy,
      librarianNote: data.librarianNote,
      documentFile: {
        upsert: filesInForm
          .filter((file: DocumentFile) => !!file.id)
          .map((file: DocumentFile) => ({
            where: { id: file.id },
            create: {
              name: file.name,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
            update: {
              name: file.name,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
          })),
        create: filesInForm
          .filter((file: DocumentFile) => !file.id)
          .map((file: DocumentFile) => ({
            name: file.name,
            path: file.path,
            mimeType: file.mimeType,
            size: file.size,
          })),
        disconnect: initialFiles
          .filter(
            (initialFile) =>
              !filesInForm.some((finalFile: DocumentFile) => finalFile.id === initialFile.id)
          )
          .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
      },
    }
    await updateLibrarySubmission({
      where: { id: thesisLibraryId },
      data: dataSubmit,
    })
  }
  const handlePaymentThesis = async (data: ModalCauHinhLuanVanType) => {
    const thesisProjectId = thesisProjectData?.id
    if (!thesisProjectId) return

    const paymentTasks: Promise<any>[] = []

    if (data.supervisorId) {
      const amount = new Decimal(data.supervisorPaymentAmount ?? 0)
      if (thesisProjectData?.supervisorPaymentId) {
        paymentTasks.push(
          updateSupervisorPaymentRecord({
            where: { id: thesisProjectData.supervisorPaymentId },
            data: { amount },
          })
        )
      } else {
        paymentTasks.push(
          createSupervisorPaymentRecord({
            data: {
              amount,
              status: PaymentStatus.PENDING,
              thesisProjects: { connect: { id: thesisProjectId } },
            },
          })
        )
      }
    }

    if (data.coSupervisorId) {
      const amount = new Decimal(data.coSupervisorPaymentAmount ?? 0)
      if (thesisProjectData?.coSupervisorPaymentId) {
        paymentTasks.push(
          updateSupervisorPaymentRecord({
            where: { id: thesisProjectData.coSupervisorPaymentId },
            data: { amount },
          })
        )
      } else {
        paymentTasks.push(
          createSupervisorPaymentRecord({
            data: {
              amount,
              status: PaymentStatus.PENDING,
              coThesisProjects: { connect: { id: thesisProjectId } },
            },
          })
        )
      }
    }

    const councilRolesMap = [
      { role: CouncilRole.CHAIRMAN, amount: data.councilChairmanPaymentAmount },
      { role: CouncilRole.SECRETARY, amount: data.councilSecretaryPaymentAmount },
      { role: CouncilRole.REVIEWER_1, amount: data.councilReviewer1PaymentAmount },
      { role: CouncilRole.REVIEWER_2, amount: data.councilReviewer2PaymentAmount },
      { role: CouncilRole.MEMBER, amount: data.councilMemberPaymentAmount },
    ]

    councilRolesMap.forEach(({ role, amount }) => {
      const member = thesisProjectData?.council?.members.find((m) => m.role === role)
      if (member) {
        const decimalAmount = new Decimal(amount ?? 0)
        if (member.payment?.id) {
          paymentTasks.push(
            updatePaymentRecord({
              where: { id: member.payment.id },
              data: { amount: decimalAmount },
            })
          )
        } else {
          paymentTasks.push(
            createPaymentRecord({
              data: {
                amount: decimalAmount,
                status: PaymentStatus.PENDING,
                councilMember: { connect: { id: member.id } },
              },
            })
          )
        }
      }
    })
    await Promise.all(paymentTasks)
  }
  const handleInforSubmit = async (data: ModalCauHinhLuanVanType) => {
    const defenseRecordId = thesisProjectData?.defenseRecord?.id
    if (!defenseRecordId) return

    const filesInForm = (data as any).attachments || []
    const initialFiles = attachments
    const payload = {
      finalScore: new Decimal(data.finalResult ?? 0),
      comments: data.commentsCouncil,
      isProfileComplete: data.isCompleteCouncil,
      documents: {
        upsert: filesInForm
          .filter((file: DocumentFile) => !!file.id)
          .map((file: DocumentFile) => ({
            where: { id: file.id },
            create: {
              name: file.name,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
            update: {
              name: file.name,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
          })),
        create: filesInForm
          .filter((file: DocumentFile) => !file.id)
          .map((file: DocumentFile) => ({
            name: file.name,
            path: file.path,
            mimeType: file.mimeType,
            size: file.size,
          })),
        disconnect: initialFiles
          .filter(
            (initialFile) =>
              !filesInForm.some((finalFile: DocumentFile) => finalFile.id === initialFile.id)
          )
          .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
      },
    }
    await updateDefenseRecord({
      data: payload,
      where: { id: defenseRecordId },
    })
  }
  const onOk = async () => {
    const dataFormValue = form.getFieldsValue()

    try {
      showSpinner()
      await Promise.all([
        handleConfigDefense(dataFormValue),
        handleSubmitThesis(dataFormValue),
        handlePaymentThesis(dataFormValue),
        handleInforSubmit(dataFormValue),
      ])
      message.success("Lưu thông tin thành công")
      onClose()
    } catch (error: any) {
      message.error(error?.message || "Đã xảy ra lỗi khi lưu thông tin")
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
  const { mutateAsync: createPaymentRecord } = useCreatePaymentRecord()
  const { mutateAsync: updatePaymentRecord } = useUpdatePaymentRecord()
  const { mutateAsync: updateCouncilMember } = useUpdateCouncilMember()
  const { mutateAsync: updateLibrarySubmission } = useUpdateLibrarySubmission()
  const { mutateAsync: createSupervisorPaymentRecord } = useCreateSupervisorPaymentRecord()
  const { mutateAsync: updateSupervisorPaymentRecord } = useUpdateSupervisorPaymentRecord()
  const { data: defaultCouncilPay = [] } = useFindManyDefaultCouncilRolePayAmount()
  const { data: defaultSupervisorPay = [] } = useFindManyDefaultSupervisorPayAmount()
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
      supervisorPayment: true,
      coSupervisorPayment: true,
    },
  })
  const formatDecimal = useCallback((value: any): number => {
    if (!value) return 0
    if (typeof value === "number") return value
    return typeof value.toNumber === "function" ? value.toNumber() : Number(value)
  }, [])
  const isInAcademy = (expertId?: string) => {
    if (!expertId) return true
    const expert = expertProfileData.find((e) => e.id === expertId)
    return !!(expert as any)?.lecturerId
  }

  const getDefaultCouncilAmount = useCallback(
    (role: CouncilRole, expertId?: string) => {
      const inAcademy = isInAcademy(expertId)
      const config = defaultCouncilPay.find((c) => c.role === role && c.inAcademy === inAcademy)
      return formatDecimal(config?.amount)
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
    [defaultCouncilPay, formatDecimal, isInAcademy]
  )

  const getDefaultSupervisorAmount = useCallback(
    (role: SupervisorRole, expertId?: string) => {
      const inAcademy = isInAcademy(expertId)
      const config = defaultSupervisorPay.find((c) => c.role === role && c.inAcademy === inAcademy)
      return formatDecimal(config?.amount)
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
    [defaultSupervisorPay, formatDecimal, isInAcademy]
  )

  useEffect(() => {
    if (thesisProjectData) {
      const chairmanId = thesisProjectData?.council?.members.find(
        (m) => m.role === CouncilRole.CHAIRMAN
      )?.expert?.id
      const secretaryId = thesisProjectData?.council?.members.find(
        (m) => m.role === CouncilRole.SECRETARY
      )?.expert?.id
      const rev1Id = thesisProjectData?.council?.members.find(
        (m) => m.role === CouncilRole.REVIEWER_1
      )?.expert?.id
      const rev2Id = thesisProjectData?.council?.members.find(
        (m) => m.role === CouncilRole.REVIEWER_2
      )?.expert?.id
      const memberId = thesisProjectData?.council?.members.find(
        (m) => m.role === CouncilRole.MEMBER
      )?.expert?.id

      const getDisplayAmount = (role: CouncilRole, expertId?: string) => {
        const savedAmount = thesisProjectData?.council?.members.find((m) => m.role === role)
          ?.payment?.amount
        return savedAmount ? formatDecimal(savedAmount) : getDefaultCouncilAmount(role, expertId)
      }
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
        submissionDate: thesisProjectData?.librarySubmission?.submissionDate
          ? dayjs(thesisProjectData?.librarySubmission?.submissionDate)
          : undefined,
        isHardcopy: thesisProjectData?.librarySubmission?.isHardcopy,
        isSoftcopy: thesisProjectData?.librarySubmission?.isSoftcopy,
        librarianNote: thesisProjectData?.librarySubmission?.librarianNote ?? "",
        supervisorId: thesisProjectData?.supervisorId ?? "",
        supervisorName: thesisProjectData?.supervisor?.name ?? "",
        coSupervisorId: thesisProjectData?.coSupervisorId ?? "",
        coSupervisorName: thesisProjectData?.coSupervisor?.name ?? "",
        supervisorPaymentAmount: thesisProjectData?.supervisorPayment?.amount
          ? formatDecimal(thesisProjectData.supervisorPayment.amount)
          : getDefaultSupervisorAmount(
              SupervisorRole.SUPERVISOR,
              thesisProjectData.supervisorId ?? undefined
            ),

        coSupervisorPaymentAmount: thesisProjectData?.coSupervisorPayment?.amount
          ? formatDecimal(thesisProjectData.coSupervisorPayment.amount)
          : getDefaultSupervisorAmount(
              SupervisorRole.CO_SUPERVISOR,
              thesisProjectData.coSupervisorId ?? undefined
            ),
        supervisorPaymentTransactionCode:
          thesisProjectData?.supervisorPayment?.transactionCode ?? "",
        coSupervisorPaymentTransactionCode:
          thesisProjectData?.coSupervisorPayment?.transactionCode ?? "",
        finalResult: thesisProjectData?.defenseRecord?.finalScore?.toNumber() ?? 0,
        commentsCouncil: thesisProjectData?.defenseRecord?.comments ?? "",
        isCompleteCouncil: thesisProjectData?.defenseRecord?.isProfileComplete ?? false,
        attachments: thesisProjectData?.defenseRecord?.documents ?? [],
        councilChairmanPaymentAmount: getDisplayAmount(CouncilRole.CHAIRMAN, chairmanId),
        councilSecretaryPaymentAmount: getDisplayAmount(CouncilRole.SECRETARY, secretaryId),
        councilReviewer1PaymentAmount: getDisplayAmount(CouncilRole.REVIEWER_1, rev1Id),
        councilReviewer2PaymentAmount: getDisplayAmount(CouncilRole.REVIEWER_2, rev2Id),
        councilMemberPaymentAmount: getDisplayAmount(CouncilRole.MEMBER, memberId),
        councilChairmanName:
          thesisProjectData?.council?.members.find((member) => member.role === CouncilRole.CHAIRMAN)
            ?.expert?.name ?? "",
        councilMemberName:
          thesisProjectData?.council?.members.find((member) => member.role === CouncilRole.MEMBER)
            ?.expert?.name ?? "",
        councilSecretaryName:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.SECRETARY
          )?.expert?.name ?? "",
        councilReviewer1Name:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.REVIEWER_1
          )?.expert?.name ?? "",
        councilReviewer2Name:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.REVIEWER_2
          )?.expert?.name ?? "",
        councilChairmanId:
          thesisProjectData?.council?.members.find((member) => member.role === CouncilRole.CHAIRMAN)
            ?.expert?.id ?? "",
        councilSecretaryId:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.SECRETARY
          )?.expert?.id ?? "",
        councilReviewer1Id:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.REVIEWER_1
          )?.expert?.id ?? "",
        councilReviewer2Id:
          thesisProjectData?.council?.members.find(
            (member) => member.role === CouncilRole.REVIEWER_2
          )?.expert?.id ?? "",
        councilMemberId:
          thesisProjectData?.council?.members.find((member) => member.role === CouncilRole.MEMBER)
            ?.expert?.id ?? "",
      })
      setDocument(thesisProjectData?.librarySubmission?.documentFile ?? [])
      setAttachments(thesisProjectData?.defenseRecord?.documents ?? [])
    } else {
      setDocument([])
      setAttachments([])
    }
  }, [thesisProjectData, form, formatDecimal, getDefaultCouncilAmount, getDefaultSupervisorAmount])
  const itemTab: TabsProps["items"] = [
    {
      key: "defenseConfig",
      label: "Cấu hình bảo vệ",
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
                  const label = String(option?.label ?? "")
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
                  const label = String(option?.label ?? "")
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
                  const label = String(option?.label ?? "")
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
                  const label = String(option?.label ?? "")
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
                  const label = String(option?.label ?? "")
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
                  const label = String(option?.label ?? "")
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
            >
              <DatePicker
                placeholder="Chọn ngày bảo vệ"
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
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
            >
              <Select
                placeholder="Chọn ca bảo vệ"
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const label = String(option?.label ?? "")
                  return label.toLowerCase().includes(input.toLowerCase())
                }}
                options={defenseSessionData.map((session) => ({
                  value: session.id,
                  label: session.startTime ? dayjs(session.startTime).format("HH:mm") : "",
                }))}
              />
            </FormItem>
          </Col>
        </Row>
      ),
    },
    {
      key: "defenseInforSubmit",
      label: "Thông tin nộp luận văn",
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
                >
                  <DatePicker
                    placeholder="Chọn Ngày nộp"
                    format={{
                      format: "DD/MM/YYYY",
                      type: "mask",
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
                relationId={thesisProjectData?.librarySubmission?.id ?? ""}
                relationType="librarySubmissionId"
                titleForm="documentFile"
              />
            </FormItem>
          </Col>
        </Row>
      ),
    },
    {
      key: "defenseInforPayment",
      label: "Thông tin thanh toán",
      icon: <DollarOutlined />,
      children: (
        <Row gutter={32} className="w-full mt-4">
          <Col span={24}>
            <Title level={5} className="mb-4" style={{ marginTop: 0 }}>
              Thanh toán giảng viên hướng dẫn
            </Title>

            <Row gutter={16} align="middle">
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
                  name="supervisorPaymentAmount"
                  label="Số tiền "
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    placeholder="Nhập số tiền"
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("supervisorName")}
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
                  name="coSupervisorPaymentAmount"
                  label="Số tiền"
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    placeholder="Nhập số tiền"
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("coSupervisorName")}
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
                  <Input
                    className="w-full"
                    defaultValue={
                      thesisProjectData?.council?.members.find(
                        (member) => member.role === CouncilRole.CHAIRMAN
                      )?.expert?.name ?? ""
                    }
                    disabled
                  />
                </FormItem>
                <FormItem
                  form={form}
                  name="councilChairmanId"
                  label=""
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
                  name="councilChairmanPaymentAmount"
                  label="Số tiền "
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    placeholder="Nhập số tiền"
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("councilChairmanId")}
                  />
                </FormItem>
              </Col>
            </Row>

            <Row gutter={16} align="middle">
              <Col span={12}>
                <FormItem
                  form={form}
                  name="councilSecretaryName"
                  label="Thư ký"
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
                label="Thư ký"
                className="mb-5 hidden"
                labelAlign="left"
                {...formItemLayout}
              >
                <Input className="w-full" disabled />
              </FormItem>

              <Col span={12}>
                <FormItem
                  form={form}
                  name="councilSecretaryPaymentAmount"
                  label="Số tiền"
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    placeholder="Nhập số tiền"
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("councilSecretaryId")}
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
                  name="councilReviewer1PaymentAmount"
                  label="Số tiền "
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    placeholder="Nhập số tiền"
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("councilReviewer1PaymentAmount")}
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
                  name="councilReviewer2PaymentAmount"
                  label="Số tiền "
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    placeholder="Nhập số tiền"
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("councilReviewer2Id")}
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
                  name="councilMemberPaymentAmount"
                  label="Số tiền "
                  className="mb-5"
                  labelAlign="left"
                >
                  <InputNumber
                    className="w-2/3"
                    min={0}
                    placeholder="Nhập số tiền"
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    suffix="VNĐ"
                    disabled={!form.getFieldValue("councilMemberId")}
                  />
                </FormItem>
              </Col>
            </Row>
          </Col>
        </Row>
      ),
    },
    {
      key: "inforSubmit",
      label: "Hồ sơ và Kết quả bảo vệ",
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
                >
                  <InputNumber className="w-2/3" min={0} placeholder="Nhập kết quả" />
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
                relationId={thesisProjectData?.librarySubmission?.id ?? ""}
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
      title={"Cấu hình bảo vệ Luận văn/Đề án"}
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
