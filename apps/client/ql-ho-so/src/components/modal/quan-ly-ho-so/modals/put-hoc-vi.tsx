import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { HocVi } from "@workspace/db"
import {
  useFindManyDM_HocVi,
  useFindManyDM_QuocGia,
  useFindManyDM_TruongDaoTaoBacDH,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutHocViModal() {
  const [form] = Form.useForm<HocVi>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<HocVi> & {
      onSave: (val: HocVi) => void
    }
  >({
    tag: "PutHocViModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: hocVi = [] } = useFindManyDM_HocVi({
    where: {
      bActive: true,
    },
  })
  const { data: quocGia = [] } = useFindManyDM_QuocGia()
  const { data: truong = [] } = useFindManyDM_TruongDaoTaoBacDH()

  async function onOk(output: HocVi) {
    if (!output) return
    try {
      showSpinner()
      const dataToSave: HocVi = {
        ...output,
      }

      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(isEdit ? "Cập nhật học vị thành công" : "Thêm mới học vị thành công")
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
        form.setFieldsValue(formData)
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
      title={isEdit ? "Cập nhật học vị" : "Thêm mới học vị"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên học vị" name="academicDegreeTypeId" required form={form}>
          <Select
            placeholder="Chọn học vị"
            options={hocVi.map((i) => ({ label: i.sTen, value: i.Id }))}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Lĩnh vực" name="linhVuc" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Tên luận văn / đề án" name="tenLuanAn" form={form}>
          <Input placeholder="Nhập tên luận văn / đề án" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Trường" name="truongId" required form={form}>
          <Select
            placeholder="Chọn trường"
            options={truong.map((i) => ({ label: i.name, value: i.id }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Quốc gia" name="nationalityId" required form={form}>
          <Select
            placeholder="Chọn quốc gia"
            options={quocGia.map((i) => ({ label: i.sTen, value: i.Id }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Năm nhận" name="year" required form={form}>
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
    </PutFormModal>
  )
}
