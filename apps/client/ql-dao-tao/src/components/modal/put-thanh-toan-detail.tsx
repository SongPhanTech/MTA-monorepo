import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import type { PaymentRecord } from "@workspace/db/client"
import {
  useCreatePaymentRecord,
  useFindManyExpertProfile,
  useFindUniquePaymentRecord,
  useUpdatePaymentRecord,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { formatter } from "@/utils/formatterInputNumber"

export type PutPaymentRecord = PaymentRecord

const PutPaymentRecordDetail = () => {
  const [form] = Form.useForm<PutPaymentRecord>()
  const { isOpen, onClose, input } = useDisclosure<{
    paymentRecordId: string
  }>({
    tag: "PutPaymentRecordDetail",
    onClose: form.resetFields,
  })

  const id = input?.paymentRecordId
  const { showSpinner, hideSpinner } = useSpinner()
  const { paymentStatusOptions } = usePaymentStatusOptions()

  const { mutateAsync: create } = useCreatePaymentRecord()
  const { mutateAsync: update } = useUpdatePaymentRecord()
  async function onOk(value: PutPaymentRecord) {
    try {
      showSpinner()
      if (id) {
        await update({
          data: {
            ...value,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            ...value,
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

  const { data: paymentRecord } = useFindUniquePaymentRecord(
    {
      where: { id },
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

  useEffect(() => {
    if (paymentRecord) {
      form.setFieldsValue({
        ...paymentRecord,
        paymentDate: paymentRecord.paymentDate ? dayjs(paymentRecord.paymentDate) : undefined,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [paymentRecord, form])

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
        {/* TODO: Fix */}
        <FormItem form={form} name="councilMemberId" label="Chuyên gia">
          <Select
            placeholder="Chọn chuyên gia"
            options={expert.map((item) => ({
              label: `${item.code ? `${item.code} -` : ""} ${item.lecturer?.userProfile.fullname || item.name}`,
              value: item.id,
            }))}
            disabled={true}
            allowClear
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
