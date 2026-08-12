import { CloseOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { importHeQuanSu } from "@workspace/libs/api/training"
import { parseSheetHeQuanSu } from "@workspace/libs/parseExcel"
import { Button, Col, Collapse, Empty, Modal, message, Row, Space, Table, Tag } from "antd"
import { useState } from "react"

const { Panel } = Collapse
interface ImportLecturerModalProps {
  visible: boolean
  onCancel: () => void
}

const ImportLecturerModal = ({ visible, onCancel }: ImportLecturerModalProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [errorData, setErrorData] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [disabledButton, setDisabledButton] = useState<boolean>(true)
  const [data, setData] = useState<{
    trainingObjectType: string | undefined
    trainingCourse: string | undefined
  }>({
    trainingObjectType: "",
    trainingCourse: "",
  })
  const [fileName, setFileName] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setErrorData([])
    if (!file) return

    setFile(file)
    setFileName(`Dữ liệu giảng viên.${file.name.split(".")[1]}`)

    const reader = new FileReader()
    reader.onload = (e) => {
      const { trainingObjectType, trainingCourse, students, errors } = parseSheetHeQuanSu(
        e.target?.result as ArrayBuffer
      )
      setPreviewData(students)
      setData({ trainingObjectType, trainingCourse })
      if (errors.length === 0) {
        setDisabledButton(false)
      }
      setErrorData(errors)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName("")
    setPreviewData([])
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
      const res = await importHeQuanSu({ file: file, timeout: 30 })
      if (res?.status === 200) {
        message.success(res?.data?.message || "Nhập dữ liệu giảng viên từ file thành công")
      } else {
        message.error(res?.data?.message || "Nhập dữ liệu giảng viên từ file thất bại")
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
      title="Nhập dữ liệu giảng viên từ Excel"
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
        Danh sách giảng viên{" "}
        {previewData.length > 0 && <span className="ml-2">({previewData.length} giảng viên)</span>}
      </Row>
      <Row className="mb-3">
        <Col span={12}>
          <span>
            Đối tượng đào tạo:{" "}
            {data?.trainingObjectType ? (
              data.trainingObjectType
            ) : previewData.length > 0 ? (
              <span className="text-[#e10b0b]">Bạn chưa nhập đối tượng đào tạo</span>
            ) : (
              ""
            )}
          </span>
        </Col>
        <Col span={12}>
          <span>
            Khoá học:{" "}
            {data?.trainingCourse ? (
              data.trainingCourse
            ) : previewData.length > 0 ? (
              <span className="text-[#e10b0b]">Bạn chưa nhập khoá đào tạo</span>
            ) : (
              ""
            )}
          </span>
        </Col>
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
            title: "Mã GV",
            dataIndex: "code",
            key: "code",
            width: 150,
            align: "center",
            fixed: "left",
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Tên giảng viên",
            dataIndex: "fullname",
            key: "fullname",
            align: "center",
            width: 250,
            fixed: "left",
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Ngày sinh",
            dataIndex: "dateOfBirth",
            key: "dateOfBirth",
            align: "center",
            width: 150,
          },
          {
            title: "Giới tính",
            dataIndex: "gender",
            align: "center",
            key: "gender",
            width: 100,
          },
          {
            title: "Kiểu giảng viên",
            dataIndex: "type",
            key: "type",
            align: "center",
            width: 100,
          },
          {
            title: "Học hàm",
            dataIndex: "academic",
            key: "academic",
            align: "center",
            width: 100,
          },
          {
            title: "Học vị",
            dataIndex: "degree",
            key: "degree",
            width: 150,
          },
          {
            title: "Khoa",
            dataIndex: "admissionBlock",
            key: "admissionBlock",
            align: "center",
            width: 150,
          },
          {
            title: "Bộ môn",
            dataIndex: "admissionScore",
            key: "admissionScore",
            align: "center",
            width: 100,
          },
          {
            title: "Địa chỉ",
            dataIndex: "adress",
            key: "adress",
            align: "center",
            width: 150,
          },
          {
            title: "Điện thoại",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
            align: "center",
            width: 150,
          },
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
            align: "center",
            width: 150,
          },

          {
            title: "CCCD/CMND",
            dataIndex: "idNumberCard",
            key: "idNumberCard",
            align: "center",
            width: 150,
          },
          {
            title: "Ghi chú",
            dataIndex: "description",
            key: "description",
            align: "center",
            width: 150,
          },
        ]}
        dataSource={previewData}
        rowKey="studentCode"
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

export default ImportLecturerModal
