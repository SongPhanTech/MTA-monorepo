import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { TinHoc } from "@workspace/db"
import { useFindManyDM_TrinhDoTinHoc } from "@workspace/db/hooks"
import { Col, DatePicker, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutTinHocModal() {
  const [form] = Form.useForm<TinHoc>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<TinHoc> & { onSave: (val: TinHoc) => void }
  >({
    tag: "PutTinHocModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data = [] } = useFindManyDM_TrinhDoTinHoc()

  // Load dữ liệu khi edit
  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          thoiGianBatDau: formData.thoiGianBatDau ? dayjs(formData.thoiGianBatDau) : "",
          thoiGianKetThuc: formData.thoiGianKetThuc ? dayjs(formData.thoiGianKetThuc) : "",
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: TinHoc) {
    try {
      showSpinner()

      const dataToSave: TinHoc = {
        ...values,
      }

      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(isEdit ? "Cập nhật tin học thành công" : "Thêm mới tin học thành công")
      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      hideSpinner()
    }
  }

  const isEdit = input && Object.keys(input).some((key) => key !== "onSave")

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={isEdit ? "Cập nhật trình độ tin học" : "Thêm mới trình độ tin học"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Hình thức đào tạo" name="hinhThucDaoTao" required form={form}>
          <Input placeholder="Nhập hình thức đào tạo" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Trình độ" name="dM_TrinhDoTinHocId" required form={form}>
          <Select
            placeholder="Chọn trình độ"
            options={data.map((i) => ({
              label: i.sTen,
              value: i.Id,
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
