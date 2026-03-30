import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import { useCouncilRoleOptions } from "@hooks/councilRole"
import useSpinner from "@hooks/spinner"
import { CouncilRole, type DefaultCouncilRolePayAmount, PaymentStatus } from "@workspace/db/client"
import {
  useCreateManyPaymentRecord,
  useCreateManySupervisorPaymentRecord,
  useDeleteManyPaymentRecord,
  useDeleteManySupervisorPaymentRecord,
  useFindManyDefaultCouncilRolePayAmount,
  useFindManyThesisProject,
} from "@workspace/db/hooks"
import { Col, Form, InputNumber, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PaymentRecord = DefaultCouncilRolePayAmount & {
  chairman: number
  secretary: number
  reviewer1: number
  reviewer2: number
  member: number
  supervisor: number
}

const PutPaymentRecord = () => {
  const [form] = Form.useForm<PaymentRecord>()
  const { isOpen, onClose, input } = useDisclosure<{
    selectedRowKeys: string[]
  }>({
    tag: "PutPaymentRecord",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { getCouncilRoleLabel } = useCouncilRoleOptions()

  const { data: selectedThesisProjects } = useFindManyThesisProject(
    {
      where: {
        id: { in: input?.selectedRowKeys.map(String) },
        councilId: { not: null },
      },
      include: {
        council: { include: { members: { include: { expert: true } } } },
        supervisor: true,
      },
    },
    { enabled: !!input?.selectedRowKeys.length }
  )

  const membersData =
    selectedThesisProjects
      ?.flatMap((project) => {
        const councilMembers = project.council
          ? project.council.members.map((m) => ({
              ...m,
              thesisProjectId: project.id,
              thesisProjectTitle: project.title,
            }))
          : []

        const supervisorMember = project.supervisor
          ? [
              {
                id: project.supervisor.id,
                thesisProjectId: project.id,
                thesisProjectTitle: project.title,
                role: "SUPERVISOR",
                expert: project.supervisor,
              },
            ]
          : []

        return [...councilMembers, ...supervisorMember]
      })
      .filter(Boolean)
      .sort((a, b) => a.role.localeCompare(b.role)) ?? []

  const { data: defaultCouncilRolePayAmount } = useFindManyDefaultCouncilRolePayAmount()

  const { mutateAsync: createPaymentRecord } = useCreateManyPaymentRecord()
  const { mutateAsync: deletePaymentRecord } = useDeleteManyPaymentRecord()
  const { mutateAsync: createSupervisorPayment } = useCreateManySupervisorPaymentRecord()
  const { mutateAsync: deleteSupervisorPayment } = useDeleteManySupervisorPaymentRecord()

  async function onOk(values: PaymentRecord) {
    try {
      const data =
        selectedThesisProjects?.flatMap(
          (thesisProject) =>
            thesisProject.council?.members.map((member) => {
              let amount = 0
              switch (member.role) {
                case CouncilRole.CHAIRMAN:
                  amount = values.chairman
                  break
                case CouncilRole.SECRETARY:
                  amount = values.secretary
                  break
                case CouncilRole.REVIEWER_1:
                  amount = values.reviewer1
                  break
                case CouncilRole.REVIEWER_2:
                  amount = values.reviewer2
                  break
                case CouncilRole.MEMBER:
                  amount = values.member
                  break
                default:
                  amount = 0
              }

              return {
                councilMemberId: member.id,
                expertId: member.expert?.id,
                amount,
              }
            }) ?? []
        ) ?? []

      const dataSupervisorPayment = selectedThesisProjects
        ?.filter((thesis) => thesis.supervisor)
        .map((thesisProject) => {
          return {
            expertId: thesisProject.supervisor?.id as string,
            amount: values.supervisor,
            thesisProjectId: thesisProject.id,
          }
        })

      showSpinner()
      await deletePaymentRecord({
        where: {
          councilMemberId: { in: data.map((d) => d.councilMemberId) },
          status: PaymentStatus.PENDING,
        },
      })
      if (data.length > 0) {
        await createPaymentRecord({
          data,
          skipDuplicates: true,
        })
      }
      if (dataSupervisorPayment && dataSupervisorPayment.length > 0) {
        const ids = dataSupervisorPayment.map((d) => d.expertId).filter(Boolean) as string[]
        await deleteSupervisorPayment({
          where: {
            status: PaymentStatus.PENDING,
            AND: [
              {
                OR: [
                  {
                    thesisProjects: {
                      some: { supervisorId: { in: ids } },
                    },
                  },
                  {
                    coThesisProjects: {
                      some: { coSupervisorId: { in: ids } },
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    thesisProjects: {
                      some: { supervisorId: { in: ids } },
                    },
                  },
                  {
                    coThesisProjects: {
                      some: { coSupervisorId: { in: ids } },
                    },
                  },
                ],
              },
            ],
          },
        })
        await createSupervisorPayment({
          data: dataSupervisorPayment,
          skipDuplicates: true,
        })
      }
      message.success("Thêm mới thanh toán thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      onClose()
      hideSpinner()
    }
  }

  useEffect(() => {
    if (defaultCouncilRolePayAmount) {
      const values: Record<string, number> = {}

      defaultCouncilRolePayAmount.forEach((item) => {
        const amount: number = item.amount.toNumber()

        switch (item.role) {
          case CouncilRole.CHAIRMAN:
            values.chairman = amount
            break
          case CouncilRole.SECRETARY:
            values.secretary = amount
            break
          case CouncilRole.REVIEWER_1:
            values.reviewer1 = amount
            break
          case CouncilRole.REVIEWER_2:
            values.reviewer2 = amount
            break
          case CouncilRole.MEMBER:
            values.member = amount
            break
          default:
            break
        }
      })

      form.setFieldsValue(values)
    }
  }, [defaultCouncilRolePayAmount, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Thêm thông tin thanh toán"}
      className="w-[80vw]"
    >
      <Table
        rowKey="id"
        id="expert-profile"
        dataSource={membersData}
        className="mb-2"
        scroll={{ y: 300 }}
        columns={[
          {
            title: "STT",
            width: 60,
            align: "center",
            fixed: "left",
            render: (_, __, index) => index + 1,
          },
          {
            title: "Tên chuyên gia",
            width: 150,
            align: "center",
            render: (_, record) => record?.expert.name,
          },
          {
            title: "Học hàm",
            width: 150,
            align: "center",
            render: (_, record) => record?.expert.academicRank,
          },
          {
            title: "Học vị",
            width: 150,
            align: "center",
            render: (_, record) => record?.expert.academicDegree,
          },
          {
            title: "Vai trò",
            width: 150,
            align: "center",
            render: (_, record) =>
              record.role ? getCouncilRoleLabel(record?.role) : "Giảng viên hướng dẫn",
          },
          {
            title: "Đề tài",
            align: "center",
            minWidth: 250,
            render: (_, record) => record?.thesisProjectTitle,
          },
        ]}
        pagination={{
          hideOnSinglePage: true,
        }}
      />
      <Col span={12}>
        <FormItem form={form} name="chairman" label="Chủ tịch" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập giá trị"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="secretary" label="Thư kí" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập giá trị"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="reviewer1" label="Phản biện 1" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập giá trị"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="reviewer2" label="Phản biện 2" required>
          <InputNumber
            className="w-full"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            placeholder="Nhập giá trị"
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="member" label="Ủy viên" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập giá trị"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="supervisor" label="Giảng viên hướng dẫn" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập giá trị"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutPaymentRecord
