import { CloseOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { importInternship } from "@workspace/libs/api/training"
import { parseSheetInternship } from "@workspace/libs/parseExcel"
import { Button, Col, Collapse, Empty, Modal, message, Row, Space, Table, Tag } from "antd"
import dayjs from "dayjs"
import { useState } from "react"

const { Panel } = Collapse
interface ImportInternshipModalProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
}

const ImportInternshipModal = ({ visible, onSuccess, onCancel }: ImportInternshipModalProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [errorData, setErrorData] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [disabledButton, setDisabledButton] = useState<boolean>(true)

  const [fileName, setFileName] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setErrorData([])
    if (!file) return

    setFile(file)
    setFileName(`Dữ liệu thực tập sinh.${file.name.split(".")[1]}`)

    const reader = new FileReader()
    reader.onload = (e) => {
      const { internships, errors } = parseSheetInternship(e.target?.result as ArrayBuffer)
      setPreviewData(internships)
      if (errors.length === 0) {
        setDisabledButton(false)
      }
      setErrorData(errors)
      console.log(errors)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName("")
    setPreviewData([])
    setErrorData([])
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
      if (!file) return
      const res = await importInternship({ file: file, timeout: 30 })
      if (res?.status === 200) {
        message.success(res?.data?.message || "Nhập dữ liệu thực tập sinh từ file thành công")
        onSuccess()
      } else {
        message.error(res?.data?.message || "Nhập dữ liệu thực tập sinh từ file thất bại")
      }
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
      title="Nhập dữ liệu thực tập sinh từ Excel"
      open={visible}
      width={1200}
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

      {errorData?.length > 0 && (
        <Collapse defaultActiveKey={["1"]} className="mb-6" bordered={false}>
          <Panel
            header={<div className="text-lg font-[500] text-red-500">Danh sách lỗi</div>}
            key="1"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Table
                  columns={[
                    {
                      title: "STT",
                      width: 30,
                      align: "center",
                      fixed: "left",
                      render: (_, __, index: number) => index + 1 + (currentPage - 1) * 10,
                    },
                    {
                      title: "Vị trí lỗi",
                      dataIndex: "cellRef",
                      key: "cellRef",
                      width: 150,
                      align: "center",
                    },
                    {
                      title: "Thông tin lỗi",
                      dataIndex: "message",
                      key: "message",
                      align: "center",
                    },
                  ]}
                  dataSource={errorData}
                  pagination={false}
                  scroll={{ x: "max-content" }}
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
        Danh sách thực tập sinh{" "}
        {previewData.length > 0 && (
          <span className="ml-2">({previewData.length} thực tập sinh)</span>
        )}
      </Row>

      <Table
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            fixed: "left",
            render: (_, __, index: number) => index + 1 + (currentPage - 1) * 10,
          },
          {
            title: "Mã SV",
            dataIndex: "code",
            key: "code",
            width: 120,
            align: "center",
            fixed: "left",
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Tên sinh viên",
            dataIndex: "fullname",
            key: "fullname",
            align: "center",
            width: 200,
            fixed: "left",
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Ngày sinh",
            dataIndex: "dateOfBirth",
            key: "dateOfBirth",
            align: "center",
            width: 120,
            render: (value?: string) => value || "",
          },
          {
            title: "Mã lớp HP",
            dataIndex: "subjectClassCode",
            key: "subjectClassCode",
            align: "center",
            width: 150,
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Tên lớp HP",
            dataIndex: "subjectClassName",
            key: "subjectClassName",
            align: "center",
            width: 200,
          },
          {
            title: "Giới tính",
            dataIndex: "gender",
            align: "center",
            key: "gender",
            width: 100,
          },
          {
            title: "Đơn vị thực tập",
            key: "unit",
            align: "center",
            width: 200,
            render: (_: any, record: any) => {
              // Hiển thị như Excel: "institution / unit" hoặc chỉ unit
              if (record.institution && record.unit) {
                return `${record.institution} / ${record.unit}`
              }
              return record.unit || record.institution || ""
            },
          },
          {
            title: "Địa chỉ",
            dataIndex: "address",
            align: "center",
            width: 200,
          },
          {
            title: "Nội dung thực tập",
            dataIndex: "internshipContent",
            key: "internshipContent",
            align: "center",
            width: 200,
          },
          {
            title: "GV hướng dẫn 1",
            dataIndex: "supervisor",
            key: "supervisor",
            align: "center",
            width: 200,
          },
          {
            title: "GV hướng dẫn 2",
            dataIndex: "coSupervisor",
            key: "coSupervisor",
            align: "center",
            width: 200,
          },
          {
            title: "Ngày bắt đầu",
            dataIndex: "startDate",
            key: "startDate",
            align: "center",
            width: 120,
            render: (value?: Date) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
          },
          {
            title: "Ngày kết thúc",
            dataIndex: "endDate",
            key: "endDate",
            align: "center",
            width: 120,
            render: (value?: Date) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
          },
          {
            title: "Ngày báo cáo",
            dataIndex: "reportDate",
            key: "reportDate",
            align: "center",
            width: 120,
            render: (value?: Date) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
          },
          {
            title: "Điểm",
            dataIndex: "finalScore",
            key: "finalScore",
            align: "center",
            width: 100,
          },
        ]}
        dataSource={previewData}
        rowKey="code"
        pagination={{
          position: ["bottomRight"],
          defaultPageSize: DEFAULT_PAGINATE_SIZE,
          showSizeChanger: {
            labelRender: ({ value }) => `${value} / trang`,
            optionRender: (oriOption) => `${oriOption.value} / trang`,
          },
          showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
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
        scroll={{ x: "max-content" }}
        bordered
        locale={{
          emptyText: <Empty description="Không có dữ liệu" />,
        }}
      />
    </Modal>
  )
}

export default ImportInternshipModal
