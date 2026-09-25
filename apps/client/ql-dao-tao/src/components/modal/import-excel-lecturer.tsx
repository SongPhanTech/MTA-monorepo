import { CloseOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { importLecturer } from "@workspace/libs/api/training"
import { useFindManyLecturer } from "@workspace/db/hooks"
import { parseSheetLecturer } from "@workspace/libs/parseExcel"
import { Button, Col, Collapse, Empty, Modal, message, Row, Space, Table, Tag } from "antd"
import dayjs from "dayjs"
import { useState } from "react"

const { Panel } = Collapse
interface ImportStudentModalProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
}

const ImportLecturerModal = ({ visible, onSuccess, onCancel }: ImportStudentModalProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [errorData, setErrorData] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [disabledButton, setDisabledButton] = useState<boolean>(true)

  const [fileName, setFileName] = useState<string>("")

  const { data: existingLecturers } = useFindManyLecturer({
    select: {
      userProfile: {
        select: { code: true, idCardNumber: true },
      },
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setErrorData([])
    if (!file) return

    setFile(file)
    setFileName(`Dữ liệu giảng viên.${file.name.split(".")[1]}`)

    const reader = new FileReader()
    reader.onload = (e) => {
      const existingLecturerMap = new Map<string, string>()
      existingLecturers?.forEach((lec) => {
        if (lec.userProfile?.code && lec.userProfile?.idCardNumber) {
          existingLecturerMap.set(lec.userProfile.code, lec.userProfile.idCardNumber)
        }
      })

      const { lecturers, errors } = parseSheetLecturer(
        e.target?.result as ArrayBuffer,
        existingLecturerMap
      )
      setPreviewData(lecturers)
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
      const res = await importLecturer({ file: file, timeout: 30 })
      if (res?.status === 200) {
        message.success(res?.data?.message || "Nhập dữ liệu giảng viên từ file thành công")
        onSuccess()
      } else {
        const errorCodes = (res?.data as any)?.errors
        if (errorCodes && Array.isArray(errorCodes) && typeof errorCodes[0] === "string") {
          const importErrors = errorCodes.map((code: string) => {
            const matchingRows = previewData.filter((item) => item.code === code)
            const cellRefs = matchingRows.map((item) => `B${item.rowNum}`).join(", ")
            return {
              cellRef: cellRefs || code,
              message: `Mã giảng viên đã tồn tại trong hệ thống: ${code}`,
            }
          })
          setErrorData(importErrors)
          setDisabledButton(true)
          message.error(res?.data?.message || "Import thất bại")
        } else {
          const failedData = (res?.data as any)?.failed
          if (failedData && Array.isArray(failedData)) {
            const importErrors = failedData.map(
              (item: { code: string; name: string; error: string }) => {
                const matchingRow = previewData.find((p) => p.code === item.code)
                const cellRef = matchingRow ? `B${matchingRow.rowNum}` : item.code
                return {
                  cellRef,
                  message: `${item.name}: ${item.error}`,
                }
              }
            )
            setErrorData(importErrors)
            setDisabledButton(true)
            message.error(res?.data?.message || "Import thất bại")
          } else {
            message.error(res?.data?.message || "Nhập dữ liệu giảng viên từ file thất bại")
          }
        }
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
            render: (value?: Date) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
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
            dataIndex: "lecturerType",
            key: "type",
            align: "center",
            width: 150,
          },
          {
            title: "Học hàm",
            dataIndex: "degreeRankType",
            key: "academic",
            align: "center",
            width: 100,
          },
          {
            title: "Học vị",
            dataIndex: "degreeType",
            key: "degree",
            align: "center",
            width: 150,
          },
          {
            title: "Khoa",
            dataIndex: "facultyOrganization",
            align: "center",
            width: 150,
          },
          {
            title: "Bộ môn",
            dataIndex: "departmentOrganization",
            align: "center",
            width: 100,
          },
          {
            title: "Địa chỉ",
            dataIndex: "currentAddress",
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
            dataIndex: "idCardNumber",
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
