import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { exportStatsArchivedAward } from "@workspace/libs/api/training"
import { SelectSemester, SelectTrainingCourse } from "@workspace/ui"
import { Col, Form, message } from "antd"
import { saveAs } from "file-saver"
import { useDisclosure } from "react-hook-disclosure-modal"

const ExportStatsArchivedAwardModal = () => {
  const [form] = Form.useForm()
  const { isOpen, onClose } = useDisclosure<string>({
    tag: "ExportStatsArchivedAwardModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const onOk = async (values: {
    fromSemesterId: string
    toSemesterId: string
    trainingCourseId: string
  }) => {
    try {
      showSpinner()
      const result = await exportStatsArchivedAward(values)
      if (result.status === 200) {
        saveAs(result.data, "THONG_KE_DIEM_THUONG.xlsx")
        message.success("Xuất file thành công")
        onClose()
      } else {
        message.error("Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      width={600}
      onFinish={onOk}
      onCancel={onClose}
      title="Xuất thống kê điểm thưởng"
      okText="Xuất file"
    >
      <Col span={24} className="mb-4">
        <FormItem form={form} className="w-full" name="fromSemesterId" label="Từ học kỳ" required>
          <SelectSemester />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} className="w-full" name="toSemesterId" label="Đến học kỳ" required>
          <SelectSemester />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} className="w-full" name="trainingCourseId" label="Khoá học" required>
          <SelectTrainingCourse className="w-full" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default ExportStatsArchivedAwardModal
