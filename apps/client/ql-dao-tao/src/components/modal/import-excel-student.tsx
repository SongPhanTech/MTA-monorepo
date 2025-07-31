import { CloseOutlined } from '@ant-design/icons'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { importHeQuanSu } from '@workspace/libs/api/training'
import { parseSheetHeQuanSu } from '@workspace/libs/parseExcel'
import { Button, Col, Collapse, Empty, Modal, message, Row, Space, Table, Tag } from 'antd'
import { useState } from 'react'

const { Panel } = Collapse
interface ImportStudentModalProps {
    visible: boolean
    onCancel: () => void
}

const ImportStudentModal = ({ visible, onCancel }: ImportStudentModalProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [errorData, setErrorData] = useState<any[]>([])
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
        setFileName(`Dữ liệu sinh viên.${file.name.split('.')[1]}`)

        const reader = new FileReader()
        reader.onload = (e) => {
            const { trainingObjectType, trainingCourse, students, errors } = parseSheetHeQuanSu(
                e.target?.result as ArrayBuffer
            )
            setPreviewData(students)
            setData({ trainingObjectType, trainingCourse })
            if (errors.length === 0) {
                setDisbaledButton(false)
            }
            setErrorData(errors)
            console.log(errors)
        }
        reader.readAsArrayBuffer(file)
    }

    const handleRemoveFile = () => {
        setFile(null)
        setFileName('')
        setPreviewData([])
        // Reset input file để có thể chọn lại file cùng tên
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
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
                message.success(res?.data?.message || 'Nhâp dữ liệu sinh viên từ file thành công')
            } else {
                message.error(res?.data?.message || 'Nhâp dữ liệu sinh viên từ file thất bại')
            }
        } catch (_error) {
            message.error('Có lỗi xảy ra khi nhập dữ liệu từ file')
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
            <div className="rounded-lg border-[1px] border-solid border-blue-400 bg-blue-50 p-3 mb-4">
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
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
                            closeIcon={<CloseOutlined style={{ color: 'red' }} />}
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

            {errorData?.length > 0 && (
                <Collapse defaultActiveKey={['1']} className="mb-6" bordered={false}>
                    <Panel
                        header={
                            <div className="text-lg font-[500] text-red-500">Danh sách lỗi</div>
                        }
                        key="1"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Table
                                    columns={[
                                        {
                                            title: 'STT',
                                            width: 30,
                                            align: 'center',
                                            fixed: 'left',
                                            render: (_, __, index: number) =>
                                                index + 1 + (currentPage - 1) * 10,
                                        },
                                        {
                                            title: 'Vị trí lỗi',
                                            dataIndex: 'cellRef',
                                            key: 'cellRef',
                                            width: 150,
                                            align: 'center',
                                        },
                                        {
                                            title: 'Thông tin lỗi',
                                            dataIndex: 'message',
                                            key: 'message',
                                            align: 'center',
                                        },
                                    ]}
                                    dataSource={errorData}
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    bordered
                                    locale={{
                                        emptyText: <Empty description="Không có dữ liệu" />,
                                    }}
                                />
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>
            )}

            <Row className="text-xl font-[500] mb-3">
                Danh sách sinh viên{' '}
                {previewData.length > 0 && (
                    <span className="ml-2">({previewData.length} sinh viên)</span>
                )}
            </Row>
            <Row className="mb-3">
                <Col span={12}>
                    <span>
                        Đối tượng đào tạo:{' '}
                        {data?.trainingObjectType ? (
                            data.trainingObjectType
                        ) : previewData.length > 0 ? (
                            <span className="text-[#e10b0b]">Bạn chưa nhập đối tượng đào tạo</span>
                        ) : (
                            ''
                        )}
                    </span>
                </Col>
                <Col span={12}>
                    <span>
                        Khoá học:{' '}
                        {data?.trainingCourse ? (
                            data.trainingCourse
                        ) : previewData.length > 0 ? (
                            <span className="text-[#e10b0b]">Bạn chưa nhập khoá đào tạo</span>
                        ) : (
                            ''
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
                        render: (_, __, index: number) => index + 1 + (currentPage - 1) * 10,
                    },
                    {
                        title: 'Mã sinh viên',
                        dataIndex: 'code',
                        key: 'code',
                        width: 150,
                        align: 'center',
                        fixed: 'left',
                        render: (value: string) => (
                            <div className={!value ? 'td-error' : ''}>{value}</div>
                        ),
                    },
                    {
                        title: 'Họ và tên',
                        dataIndex: 'fullname',
                        key: 'fullname',
                        align: 'center',
                        width: 250,
                        fixed: 'left',
                        render: (value: string) => (
                            <div className={!value ? 'td-error' : ''}>{value}</div>
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
                        width: 150,
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
                        title: 'Ngành',
                        dataIndex: 'trainingField',
                        key: 'trainingField',
                        align: 'center',
                        width: 150,
                    },

                    {
                        title: 'Chuyên ngành',
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
                            <div className={!value ? 'td-error' : ''}>{value}</div>
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
                    defaultPageSize: DEFAULT_PAGINATE_SIZE,
                    showSizeChanger: {
                        labelRender: ({ value }) => `${value} / trang`,
                        optionRender: (oriOption) => `${oriOption.value} / trang`,
                    },
                    showTotal: (total, range) =>
                        `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) {
                            setCurrentPage(page)
                        } else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                        }
                    },
                    // onShowSizeChange(current, size) {
                    //     pagination?.onShowSizeChange?.(size)
                    // },
                }}
                scroll={{ x: 'max-content' }}
                bordered
                locale={{
                    emptyText: <Empty description="Không có dữ liệu" />,
                }}
            />
        </Modal>
    )
}

export default ImportStudentModal
