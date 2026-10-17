import { CloseOutlined } from "@ant-design/icons"
import type { StudentSubjectScore } from "@workspace/db"
import { Button, Modal, message, Space, Table, Tag } from "antd"
import { useState } from "react"
import * as XLSX from "xlsx"

export type ImportScoreData = {
  id: string
  studentCode: string
  studentName: string
  dobStudent: string
  className: string
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
}

interface ImportScoreModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (data: ImportScoreData[]) => void
  existingStudents: (StudentSubjectScore & {
    student: { userProfile?: { code?: string | null } | null }
  })[]
}

const ImportScoreModal = ({
  visible,
  onCancel,
  onConfirm,
  existingStudents,
}: ImportScoreModalProps) => {
  const [previewData, setPreviewData] = useState<ImportScoreData[]>([])
  const [_file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    setFileName(file.name)
    setSelectedRowKeys([]) // Reset selection khi chọn file mới

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, string>[]

      // Tìm vị trí bắt đầu của bảng dữ liệu (dòng có STT)
      const tableStartIndex = jsonData.findIndex(
        (item: any) => item["IMPORT ĐIỂM"] === "STT" || item.__EMPTY === "Mã sinh viên"
      )

      if (tableStartIndex === -1) {
        message.error("Không tìm thấy bảng dữ liệu trong file")
        return
      }

      // Lấy chỉ các dòng từ vị trí bảng dữ liệu trở đi
      const tableData = jsonData.slice(tableStartIndex + 1)

      // Format dữ liệu theo cấu trúc mong muốn
      const formattedData = tableData
        .map((row) => {
          const attendanceScore = Number.parseFloat(row.__EMPTY_4) // Điểm TX
          const midtermScore = Number.parseFloat(row.__EMPTY_5) // Điểm ĐK
          const examScore = Number.parseFloat(row.__EMPTY_6) // Điểm thi
          const id = existingStudents.find((s) => s.student?.userProfile?.code === row.__EMPTY)?.id

          if (!id) {
            return null
          }

          return {
            id,
            studentCode: row.__EMPTY, // Mã sinh viên
            studentName: row.__EMPTY_1, // Họ và Tên
            dobStudent: row.__EMPTY_2, // Ngày sinh
            className: row.__EMPTY_3, // Tên lớp
            attendanceScore: Number.isNaN(attendanceScore) ? null : attendanceScore,
            midtermScore: Number.isNaN(midtermScore) ? null : midtermScore,
            examScore: Number.isNaN(examScore) ? null : examScore,
          }
        })
        .filter((item) => item?.studentCode) as ImportScoreData[] // Lọc các dòng trống

      setPreviewData(formattedData)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName("")
    setPreviewData([])
    setSelectedRowKeys([])
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleCancel = () => {
    handleRemoveFile()
    onCancel()
  }

  const handleConfirm = () => {
    if (selectedRowKeys.length === 0) {
      message.error("Vui lòng chọn ít nhất một sinh viên để import")
      return
    }

    // Lọc chỉ những sinh viên được chọn
    const selectedData = previewData.filter((item) => selectedRowKeys.includes(item.id))

    // Validate data
    const errors: string[] = []

    selectedData.forEach((item) => {
      // Kiểm tra mã định danh
      const existingStudent = existingStudents.find(
        (s) => s.student?.userProfile?.code === item.studentCode
      )

      if (!existingStudent) {
        errors.push(`Mã sinh viên ${item.studentCode} không tồn tại trong lớp`)
      }

      // Kiểm tra điểm nằm trong khoảng 0-10
      const checkScoreRange = (score: number | null, scoreName: string) => {
        if (score === null) return
        if (score < 0 || score > 10) {
          errors.push(
            `${scoreName} của sinh viên ${item.studentCode} phải từ 0 đến 10 (hiện tại: ${score})`
          )
        }
      }

      checkScoreRange(item.attendanceScore, "Điểm TX")
      checkScoreRange(item.midtermScore, "Điểm ĐK")
      checkScoreRange(item.examScore, "Điểm thi")
    })

    if (errors.length > 0) {
      message.error(`Lỗi: ${errors.join(", ")}`)
    } else {
      onConfirm(selectedData)
      handleCancel()
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys)
    },
  }

  const columns = [
    {
      title: "Mã sinh viên",
      dataIndex: "studentCode",
      key: "studentCode",
    },
    {
      title: "Họ và tên",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Ngày sinh",
      dataIndex: "dobStudent",
      key: "dobStudent",
    },
    {
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
    },
    {
      title: "Điểm TX",
      dataIndex: "attendanceScore",
      key: "attendanceScore",
      render: (score: number) => (
        <span
          style={{
            color: score < 0 || score > 10 ? "red" : "inherit",
          }}
        >
          {score}
        </span>
      ),
    },
    {
      title: "Điểm ĐK",
      dataIndex: "midtermScore",
      key: "midtermScore",
      render: (score: number) => (
        <span
          style={{
            color: score < 0 || score > 10 ? "red" : "inherit",
          }}
        >
          {score}
        </span>
      ),
    },
    {
      title: "Điểm thi",
      dataIndex: "examScore",
      key: "examScore",
      render: (score: number) => (
        <span
          style={{
            color: score < 0 || score > 10 ? "red" : "inherit",
          }}
        >
          {score}
        </span>
      ),
    },
  ]

  return (
    <Modal
      title="Xem trước dữ liệu nhập điểm"
      open={visible}
      width={1200}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={previewData.length === 0}
        >
          Xác nhận ({selectedRowKeys.length} sinh viên được chọn)
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <Button onClick={() => document.getElementById("file-upload")?.click()}>Chọn file</Button>
        {fileName && (
          <Space style={{ marginLeft: 16 }}>
            <Tag
              closable
              onClose={handleRemoveFile}
              closeIcon={<CloseOutlined style={{ color: "red" }} />}
            >
              {fileName}
            </Tag>
          </Space>
        )}
        <p style={{ marginTop: 8 }}>Chọn file Excel mẫu đã xuất từ hệ thống</p>
      </div>

      {previewData.length > 0 ? (
        <Table
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
          }}
          columns={columns}
          dataSource={previewData}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
          bordered
        />
      ) : (
        <p>Vui lòng chọn file Excel để xem trước dữ liệu</p>
      )}
    </Modal>
  )
}

export default ImportScoreModal
