import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { TrinhDoQuanLyNhaNuoc } from "@workspace/db"
import { useFindManyDM_TrinhDoQuanLyNhaNuoc } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutTrinhDoQuanLyNhaNuocModal() {
  const [form] = Form.useForm<TrinhDoQuanLyNhaNuoc>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<TrinhDoQuanLyNhaNuoc> & { onSave: (val: TrinhDoQuanLyNhaNuoc) => void }
  >({
    tag: "PutTrinhDoQuanLyNhaNuocModal",
    onClose: form.resetFields,
  })

  const { data } = useFindManyDM_TrinhDoQuanLyNhaNuoc()

  async function onOk(output: TrinhDoQuanLyNhaNuoc) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(
        isEdit
          ? "Cập nhật trình độ quản lý nhà nước thành công"
          : "Thêm mới trình độ quản lý nhà nước thành công"
      )
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
          thoiGianBatDau: formData.thoiGianBatDau ? dayjs(formData.thoiGianBatDau) : null,
          thoiGianKetThuc: formData.thoiGianKetThuc ? dayjs(formData.thoiGianKetThuc) : null,
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
      title={isEdit ? "Cập nhật trình độ quản lý nhà nước" : "Thêm mới trình độ quản lý nhà nước"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Hình thức đào tạo" name="hinhThucDaoTao" required form={form}>
          <Input placeholder="Nhập hình thức đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Trình độ" name="trinhDoId" required form={form}>
          <Select
            placeholder="Chọn trình độ"
            options={data?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Cơ sở đào tạo" name="noiDaoTao" required form={form}>
          <Input placeholder="Nhập cơ sở đào tạo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian bắt đầu" name="thoiGianBatDau" required form={form}>
          <DatePicker
            placeholder="Chọn thời gian bắt đầu"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian kết thúc" name="thoiGianKetThuc" required form={form}>
          <DatePicker
            placeholder="Chọn thời gian kết thúc"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            disabledDate={(current) => {
              const startTime = form.getFieldValue("thoiGianBatDau")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
