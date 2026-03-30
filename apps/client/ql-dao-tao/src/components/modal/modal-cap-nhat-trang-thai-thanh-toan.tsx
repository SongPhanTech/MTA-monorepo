import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { useCouncilRoleOptions } from "@hooks/councilRole"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import type { PaymentRecord } from "@workspace/db/client"
import {
  useFindManyPaymentRecord,
  useFindManySupervisorPaymentRecord,
  useUpdateManyPaymentRecord,
  useUpdateManySupervisorPaymentRecord,
} from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutUpdatePaymentStatus = PaymentRecord

const PutUpdatePaymentStatus = () => {
  const [form] = Form.useForm<PutUpdatePaymentStatus>()
  const [totalAmount, setTotalAmount] = useState(0)
  const { isOpen, onClose, input } = useDisclosure<{
    paymentRecordIds: string[]
    isSupervisor: boolean
  }>({
    tag: "PutUpdatePaymentStatus",
    onClose: form.resetFields,
  })

  const { paymentStatusOptions } = usePaymentStatusOptions()
  const { getCouncilRoleLabel } = useCouncilRoleOptions()
  const paymentRecordIds = input?.paymentRecordIds

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: paymentRecord } = useFindManyPaymentRecord(
    {
      where: {
        id: { in: paymentRecordIds },
      },
      include: {
        councilMember: { include: { expert: true } },
      },
    },
    {
      enabled: !!paymentRecordIds?.length && !input?.isSupervisor,
    }
  )

  const { data: supervisorPaymentData } = useFindManySupervisorPaymentRecord(
    {
      where: {
        id: { in: paymentRecordIds },
      },
      include: {
        thesisProjects: {
          include: {
            supervisor: true,
          },
        },
        coThesisProjects: {
          include: {
            coSupervisor: true,
          },
        },
      },
    },
    {
      enabled: !!paymentRecordIds?.length && input?.isSupervisor,
    }
  )

  useEffect(() => {
    let total = 0

    if (paymentRecord?.length) {
      total = paymentRecord.reduce((acc, record) => acc + Number(record.amount ?? 0), 0)
    }

    if (supervisorPaymentData?.length) {
      total = supervisorPaymentData.reduce((acc, record) => acc + Number(record.amount ?? 0), 0)
    }

    setTotalAmount(total)
  }, [paymentRecord, supervisorPaymentData])

  const { mutateAsync: update } = useUpdateManyPaymentRecord()
  const { mutateAsync: updateSupervisorPayment } = useUpdateManySupervisorPaymentRecord()

  async function onOk(value: PutUpdatePaymentStatus) {
    try {
      showSpinner()
      if (input?.isSupervisor) {
        await updateSupervisorPayment({
          data: {
            status: value.status,
          },
          where: {
            id: {
              in: paymentRecordIds,
            },
          },
        })
      } else {
        await update({
          data: {
            status: value.status,
          },
          where: {
            id: {
              in: paymentRecordIds,
            },
          },
        })
      }

      message.success("Cập nhật thành công")
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
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
      title={"Cập nhật trạng thái thanh toán"}
      className="w-[45vw]"
    >
      {input?.isSupervisor ? (
        <Table
          rowKey="id"
          id="expert-profile"
          dataSource={supervisorPaymentData}
          className="mb-8"
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
              render: (_, record) =>
                record.thesisProjects?.supervisor.name ||
                record.coThesisProjects?.coSupervisor.name,
            },
            {
              title: "Số tiền thanh toán",
              width: 250,
              align: "center",
              render: (_, record) =>
                record?.amount ? `${Number(record?.amount).formatVND()}` : "-",
            },
          ]}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      ) : (
        <Table
          rowKey="id"
          id="expert-profile"
          dataSource={paymentRecord}
          className="mb-8"
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
              render: (_, record) => record?.councilMember.expert.name,
            },
            {
              title: "Vai trò",
              width: 150,
              align: "center",
              render: (_, record) => getCouncilRoleLabel(record?.councilMember.role),
            },
            {
              title: "Số tiền thanh toán",
              width: 250,
              align: "center",
              render: (_, record) =>
                record?.amount ? `${Number(record?.amount).formatVND()}` : "-",
            },
          ]}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      )}
      <Col span={24}>Tông tiền thanh toán: {totalAmount}</Col>
      <Col span={12} className="mt-4">
        <FormItem form={form} name="status" label="Trạng thái">
          <Select
            placeholder="Chọn trạng thái"
            options={paymentStatusOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutUpdatePaymentStatus
