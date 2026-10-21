import useSpinner from "@hooks/spinner"
import { exportPhoiBangNganHan } from "@workspace/libs/api/training"
import { Button, Form, Input, InputNumber, Modal, Radio, Select, message } from "antd"
import { saveAs } from "file-saver"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type ModalPrintPhoiBangInput = {
  trainingObjectTypeId: string
  trainingCourseIds?: string[]
  thesisSessionIds?: string[]
  printDate?: string
  signerName?: string
  /** Prefill cụm trái dòng 1 */
  courseTextEn1?: string
  /** Prefill cụm trái dòng 2 — tên ngành EN */
  courseTextEn2?: string
  /** Prefill cụm phải dòng 1 */
  courseTextVi1?: string
  /** Prefill cụm phải dòng 2 — tên ĐTĐT */
  courseTextVi2?: string
  /** Dân sự = Ông/Bà; Quân sự = không tiền tố */
  includeNamePrefix?: boolean
}

type FormValues = {
  courseTextEn1: string
  courseTextEn2: string
  courseTextVi1: string
  courseTextVi2: string
  fontFamily: string
  fontSize: number
  rowHeight: number
  printVariant: "civilian" | "military"
}

const DEFAULT_EN_1 = "FOR COMPLETING THE COURSE FOR TECHNICAL AND LOGISTICS"
const DEFAULT_VI_1 = "ĐÀO TẠO"
const FONT_OPTIONS = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Calibri", value: "Calibri" },
  { label: ".VnTime", value: ".VnTime" },
]

const ModalPrintPhoiBang = () => {
  const [form] = Form.useForm<FormValues>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { isOpen, onClose, input } = useDisclosure<ModalPrintPhoiBangInput>({
    tag: "ModalPrintPhoiBang",
  })

  useEffect(() => {
    if (!isOpen || !input) return
    form.setFieldsValue({
      courseTextEn1: input.courseTextEn1 || DEFAULT_EN_1,
      courseTextEn2: input.courseTextEn2 || "",
      courseTextVi1: input.courseTextVi1 || DEFAULT_VI_1,
      courseTextVi2: input.courseTextVi2 || "",
      fontFamily: "Times New Roman",
      fontSize: 12,
      rowHeight: 18,
      printVariant: input.includeNamePrefix ? "civilian" : "military",
    })
  }, [form, input, isOpen])

  const handleExport = async () => {
    if (!input?.trainingObjectTypeId) {
      message.warning("Vui lòng chọn loại đối tượng đào tạo")
      return
    }

    try {
      const values = await form.validateFields()
      showSpinner()
      const res = await exportPhoiBangNganHan({
        trainingObjectTypeId: input.trainingObjectTypeId,
        trainingCourseIds: input.trainingCourseIds,
        thesisSessionIds: input.thesisSessionIds,
        printDate: input.printDate,
        signerName: input.signerName,
        includeNamePrefix: values.printVariant === "civilian",
        courseTextEn1: values.courseTextEn1,
        courseTextEn2: values.courseTextEn2,
        courseTextVi1: values.courseTextVi1,
        courseTextVi2: values.courseTextVi2,
        fontFamily: values.fontFamily,
        fontSize: values.fontSize,
        rowHeight: values.rowHeight,
      })

      if (res.status === 200) {
        saveAs(res.data as Blob, "PhoiBangNganHan.xlsx")
        onClose()
      } else {
        const errorMsg =
          (res.data as { message?: string })?.message || "Đã xảy ra lỗi khi xuất file"
        message.error(errorMsg)
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errorFields" in error) return
      const err = error as { message?: string }
      message.error(err.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="In phôi bằng sau đại học"
      width={720}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="export" type="primary" onClick={handleExport}>
          Xuất Excel
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" className="mt-2">
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Cụm trái (English) = tên ngành tiếng Anh · Cụm phải (dưới ĐÀO TẠO) = tên đối tượng đào
          tạo. Có thể sửa nội dung, font, cỡ chữ và chiều cao dòng trước khi xuất.
        </div>

        <Form.Item
          name="printVariant"
          label="Hệ đào tạo"
          rules={[{ required: true, message: "Chọn hệ đào tạo" }]}
        >
          <Radio.Group>
            <Radio value="civilian">Dân sự (Ông/Bà)</Radio>
            <Radio value="military">Quân sự</Radio>
          </Radio.Group>
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-200 p-3">
            <div className="mb-2 text-sm font-semibold text-primary">Cụm trái — English</div>
            <Form.Item
              name="courseTextEn1"
              label="Dòng 1"
              rules={[{ required: true, message: "Nhập dòng 1 tiếng Anh" }]}
            >
              <Input.TextArea rows={3} autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item
              name="courseTextEn2"
              label="Dòng 2 (tên ngành EN)"
              rules={[{ required: true, message: "Nhập tên ngành tiếng Anh" }]}
            >
              <Input.TextArea rows={3} autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <div className="mb-2 text-sm font-semibold text-primary">Cụm phải — Tiếng Việt</div>
            <Form.Item
              name="courseTextVi1"
              label="Dòng 1"
              rules={[{ required: true, message: "Nhập dòng 1 tiếng Việt" }]}
            >
              <Input.TextArea rows={3} autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item
              name="courseTextVi2"
              label="Dòng 2 (đối tượng đào tạo)"
              rules={[{ required: true, message: "Nhập tên đối tượng đào tạo" }]}
            >
              <Input.TextArea rows={3} autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Form.Item name="fontFamily" label="Font chữ" rules={[{ required: true }]}>
            <Select options={FONT_OPTIONS} />
          </Form.Item>
          <Form.Item name="fontSize" label="Cỡ chữ (pt)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={8} max={36} step={0.5} />
          </Form.Item>
          <Form.Item name="rowHeight" label="Chiều cao (pt)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={10} max={60} step={0.5} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default ModalPrintPhoiBang
