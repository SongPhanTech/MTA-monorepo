import { CloseOutlined } from "@ant-design/icons"
import { Button, Modal, message, Space, Table, Tag } from "antd"
import { useState } from "react"
import * as XLSX from "xlsx"

interface ImportScoreModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (data: any[]) => void
  existingStudents: any[]
}

const ImportScoreModal = ({
  visible,
  onCancel,
  onConfirm,
  existingStudents,
}: ImportScoreModalProps) => {
  const [previewData, setPreviewData] = useState<any[]>([])
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
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)

      // Tìm vị trí bắt đầu của bảng dữ liệu (dòng có STT)
      const tableStartIndex = jsonData.findIndex(
        (item: any) => item["IMPORT ĐIỂM"] === "STT" || item.__EMPTY === "Mã học viên"
      )

      if (tableStartIndex === -1) {
        message.error("Không tìm thấy bảng dữ liệu trong file")
        return
      }

      // Lấy chỉ các dòng từ vị trí bảng dữ liệu trở đi
      const tableData = jsonData.slice(tableStartIndex + 1)

      // Format dữ liệu theo cấu trúc mong muốn
      const formattedData = tableData
        .map((row: any) => ({
          key: row.__EMPTY, // Sử dụng mã học viên làm key
          studentCode: row.__EMPTY, // Mã học viên
          studentName: row.__EMPTY_1, // Họ và Tên
          dobStudent: row.__EMPTY_2, // Ngày sinh
          className: row.__EMPTY_3, // Tên lớp
          attendanceScore: Number.parseFloat(row.__EMPTY_4) || 0, // Điểm TX
          midtermScore: Number.parseFloat(row.__EMPTY_5) || 0, // Điểm ĐK
          examScore: Number.parseFloat(row.__EMPTY_6) || 0, // Điểm thi
        }))
        .filter((item: any) => item.studentCode) // Lọc các dòng trống

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
      message.error("Vui lòng chọn ít nhất một học viên để import")
      return
    }

    // Lọc chỉ những học viên được chọn
    const selectedData = previewData.filter((item) => selectedRowKeys.includes(item.key))

    // Validate data
    const errors: string[] = []

    selectedData.forEach((item) => {
      // Kiểm tra mã học viên
      const existingStudent = existingStudents.find((s) => s.student?.code === item.studentCode)

      if (!existingStudent) {
        errors.push(`Mã học viên ${item.studentCode} không tồn tại trong lớp`)
      }

      // Kiểm tra điểm có đủ 3 loại không
      if (
        item.attendanceScore === undefined ||
        item.midtermScore === undefined ||
        item.examScore === undefined
      ) {
        errors.push(`Thiếu điểm cho học viên ${item.studentCode}`)
      }

      // Kiểm tra điểm nằm trong khoảng 0-10
      const checkScoreRange = (score: number, scoreName: string) => {
        if (score < 0 || score > 10) {
          errors.push(
            `${scoreName} của học viên ${item.studentCode} phải từ 0 đến 10 (hiện tại: ${score})`
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
      title: "Mã học viên",
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
          Xác nhận ({selectedRowKeys.length} học viên được chọn)
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
          rowKey="key"
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
