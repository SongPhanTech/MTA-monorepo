import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { QuaTrinhHocTap } from "@workspace/db"
import {
  useFindManyDM_ChuyenNganhDaoTaoBacDH,
  useFindManyDM_NganhHoc,
  useFindManyDM_TruongDaoTaoBacDH,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutQuaTrinhHocTapModal() {
  const [form] = Form.useForm<QuaTrinhHocTap>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<QuaTrinhHocTap> & { onSave: (val: QuaTrinhHocTap) => void }
  >({
    tag: "PutQuaTrinhHocTapModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data: truongList = [] } = useFindManyDM_TruongDaoTaoBacDH()
  const { data: nganhList = [] } = useFindManyDM_NganhHoc()
  const { data: chuyenNganhList = [] } = useFindManyDM_ChuyenNganhDaoTaoBacDH()

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          tuNgay: formData.tuNgay ? dayjs(formData.tuNgay) : null,
          denNgay: formData.denNgay ? dayjs(formData.denNgay) : null,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: QuaTrinhHocTap) {
    try {
      showSpinner()
      const dataToSave: QuaTrinhHocTap = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật quá trình học tập thành công" : "Thêm mới quá trình học tập thành công"
      )
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
      title={isEdit ? "Cập nhật quá trình học tập" : "Thêm mới quá trình học tập"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={12}>
        <FormItem label="Trường" name="tenTruongId" required form={form}>
          <Select
            placeholder="Chọn trường"
            options={truongList.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Ngành học" name="nganhHocId" required form={form}>
          <Select
            placeholder="Chọn ngành học"
            options={nganhList.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Chuyên ngành" name="chuyenNganhId" form={form}>
          <Select
            placeholder="Chọn chuyên ngành"
            allowClear
            options={chuyenNganhList.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Từ ngày" name="tuNgay" form={form}>
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Chọn từ ngày"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Đến ngày" name="denNgay" form={form}>
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Chọn đến ngày"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Kết quả" name="ketQua" form={form}>
          <Input placeholder="Nhập kết quả" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Loại hình đào tạo" name="loaiHinhDaoTao" form={form}>
          <Input placeholder="Nhập loại hình đào tạo" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
