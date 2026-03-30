import { CloseOutlined } from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import { importPhienBanCTDTSubject } from "@workspace/libs/api/training"
import { parseSheetSubject } from "@workspace/libs/parseExcel"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Collapse, Modal, message, Space, Tag } from "antd"
import { useRouter } from "next/router"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import type { ModalPreviewUploadInput } from "./put-phien-ban-danh-muc-ctdt"

const { Panel } = Collapse
interface ImportCurriculumVersionModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

const ImportCurriculumVersionModal = ({
  visible,
  onCancel,
  onSuccess,
}: ImportCurriculumVersionModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [disabledButton, setDisabledButton] = useState<boolean>(true)
  const router = useRouter()
  const id = router.query.id as string
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [fileName, setFileName] = useState<string>("")

  const { onOpen: openPreviewModal } = useDisclosure<ModalPreviewUploadInput>({
    tag: "ModalPreviewUpload",
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    setFileName(`Dữ liệu phiên bản chương trình đào tạo.${file.name.split(".")[1]}`)
    setDisabledButton(false)

    const { subjects, errors } = parseSheetSubject(await file.arrayBuffer())
    openPreviewModal({
      previewData: subjects,
      errorData: errors,
    })
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName("")
    // Reset input file để có thể chọn lại file cùng tên
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleCancel = () => {
    handleRemoveFile()
    onCancel()
  }
  const { showSpinner, hideSpinner } = useSpinner()

  const handleConfirm = async () => {
    showSpinner()

    try {
      if (!file || !trainingObjectTypeId) return

      // const res = await importPhienBanCTDT(id, { file: file, timeout: 30 })
      const res = await importPhienBanCTDTSubject({
        curriculumVersionId: id,
        trainingObjectTypeId,
        file: file,
        createNewSubjects: true,
      })
      if (res?.status === 200) {
        message.success("Nhập dữ liệu phiên bản chương trình đào tạo từ file thành công")
      } else {
        message.error(
          res?.data?.message || "Nhập dữ liệu phiên bản chương trình đào tạo từ file thất bại"
        )
      }
      onSuccess()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra khi nhập dữ liệu từ file")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      title="Nhập dữ liệu phiên bản chương trình đào tạo từ Excel"
      open={visible}
      width={900}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} disabled={disabledButton}>
          Xác nhận
        </Button>,
      ]}
    >
      <div className="rounded-lg border-[1px] border-solid border-blue-400 bg-blue-50 p-3 mb-4">
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <Button
          onClick={() => document.getElementById("file-upload")?.click()}
          type="primary"
          className="bg-[#1677ff] mb-4"
        >
          Chọn file
        </Button>

        {fileName ? (
          <Space style={{ marginLeft: 16 }}>
            <Tag
              closable
              onClose={handleRemoveFile}
              closeIcon={<CloseOutlined style={{ color: "red" }} />}
            >
              {fileName}
            </Tag>
          </Space>
        ) : (
          <span className="ml-3">Chưa có tệp nào được chọn</span>
        )}
        {/* <Row className="mb-2">
                    <ExportTemplateStudent />
                </Row> */}
        <p className="">Chọn file Excel mẫu đã xuất từ hệ thống</p>
      </div>
    </Modal>
  )
}

export default ImportCurriculumVersionModal
