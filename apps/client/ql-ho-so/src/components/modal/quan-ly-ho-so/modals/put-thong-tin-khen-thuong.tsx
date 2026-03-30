import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { KhenThuong } from "@workspace/db"
import { useFindManyDM_HinhThucKhenThuongChinhQuyen } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { TextArea } = Input

export default function PutKhenThuongModal() {
  const [form] = Form.useForm<KhenThuong>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<KhenThuong> & { onSave: (val: KhenThuong) => void }
  >({
    tag: "PutKhenThuongModal",
    onClose: form.resetFields,
  })

  const { data: hinhThucKhenThuongChinhQuyenData = [] } =
    useFindManyDM_HinhThucKhenThuongChinhQuyen()

  async function onOk(output: KhenThuong) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(
        isEdit ? "Cập nhật  khen thưởng thành công" : "Thêm mới khen thưởng thành công"
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
          ngayNhanQuyetDinh: formData.ngayNhanQuyetDinh ? dayjs(formData.ngayNhanQuyetDinh) : "",
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
      title={isEdit ? "Cập nhật thông tin khen thưởng" : "Thêm mới thông tin khen thưởng"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem
          label="Hình thức khen thưởng chính quyền"
          name="hinhThucKhenThuongId"
          required
          form={form}
        >
          <Select
            allowClear
            placeholder="Chọn hình thức khen thưởng chính quyền"
            className="h-9"
            options={hinhThucKhenThuongChinhQuyenData.map((i) => {
              return {
                value: i.id,
                label: i.name,
              }
            })}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Cấp khen thưởng" name="capKhenThuong" required form={form}>
          <Input placeholder="Nhập cấp khen thưởng" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Số quyết định" name="soQuyetDinh" required form={form}>
          <Input placeholder="Nhập số quyết định" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Người ký" name="nguoiKy" required form={form}>
          <Input placeholder="Nhập người ký" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ngày nhận quyết định" name="ngayNhanQuyetDinh" required form={form}>
          <DatePicker
            placeholder="Chọn ngày nhận quyết định"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Lý do" name="lyDo" form={form}>
          <TextArea placeholder="Nhập lý do" rows={3} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
