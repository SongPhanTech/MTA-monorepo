import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { ThuongTat } from "@workspace/db"
import { useFindManyDM_LoaiThuongTat } from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutThuongTatModal() {
  const [form] = Form.useForm<ThuongTat>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<ThuongTat> & { onSave: (val: ThuongTat) => void }
  >({
    tag: "PutThuongTatModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data = [] } = useFindManyDM_LoaiThuongTat()

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: ThuongTat) {
    try {
      showSpinner()
      const dataToSave: ThuongTat = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(isEdit ? "Cập nhật thương tật thành công" : "Thêm mới thương tật thành công")
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
      title={isEdit ? "Cập nhật thương tật" : "Thêm mới thương tật"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Loại thương tật" name="loaiId" required form={form}>
          <Select
            placeholder="Chọn loại thương tật"
            options={data.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Tỉ lệ (%)" name="tiLe" form={form}>
          <InputNumber
            type="number"
            min={0}
            max={100}
            style={{ width: "100%" }}
            placeholder="Nhập tỉ lệ"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Nguyên nhân" name="nguyenNhan" form={form}>
          <Input placeholder="Nhập nguyên nhân" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian bị thương" name="thoiGian" form={form}>
          <DatePicker
            placeholder="Chọn thời gian bị thương"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Nơi bị thương" name="noiBiThuong" form={form}>
          <Input placeholder="Nhập nơi bị thương" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian giám định" name="thoiGianGiamDinh" form={form}>
          <DatePicker
            placeholder="Chọn thời gian giám định"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
