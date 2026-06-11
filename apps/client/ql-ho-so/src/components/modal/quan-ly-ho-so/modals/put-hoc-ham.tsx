import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { HocHam } from "@workspace/db"
import { useFindManyDM_HocHam } from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutHocHamModal() {
  const [form] = Form.useForm<HocHam>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<HocHam> & { onSave: (val: HocHam) => void }
  >({
    tag: "PutHocHamModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: hocHam = [] } = useFindManyDM_HocHam({
    where: {
      bActive: true,
    },
  })

  async function onOk(output: HocHam) {
    if (!output) return
    try {
      showSpinner()
      const dataToSave: HocHam = {
        ...output,
      }

      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(isEdit ? "Cập nhật học hàm thành công" : "Thêm mới học hàm thành công")
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          from: formData.from ? dayjs(formData.from) : "",
          to: formData.to ? dayjs(formData.to) : "",
        })
      }
    }
  }, [isOpen, input, form])

  const isEdit = input && Object.keys(input).some((key) => key !== "onSave")

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={isEdit ? "Cập nhật học hàm" : "Thêm mới học hàm"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên học hàm" name="academicRankTypeId" required form={form}>
          <Select
            placeholder="Chọn học hàm"
            options={hocHam.map((i) => ({ label: i.sTen, value: i.Id }))}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Nơi Cấp" name="noiCap" required form={form}>
          <Input placeholder="Nhập nơi cấp" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Số quyết định" name="soQuyetDinh" required form={form}>
          <Input placeholder="Nhập số quyết định" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Năm nhận" name="year" form={form}>
          <InputNumber
            type="number"
            precision={0}
            style={{ width: "100%" }}
            max={new Date().getFullYear()}
            min={0}
            placeholder="Nhập năm nhận"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian bắt đầu" name="from" required form={form}>
          <DatePicker
            placeholder="Nhập thời gian bắt đầu"
            style={{ width: "100%" }}
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian kết thúc" name="to" form={form}>
          <DatePicker
            placeholder="Nhập thời gian kết thúc"
            style={{ width: "100%" }}
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            disabledDate={(current) => {
              const startTime = form.getFieldValue("from")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
