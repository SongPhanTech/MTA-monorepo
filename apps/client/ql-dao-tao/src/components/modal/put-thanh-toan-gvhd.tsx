import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import type { SupervisorPaymentRecord } from "@workspace/db/client"
import {
  useCreateSupervisorPaymentRecord,
  useFindManyExpertProfile,
  useFindManyThesisProject,
  useFindUniqueSupervisorPaymentRecord,
  useUpdateSupervisorPaymentRecord,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { formatter } from "@/utils/formatterInputNumber"

export type PutPaymentRecord = SupervisorPaymentRecord
type PutPaymentRecordForm = Partial<PutPaymentRecord> & {
  expertId?: string
  thesisProjectId?: string
}

const PutSupervisorPaymentRecord = () => {
  const [form] = Form.useForm<PutPaymentRecordForm>()
  const { isOpen, onClose, input } = useDisclosure<{
    paymentRecordId?: string
  }>({
    tag: "PutSupervisorPaymentRecord",
    onClose: form.resetFields,
  })

  const id = input?.paymentRecordId
  const selectedExpertId = Form.useWatch("expertId", form)
  const { showSpinner, hideSpinner } = useSpinner()
  const { paymentStatusOptions } = usePaymentStatusOptions()

  const { mutateAsync: create } = useCreateSupervisorPaymentRecord()
  const { mutateAsync: update } = useUpdateSupervisorPaymentRecord()
  async function onOk(value: PutPaymentRecordForm) {
    try {
      showSpinner()

      const selectedThesisProject = thesisProjects.find((item) => item.id === value.thesisProjectId)

      if (!selectedThesisProject || !value.expertId) {
        message.error("Vui lòng chọn tên chuyên gia và đề tài")
        return
      }

      if (value.amount === undefined || value.amount === null) {
        message.error("Vui lòng nhập số tiền thanh toán")
        return
      }

      const isSupervisor = selectedThesisProject.supervisorId === value.expertId
      const isCoSupervisor = selectedThesisProject.coSupervisorId === value.expertId

      if (!isSupervisor && !isCoSupervisor) {
        message.error("Đề tài không thuộc chuyên gia đã chọn")
        return
      }

      const baseData = {
        active: value.active,
        amount: value.amount,
        paymentDate: value.paymentDate,
        status: value.status,
        transactionCode: value.transactionCode,
      }

      if (id) {
        const existingSupervisorThesisIds =
          paymentRecord?.thesisProjects?.map((item) => item.id) ?? []
        const existingCoSupervisorThesisIds =
          paymentRecord?.coThesisProjects?.map((item) => item.id) ?? []

        await update({
          data: {
            ...baseData,
            thesisProjects: {
              disconnect: existingSupervisorThesisIds.map((thesisId) => ({ id: thesisId })),
              ...(isSupervisor ? { connect: { id: selectedThesisProject.id } } : {}),
            },
            coThesisProjects: {
              disconnect: existingCoSupervisorThesisIds.map((thesisId) => ({ id: thesisId })),
              ...(isCoSupervisor ? { connect: { id: selectedThesisProject.id } } : {}),
            },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            ...baseData,
            ...(isSupervisor
              ? {
                  thesisProjects: {
                    connect: { id: selectedThesisProject.id },
                  },
                }
              : {
                  coThesisProjects: {
                    connect: { id: selectedThesisProject.id },
                  },
                }),
          },
        })
        message.success("Thêm mới thành công")
      }
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

  const { data: paymentRecord } = useFindUniqueSupervisorPaymentRecord(
    {
      where: { id },
      include: {
        thesisProjects: true,
        coThesisProjects: true,
      },
    },
    { enabled: !!id }
  )

  const { data: expert = [] } = useFindManyExpertProfile({
    include: {
      lecturer: {
        include: {
          userProfile: true,
        },
      },
    },
  })

  const { data: thesisProjects = [] } = useFindManyThesisProject(
    {
      where: {
        AND: [
          {
            OR: [{ supervisorId: { not: null } }, { coSupervisorId: { not: null } }],
          },
          ...(selectedExpertId
            ? [
                {
                  OR: [{ supervisorId: selectedExpertId }, { coSupervisorId: selectedExpertId }],
                },
              ]
            : []),
        ],
      },
      include: {
        supervisor: true,
        coSupervisor: true,
      },
      orderBy: {
        title: "asc",
      },
    },
    {
      enabled: isOpen,
    }
  )

  useEffect(() => {
    if (id && paymentRecord) {
      const selectedThesis =
        paymentRecord.thesisProjects?.[0] ?? paymentRecord.coThesisProjects?.[0]

      form.setFieldsValue({
        ...paymentRecord,
        expertId: selectedThesis?.supervisorId ?? selectedThesis?.coSupervisorId ?? undefined,
        paymentDate: paymentRecord.paymentDate ? dayjs(paymentRecord.paymentDate) : undefined,
        thesisProjectId: selectedThesis?.id,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        active: true,
      })
    }
  }, [id, paymentRecord, form])

  useEffect(() => {
    const thesisProjectId = form.getFieldValue("thesisProjectId")

    if (!thesisProjectId) {
      return
    }

    const isValidOption = thesisProjects.some((item) => item.id === thesisProjectId)
    if (!isValidOption) {
      form.setFieldValue("thesisProjectId", undefined)
    }
  }, [form, thesisProjects, selectedExpertId])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa thanh toán" : "Thêm mới thanh toán"}
      className="w-[45vw]"
    >
      <Col span={12}>
        <FormItem form={form} name="expertId" label="Tên chuyên gia" required>
          <Select
            placeholder="Chọn chuyên gia"
            options={expert.map((item) => ({
              label: `${item.code ? `${item.code} - ` : ""}${item.lecturer?.userProfile.fullname || item.name}`,
              value: item.id,
            }))}
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={() => {
              form.setFieldValue("thesisProjectId", undefined)
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="thesisProjectId" label="Đề tài" required>
          <Select
            placeholder="Chọn đề tài"
            options={thesisProjects.map((item) => ({
              label: item.title,
              value: item.id,
            }))}
            disabled={!selectedExpertId}
            allowClear
            optionFilterProp="label"
            showSearch
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="transactionCode" label="Mã giao dịch">
          <Input placeholder="Nhập mã giao dịch" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="amount" label="Số tiền thanh toán">
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập số tiền thanh toán"
            step={1}
            suffix="VNĐ"
            formatter={formatter}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="paymentDate" label="Ngày đề xuất">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={12}>
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

export default PutSupervisorPaymentRecord
