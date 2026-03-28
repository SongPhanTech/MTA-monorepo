import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { Button, Col, Form, message, Upload, type UploadFile } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutUploadDivision = {
  file: UploadFile<any>[]
}
const PutUploadDivisionModal = () => {
  const [form] = Form.useForm<PutUploadDivision>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutUploadDivisionModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(output?: PutUploadDivision) {
    if (!output) return
    if (!output.file || output.file.length === 0) {
      message.error("Vui lòng chọn một file để tải lên.")
      return
    }
    const uploadFile = output.file[0]

    if (!uploadFile.originFileObj) {
      message.error("Tệp tải lên không hợp lệ.")
      return
    }
    try {
      showSpinner()
      const formData = new FormData()
      formData.append("file", uploadFile.originFileObj as File)
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["UserProfile"],
      })
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title="Tải file xếp lớp"
      className="w-[25vw]"
    >
      <Col span={24}>
        <FormItem
          form={form}
          name="file"
          label="Tệp Excel"
          required
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            return Array.isArray(e) ? e : e?.fileList
          }}
        >
          <Upload
            beforeUpload={(file) => {
              const isExcel =
                file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.type === "application/vnd.ms-excel"
              if (!isExcel) {
                message.error("Chỉ được phép tải lên file Excel (.xlsx, .xls)")
                return Upload.LIST_IGNORE
              }
              return false // Không upload tự động
            }}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
          </Upload>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutUploadDivisionModal
