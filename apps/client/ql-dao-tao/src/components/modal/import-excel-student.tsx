import { CloseOutlined } from '@ant-design/icons'
import { Button, Col, Modal, Row, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'

import useSpinner from '@hooks/spinner'
import { importHeQuanSu } from '@workspace/libs/api/training'
import { parseSheetHeQuanSu } from '@workspace/libs/parseExcel'
import ExportTemplateStudent from './export-template-student'
interface ImportStudentModalProps {
    visible: boolean
    onCancel: () => void
    onConfirm: (data: any[]) => void
    existingStudents: any[]
}

const ImportStudentModal = ({
    visible,
    onCancel,
    onConfirm,
    existingStudents,
}: ImportStudentModalProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [file, setFile] = useState<File | null>(null)
    const [disbaledButton, setDisbaledButton] = useState<boolean>(true)
    const [data, setData] = useState<{
        trainingObjectType: string | undefined
        trainingCourse: string | undefined
    }>({
        trainingObjectType: '',
        trainingCourse: '',
    })
    const [fileName, setFileName] = useState<string>('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        setFileName(file.name)

        const reader = new FileReader()
        reader.onload = (e) => {
            const { trainingObjectType, trainingCourse, students, errors } =
                parseSheetHeQuanSu(e.target?.result as ArrayBuffer)
            setPreviewData(students)
            setData({ trainingObjectType, trainingCourse })
            if (errors.length === 0) {
                setDisbaledButton(false)
            }
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
    const { showSpinner, hideSpinner } = useSpinner()
    const handleConfirm = async () => {
        showSpinner()

        try {
            if (!file) return
            const res = await importHeQuanSu({ file: file, timeout: 30 })
            if (res?.status === 200) {
                message.success(
                    res?.data?.message ||
                        'Nhâp dữ liệu sinh viên từ file thành công'
                )
            } else {
                message.error(
                    res?.data?.message ||
                        'Nhâp dữ liệu sinh viên từ file thất bại'
                )
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi nhập điểm từ file')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Modal
            title="Nhập dữ liệu sinh viên từ Excel"
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
                    disabled={disbaledButton}
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
                <Row>
                    <ExportTemplateStudent />
                </Row>
                <p style={{ marginTop: 8 }}>
                    Chọn file Excel mẫu đã xuất từ hệ thống
                </p>
            </div>

            {previewData.length > 0 ? (
                <>
                    <Row className="text-xl font-[500] mb-3">
                        Danh sách sinh viên
                    </Row>
                    <Row className="mb-3">
                        <Col span={12}>
                            <span>
                                Đối tượng đào tạo:{' '}
                                {data?.trainingObjectType ? (
                                    data.trainingObjectType
                                ) : (
                                    <span className="text-[#e10b0b]">
                                        Bạn chưa nhập đối tượng đào tạo
                                    </span>
                                )}
                            </span>
                        </Col>
                        <Col span={12}>
                            <span>
                                Khoá học:{' '}
                                {data?.trainingCourse ? (
                                    data.trainingCourse
                                ) : (
                                    <span className="text-[#e10b0b]">
                                        Bạn chưa nhập đối tượng đào tạo
                                    </span>
                                )}
                            </span>
                        </Col>
                    </Row>

                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index: number) =>
                                    index + 1 + (currentPage - 1) * 10,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                key: 'code',
                                width: 150,
                                align: 'center',
                                render: (value: string) => (
                                    <div className={!value ? 'td-error' : ''}>
                                        {value}
                                    </div>
                                ),
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'fullname',
                                key: 'fullname',
                                align: 'center',
                                width: 250,
                                render: (value: string) => (
                                    <div className={!value ? 'td-error' : ''}>
                                        {value}
                                    </div>
                                ),
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'dateOfBirth',
                                key: 'dateOfBirth',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Giới tính',
                                dataIndex: 'gender',
                                align: 'center',
                                key: 'gender',
                                width: 100,
                            },
                            {
                                title: 'Dân tộc',
                                dataIndex: 'ethnicity',
                                key: 'ethnicity',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Quốc gia',
                                dataIndex: 'nationality',
                                key: 'nationality',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Nguyên quán huyện',
                                dataIndex: 'districtHometown',
                                key: 'districtHometown',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Nguyên quán tỉnh',
                                dataIndex: 'provinceHometown',
                                key: 'provinceHometown',
                                width: 150,
                            },
                            {
                                title: 'Tổ hợp điểm',
                                dataIndex: 'admissionBlock',
                                key: 'admissionBlock',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Tổng điểm',
                                dataIndex: 'admissionScore',
                                key: 'admissionScore',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Điểm đánh giá NL',
                                dataIndex: 'competencyAssessmentScore',
                                key: 'competencyAssessmentScore',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Lớp quản lý',
                                dataIndex: 'fixedClass',
                                key: 'fixedClass',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Nghành',
                                dataIndex: 'trainingField',
                                key: 'trainingField',
                                align: 'center',
                                width: 150,
                            },

                            {
                                title: 'Chuyên nghành',
                                dataIndex: 'trainingMajor',
                                key: 'trainingMajor',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculum',
                                key: 'curriculum',
                                align: 'center',
                                width: 200,
                                render: (value: string) => (
                                    <div className={!value ? 'td-error' : ''}>
                                        {value}
                                    </div>
                                ),
                            },
                            {
                                title: 'Ghi chú',
                                dataIndex: 'description',
                                key: 'description',
                                align: 'center',
                                width: 150,
                            },
                        ]}
                        dataSource={previewData}
                        rowKey="studentCode"
                        pagination={{
                            position: ['bottomRight'],
                            defaultPageSize: 10,
                            showSizeChanger: {
                                labelRender: ({ value }) => `${value} / trang`,
                                optionRender: (oriOption) =>
                                    `${oriOption.value} / trang`,
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,

                            // onShowSizeChange(current, size) {
                            //     pagination?.onShowSizeChange?.(size)
                            // },
                        }}
                        scroll={{ x: 'max-content' }}
                        bordered
                    />
                </>
            ) : (
                <p>Vui lòng chọn file Excel để xem trước dữ liệu</p>
            )}
        </Modal>
    )
}

export default ImportStudentModal
