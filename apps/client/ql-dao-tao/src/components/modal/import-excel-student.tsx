import { CloseOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import { importStudent } from "@workspace/libs/api/training"
import { parseSheetStudent } from "@workspace/libs/parseExcel"
import {
  Button,
  Col,
  Collapse,
  Empty,
  Modal,
  message,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd"
import { useState } from "react"

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
  const [createCurriculumVersion, setCreateCurriculumVersion] = useState(false)
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
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = parseSheetStudent(e.target?.result as ArrayBuffer)
        const { trainingObjectType, trainingCourse, students, errors } = result

        setData({ trainingObjectType, trainingCourse })
        setPreviewData(students)
        if (errors.length === 0 && students.length > 0) {
          setDisabledButton(false)
        } else {
          setDisabledButton(true)
        }
        setErrorData(errors)
        if (errors.length > 0) {
          console.error("Parse errors:", errors)
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        if (errorMessage.includes("password-protected")) {
          message.error("File Excel được bảo vệ bằng mật khẩu. Vui lòng bỏ mật khẩu và thử lại.")
        } else {
          message.error(`Lỗi khi đọc file Excel: ${errorMessage}`)
        }
        setDisabledButton(true)
      }
    }
    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      message.error("Không thể đọc file. Vui lòng thử lại.")
    }
    reader.readAsArrayBuffer(file)
  }

  const resetState = () => {
    setFile(null)
    setFileName("")
    setPreviewData([])
    setErrorData([])
    setData({ trainingObjectType: "", trainingCourse: "" })
    setDisabledButton(true)
    setCreateCurriculumVersion(false)
    // Reset input file để có thể chọn lại file cùng tên
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleRemoveFile = () => {
    resetState()
  }

  const handleCancel = () => {
    resetState()
    onCancel()
  }
  const { showSpinner, hideSpinner } = useSpinner()
  const handleConfirm = async () => {
    showSpinner()

    try {
      if (!file) return
      const res = await importStudent({ file, createCurriculumVersion, timeout: 30 })
      if (res?.status === 200) {
        message.success("Nhập dữ liệu sinh viên từ file thành công")
        resetState()
        onCancel()
      } else {
        message.error(res?.data?.message || "Nhập dữ liệu sinh viên từ file thất bại")
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
      title="Nhập dữ liệu sinh viên từ Excel"
      open={visible}
      width={1500}
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

      <Row className="flex flex-row justify-between items-center mb-3">
        <p className="text-xl">
          Danh sách sinh viên{" "}
          {previewData.length > 0 && <span className="ml-2">({previewData.length} sinh viên)</span>}
        </p>
        <Tooltip
          className="flex flex-row align-middle items-center gap-1"
          title="Khởi tạo các CTĐT nếu chưa có"
        >
          <label htmlFor="createCurriculumVersion">Tạo CTĐT</label>
          <Switch
            id="createCurriculumVersion"
            checked={createCurriculumVersion}
            onChange={(v) => setCreateCurriculumVersion(v)}
          />
        </Tooltip>
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
            title: "Số BD",
            width: 80,
            align: "center",
            fixed: "left",
            dataIndex: "registerNumber",
          },
          {
            title: "MÃ HSTS",
            width: 80,
            align: "center",
            fixed: "left",
            render: (_, __, index: number) => index + 1 + (currentPage - 1) * 10,
            dataIndex: "doctoralCode",
          },
          {
            title: "Mã sinh viên",
            dataIndex: "code",
            key: "code",
            width: 150,
            align: "center",
            fixed: "left",
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          {
            title: "Họ và tên",
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
            render: (value: string) => {
              return value ? formatDate(value) : ""
            },
          },
          {
            title: "Giới tính",
            dataIndex: "gender",
            align: "center",
            key: "gender",
            width: 100,
          },
          {
            title: "Dân tộc",
            dataIndex: "ethnicity",
            key: "ethnicity",
            align: "center",
            width: 100,
          },
          {
            title: "Quốc tịch",
            dataIndex: "nationality",
            key: "nationality",
            align: "center",
            width: 100,
          },
          {
            title: "CCCD",
            dataIndex: "idCardNumber",
            key: "idCardNumber",
            width: 100,
          },
          {
            title: "Nơi sinh (Tỉnh)",
            dataIndex: "provinceHometown",
            key: "provinceHometown",
            width: 150,
          },
          {
            title: "Số điện thoại",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
            width: 150,
          },
          {
            title: "Tổ hợp XT",
            dataIndex: "admissionCombination",
            key: "admissionCombination",
            align: "center",
            width: 100,
          },
          {
            title: "Tổng điểm",
            dataIndex: "entryScore",
            key: "entryScore",
            align: "center",
            width: 100,
          },
          {
            title: "Điểm đánh giá NL",
            dataIndex: "competencyScore",
            key: "competencyScore",
            align: "center",
            width: 100,
          },
          {
            title: "Mã lớp",
            dataIndex: "fixedClassCode",
            key: "fixedClassCode",
            align: "center",
            width: 100,
          },
          {
            title: "Lớp quản lý",
            dataIndex: "fixedClass",
            key: "fixedClass",
            align: "center",
            width: 200,
          },
          {
            title: "Ngành",
            dataIndex: "trainingField",
            key: "trainingField",
            align: "center",
            width: 200,
          },

          {
            title: "Chuyên ngành",
            dataIndex: "trainingMajor",
            key: "trainingMajor",
            align: "center",
            width: 200,
          },
          {
            title: "Chương trình đào tạo",
            dataIndex: "curriculum",
            key: "curriculum",
            align: "center",
            width: 200,
            render: (value: string) => <div className={!value ? "td-error" : ""}>{value}</div>,
          },
          // {
          //     title: 'Đối tượng đào tạo',
          //     dataIndex: 'trainingObjectType',
          //     key: 'trainingObjectType',
          //     align: 'center',
          //     width: 200,
          //     render: (value: string) => (
          //         <div className={!value ? 'td-error' : ''}>{value}</div>
          //     ),
          // },
          {
            title: "Loại HV",
            dataIndex: "objectType",
            key: "objectType",
            align: "center",
            width: 100,
          },
          {
            title: "Số hiệu SQ/QNCN",
            dataIndex: "officerNumber",
            key: "officerNumber",
            align: "center",
            width: 100,
          },
          {
            title: "Cấp bậc",
            dataIndex: "rank",
            key: "rank",
            align: "center",
            width: 150,
          },
          {
            title: "Chức vụ",
            dataIndex: "position",
            key: "position",
            align: "center",
            width: 150,
          },
          {
            title: "Cơ quan đơn vị",
            dataIndex: "department",
            key: "department",
            align: "center",
            width: 150,
          },
          {
            title: "Địa chỉ cơ quan",
            dataIndex: "departmentAddress",
            key: "departmentAddress",
            align: "center",
            width: 150,
          },
          {
            title: "Năm vào nghề",
            dataIndex: "careerYear",
            key: "careerYear",
            align: "center",
            width: 150,
          },
          {
            title: "Văn bằng đại học",
            children: [
              {
                title: "Trường",
                dataIndex: "universitySchool",
                key: "universitySchool",
                align: "center",
                width: 150,
              },
              {
                title: "Hệ ĐT",
                dataIndex: "universityTrainingType",
                key: "universityTrainingType",
                align: "center",
                width: 150,
              },
              {
                title: "Năm TN",
                dataIndex: "universityGraduationYear",
                key: "universityGraduationYear",
                align: "center",
                width: 150,
              },
              {
                title: "Ngành",
                dataIndex: "universityMajor",
                key: "universityMajor",
                align: "center",
                width: 150,
              },
              {
                title: "Loại TN",
                dataIndex: "universityRank",
                key: "universityRank",
                align: "center",
                width: 150,
              },
            ],
          },
          {
            title: "Cơ bản",
            dataIndex: "basic",
            key: "basic",
            align: "center",
            width: 150,
          },
          {
            title: "Cơ sở",
            dataIndex: "facility",
            key: "facility",
            align: "center",
            width: 150,
          },
          {
            title: "Ngoại ngữ",
            dataIndex: "foreignLanguage",
            key: "foreignLanguage",
            align: "center",
            width: 150,
          },
          {
            title: "Lý do ưu tiên",
            dataIndex: "priorityReason",
            key: "priorityReason",
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

export default ImportStudentModal
