import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { useFindManyTrainingCourse } from "@workspace/db/hooks"
import { downloadStudentImportTemplate } from "@workspace/libs/api/training"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Form, Modal, message, Space } from "antd"
import { saveAs } from "file-saver"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ExportStudentImportTemplateModal = () => {
  const { isOpen, onClose } = useDisclosure({
    tag: "ExportStudentImportTemplateModal",
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { showSpinner, hideSpinner } = useSpinner()
  const [allCourses, setAllCourses] = useState(false)
  const [trainingCourseId, setTrainingCourseId] = useState<string>()

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      where: {
        trainingObjectTypeId: trainingObjectTypeId || undefined,
        deletedAt: null,
        active: true,
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId && isOpen }
  )

  useEffect(() => {
    if (!isOpen) {
      setAllCourses(false)
      setTrainingCourseId(undefined)
    }
  }, [isOpen])

  const handleOk = async () => {
    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn đối tượng đào tạo")
      return
    }
    if (!allCourses && !trainingCourseId) {
      message.error("Vui lòng chọn khoá học")
      return
    }

    try {
      showSpinner()
      const res = await downloadStudentImportTemplate({
        trainingObjectTypeId,
        allCourses,
        ...(allCourses ? {} : { trainingCourseId }),
      })

      if (res.status === 200) {
        saveAs(res.data, "MauImportDSHV_v5.xlsx")
        onClose()
      } else {
        message.error(res.data.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      open={isOpen}
      title="Xuất file mẫu import học viên"
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={handleOk}>
            Xuất file
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item>
          <Checkbox
            checked={allCourses}
            onChange={(e) => {
              const checked = e.target.checked
              setAllCourses(checked)
              if (checked) setTrainingCourseId(undefined)
            }}
          >
            Dữ liệu các khoá
          </Checkbox>
        </Form.Item>
        <Form.Item label="Khoá học" required={!allCourses}>
          <Select
            className="w-full"
            placeholder="Chọn khoá học"
            disabled={allCourses}
            value={trainingCourseId}
            options={trainingCourseData.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(value) => setTrainingCourseId(value)}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ExportStudentImportTemplateModal
