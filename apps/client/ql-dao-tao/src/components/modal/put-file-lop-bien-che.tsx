import { UploadOutlined } from "@ant-design/icons"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { TrainingCourse } from "@workspace/db/client"
import { useFindManyTrainingCourse } from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, message, Upload } from "antd"
import type { UploadFile } from "antd/es/upload/interface"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutUploadFixedClass = {
  trainingCourseId: string
  file: UploadFile<any>[]
}

const PutUploadFixedClassModal = () => {
  const [form] = Form.useForm<PutUploadFixedClass>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutUploadFixedClassModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    where: {
      active: true,
      trainingObjectTypeId,
    },
  })

  async function onOk(output?: PutUploadFixedClass) {
    if (!output) return
    if (!output.file || output.file.length === 0) {
      message.error("Vui lòng chọn một file để tải lên.")
      return
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title="Tải file nhập danh sách lớp quản lý"
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="trainingCourseId" label="Khoá" required>
          <Select
            placeholder="Chọn khoá"
            options={trainingCourseData.map((i: TrainingCourse) => ({
              value: i.id,
              label: i.name,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem
          form={form}
          name="file"
          label="Tệp Excel"
          required
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
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

export default PutUploadFixedClassModal
