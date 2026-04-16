import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import { ThesisType, type PaymentRecord } from "@workspace/db/client"
import {
  useCreatePaymentRecord,
  useFindManyCouncilMember,
  useFindUniquePaymentRecord,
  useUpdatePaymentRecord,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { formatter } from "@/utils/formatterInputNumber"

export type PutPaymentRecord = PaymentRecord
type PutPaymentRecordForm = Partial<PutPaymentRecord>

const PutPaymentRecordDetail = () => {
  const [form] = Form.useForm<PutPaymentRecordForm>()
  const { isOpen, onClose, input } = useDisclosure<{
    paymentRecordId?: string
    thesisSessionId?: string
  }>({
    tag: "PutPaymentRecordDetail",
    onClose: form.resetFields,
  })

  const id = input?.paymentRecordId
  const { showSpinner, hideSpinner } = useSpinner()
  const { paymentStatusOptions } = usePaymentStatusOptions()
  const thesisSessionId = input?.thesisSessionId

  const { mutateAsync: create } = useCreatePaymentRecord()
  const { mutateAsync: update } = useUpdatePaymentRecord()
  async function onOk(value: PutPaymentRecordForm) {
    try {
      showSpinner()

      if (!value.amount && value.amount !== 0) {
        message.error("Vui lòng nhập số tiền thanh toán")
        return
      }

      if (!value.councilMemberId) {
        message.error("Vui lòng chọn chuyên gia")
        return
      }

      const data = {
        active: value.active,
        amount: value.amount,
        councilMemberId: value.councilMemberId,
        paymentDate: value.paymentDate,
        status: value.status,
        transactionCode: value.transactionCode,
      }

      if (id) {
        await update({
          data,
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data,
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

  const { data: paymentRecord } = useFindUniquePaymentRecord(
    {
      where: { id },
      include: {
        councilMember: {
          include: {
            expert: true,
          },
        },
      },
    },
    { enabled: !!id }
  )

  const { data: councilMembers = [] } = useFindManyCouncilMember(
    {
      where: {
        active: true,
        deletedAt: null,
        // payment: {
        //   is: null,
        // },
        council: {
          thesis: {
            some: {
              thesisType: ThesisType.THESIS,
              ...(thesisSessionId ? { thesisSessionId } : {}),
            },
          },
        },
      },
      include: {
        expert: true,
      },
      orderBy: {
        expert: {
          name: "asc",
        },
      },
    },
    {
      enabled: isOpen && !id,
    }
  )

  useEffect(() => {
    if (id && paymentRecord) {
      form.setFieldsValue({
        ...paymentRecord,
        paymentDate: paymentRecord.paymentDate ? dayjs(paymentRecord.paymentDate) : undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        active: true,
      })
    }
  }, [id, paymentRecord, form])

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
        <FormItem form={form} name="councilMemberId" label="Chuyên gia" required>
          <Select
            placeholder="Chọn chuyên gia"
            options={
              id
                ? paymentRecord?.councilMember
                  ? [
                      {
                        label: `${paymentRecord.councilMember.expert?.name ?? ""}`,
                        value: paymentRecord.councilMember.id,
                      },
                    ]
                  : []
                : councilMembers.map((item) => ({
                    label: item.expert?.name ?? "",
                    value: item.id,
                  }))
            }
            disabled={!!id}
            allowClear
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
        <FormItem form={form} name="amount" label="Số tiền thanh toán" required>
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập số tiền thanh toán"
            step={1}
            suffix="VNĐ"
            formatter={formatter}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault()
              }
            }}
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

export default PutPaymentRecordDetail
