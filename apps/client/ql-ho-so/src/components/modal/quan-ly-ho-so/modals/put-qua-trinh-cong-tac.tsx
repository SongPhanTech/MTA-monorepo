import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { QuaTrinhCongTac } from "@workspace/db"
import { useFindManyDM_ChucVu, useFindManyDM_LoaiHinhCongTac } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutQuaTrinhCongTacModal() {
  const [form] = Form.useForm<QuaTrinhCongTac>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<QuaTrinhCongTac> & { onSave: (val: QuaTrinhCongTac) => void }
  >({
    tag: "PutQuaTrinhCongTacModal",
    onClose: form.resetFields,
  })

  const { data: loaiHinhCongTacList = [] } = useFindManyDM_LoaiHinhCongTac()

  const { data: chucVuOptions } = useFindManyDM_ChucVu()

  async function onOk(output: QuaTrinhCongTac) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(
        isEdit ? "Cập nhật quá trình công tác thành công" : "Thêm mới quá trình công tác thành công"
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
          tuThangNam: formData.tuThangNam ? dayjs(formData.tuThangNam) : "",
          denThangNam: formData.denThangNam ? dayjs(formData.denThangNam) : "",
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
      title={isEdit ? "Cập nhật quá trình công tác" : "Thêm mới quá trình công tác"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={12}>
        <FormItem label="Từ tháng năm" name="tuThangNam" required form={form}>
          <DatePicker
            placeholder="Chọn từ tháng năm"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem label="Đến tháng năm" name="denThangNam" required form={form}>
          <DatePicker
            placeholder="Chọn đến tháng năm"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Loại hình công tác" name="loaiHinhCongTacId" required form={form}>
          <Select
            placeholder="Chọn loại hình công tác"
            options={loaiHinhCongTacList?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Đơn vị" name="donVi" required form={form}>
          <Input placeholder="Nhập tên đơn vị" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Chức vụ" name="chucVuId" required form={form}>
          <Select
            placeholder="Chọn chức vụ"
            options={chucVuOptions?.map((item) => ({
              label: item.sTen,
              value: item.Id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Chức danh" name="chucDanh" form={form}>
          <Input placeholder="Nhập tên chức danh" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Chức vụ đảng đoàn" name="chucVuDangDoan" form={form}>
          <Input placeholder="Nhập tên chức vụ đảng đoàn" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Số quyết định" name="soQuyetDinh" form={form}>
          <Input placeholder="Nhập số quyết định" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
