import { CloseOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Table, Tag, message } from 'antd'
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
    const [fileName, setFileName] = useState<string>('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        setFileName(file.name)

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
                    attendanceScore: Number.parseFloat(row.__EMPTY_4) || 0, // Điểm CC
                    midtermScore: Number.parseFloat(row.__EMPTY_5) || 0, // Điểm TX
                    finalScore: Number.parseFloat(row.__EMPTY_6) || 0, // Điểm Thi
                }))
                .filter((item: any) => item.studentCode) // Lọc các dòng trống

            setPreviewData(formattedData)
        }
        reader.readAsArrayBuffer(file)
    }

    const handleRemoveFile = () => {
        setFile(null)
        setFileName('')
        setPreviewData([])
        // Reset input file để có thể chọn lại file cùng tên
        const fileInput = document.getElementById(
            'file-upload'
        ) as HTMLInputElement
        if (fileInput) {
            fileInput.value = ''
        }
    }

    const handleCancel = () => {
        handleRemoveFile()
        onCancel()
    }

    const handleConfirm = () => {
        // Validate data
        const errors: string[] = []

        previewData.forEach((item) => {
            // Kiểm tra mã sinh viên
            const existingStudent = existingStudents.find(
                (s) => s.student?.code === item.studentCode
            )

            if (!existingStudent) {
                errors.push(
                    `Mã sinh viên ${item.studentCode} không tồn tại trong lớp`
                )
            }

            // Kiểm tra điểm có đủ 3 loại không
            if (
                item.attendanceScore === undefined ||
                item.midtermScore === undefined ||
                item.finalScore === undefined
            ) {
                errors.push(`Thiếu điểm cho sinh viên ${item.studentCode}`)
            }

            // Kiểm tra điểm nằm trong khoảng 0-10
            const checkScoreRange = (score: number, scoreName: string) => {
                if (score < 0 || score > 10) {
                    errors.push(
                        `${scoreName} của sinh viên ${item.studentCode} phải từ 0 đến 10 (hiện tại: ${score})`
                    )
                }
            }

            checkScoreRange(item.attendanceScore, 'Điểm CC')
            checkScoreRange(item.midtermScore, 'Điểm TX')
            checkScoreRange(item.finalScore, 'Điểm Thi')
        })

        if (errors.length > 0) {
            message.error(`Lỗi: ${errors.join(', ')}`)
        } else {
            onConfirm(previewData)
            handleCancel()
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
            render: (score: number) => (
                <span
                    style={{
                        color: score < 0 || score > 10 ? 'red' : 'inherit',
                    }}
                >
                    {score}
                </span>
            ),
        },
        {
            title: 'Điểm TX',
            dataIndex: 'midtermScore',
            key: 'midtermScore',
            render: (score: number) => (
                <span
                    style={{
                        color: score < 0 || score > 10 ? 'red' : 'inherit',
                    }}
                >
                    {score}
                </span>
            ),
        },
        {
            title: 'Điểm Thi',
            dataIndex: 'finalScore',
            key: 'finalScore',
            render: (score: number) => (
                <span
                    style={{
                        color: score < 0 || score > 10 ? 'red' : 'inherit',
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
                    Xác nhận
                </Button>,
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Button
                    onClick={() =>
                        document.getElementById('file-upload')?.click()
                    }
                >
                    Chọn file
                </Button>

                {fileName && (
                    <Space style={{ marginLeft: 16 }}>
                        <Tag
                            closable
                            onClose={handleRemoveFile}
                            closeIcon={
                                <CloseOutlined style={{ color: 'red' }} />
                            }
                        >
                            {fileName}
                        </Tag>
                    </Space>
                )}

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
