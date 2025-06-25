// components/ImportScoreModal.tsx
import { Button, Modal, Table, message } from 'antd'
import { useState } from 'react'
import * as XLSX from 'xlsx'

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
    const [file, setFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)

        const reader = new FileReader()
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(firstSheet)

            // Tìm vị trí bắt đầu của bảng dữ liệu (dòng có STT)
            const tableStartIndex = jsonData.findIndex(
                (item: any) =>
                    item['IMPORT ĐIỂM'] === 'STT' ||
                    item.__EMPTY === 'Mã Sinh Viên'
            )

            if (tableStartIndex === -1) {
                message.error('Không tìm thấy bảng dữ liệu trong file')
                return
            }

            // Lấy chỉ các dòng từ vị trí bảng dữ liệu trở đi
            const tableData = jsonData.slice(tableStartIndex + 1)

            // Format dữ liệu theo cấu trúc mong muốn
            const formattedData = tableData
                .map((row: any) => ({
                    studentCode: row.__EMPTY, // Mã Sinh Viên
                    studentName: row.__EMPTY_1, // Họ và Tên
                    dobStudent: row.__EMPTY_2, // Ngày Sinh
                    className: row.__EMPTY_3, // Tên lớp
                    attendanceScore: row.__EMPTY_4, // Điểm CC
                    midtermScore: row.__EMPTY_5, // Điểm TX
                    finalScore: row.__EMPTY_6, // Điểm Thi
                }))
                .filter((item: any) => item.studentCode) // Lọc các dòng trống

            setPreviewData(formattedData)
        }
        reader.readAsArrayBuffer(file)
    }

    const handleConfirm = () => {
        // Validate data
        const errors: string[] = []

        previewData.forEach((item) => {
            const existingStudent = existingStudents.find(
                (s) => s.student?.code === item.studentCode
            )

            if (!existingStudent) {
                errors.push(
                    `Mã sinh viên ${item.studentCode} không tồn tại trong lớp`
                )
            }

            if (
                item.attendanceScore === undefined ||
                item.midtermScore === undefined ||
                item.finalScore === undefined
            ) {
                errors.push(`Thiếu điểm cho sinh viên ${item.studentCode}`)
            }
        })

        if (errors.length > 0) {
            message.error(`Lỗi: ${errors.join(', ')}`)
        } else {
            onConfirm(previewData)
            onCancel()
        }
    }

    const columns = [
        {
            title: 'Mã Sinh Viên',
            dataIndex: 'studentCode',
            key: 'studentCode',
        },
        {
            title: 'Họ và tên',
            dataIndex: 'studentName',
            key: 'studentName',
        },
        {
            title: 'Ngày Sinh',
            dataIndex: 'dobStudent',
            key: 'dobStudent',
        },
        {
            title: 'Tên lớp',
            dataIndex: 'className',
            key: 'className',
        },
        {
            title: 'Điểm CC',
            dataIndex: 'attendanceScore',
            key: 'attendanceScore',
        },
        {
            title: 'Điểm TX',
            dataIndex: 'midtermScore',
            key: 'midtermScore',
        },
        {
            title: 'Điểm Thi',
            dataIndex: 'finalScore',
            key: 'finalScore',
        },
    ]

    return (
        <Modal
            title="Xem trước dữ liệu nhập điểm"
            open={visible}
            width={1200}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={handleConfirm}
                    disabled={previewData.length === 0}
                >
                    Xác nhận
                </Button>,
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                />
                <p style={{ marginTop: 8 }}>
                    Chọn file Excel mẫu đã xuất từ hệ thống
                </p>
            </div>

            {previewData.length > 0 ? (
                <Table
                    columns={columns}
                    dataSource={previewData}
                    rowKey="studentCode"
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
