import Loading from "@components/commons/loading"
import DefaultLayout from "@layouts/default-layout"
import { type ImportJsonPreview, parseImportJsonFile } from "@/utils/parse-import-json"
import {
  finishDataSync,
  startDataSync,
  useGetDataSyncHistory,
} from "@workspace/libs/api/data-sync-history"
import { useGetClassRegisterSession } from "@workspace/libs/api/portal"
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Select,
  Steps,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd"
import type { UploadFile } from "antd/es/upload/interface"
import dayjs from "dayjs"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileJson,
  Info,
  Upload as UploadIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

dayjs.locale("vi")

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

const IMPORT_DATA_ITEMS = [
  "Đợt đăng ký học",
  "Lớp học phần, thời khóa biểu",
  "Sinh viên, hồ sơ ",
  "Danh mục hệ thống ",
  "Chương trình đào tạo, môn học ",
]

const EXPORT_DATA_ITEMS = [
  "Nhật ký đăng ký học ",
  "Điểm môn học sau đăng ký ",
  "Thông tin đợt đăng ký và học viên liên quan",
]

function DongBoDuLieuPage() {
  const [activeTab, setActiveTab] = useState("import")
  const [exportSessionId, setExportSessionId] = useState<string>()
  const [importFiles, setImportFiles] = useState<UploadFile[]>([])
  const [importPreview, setImportPreview] = useState<ImportJsonPreview | null>(null)
  const [parsingImportFile, setParsingImportFile] = useState(false)
  const [importParseError, setImportParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const {
    data: history = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetDataSyncHistory()
  const { data: classRegisterSession, isFetching, isLoading } = useGetClassRegisterSession()

  const sessions = useMemo(() => {
    if (classRegisterSession?.status !== 200) return []
    return classRegisterSession.data ?? []
  }, [classRegisterSession])

  const hasSessions = sessions.length > 0

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        value: session.id,
        label: [session.name, session.semester?.name, session.semester?.schoolYear?.name]
          .filter(Boolean)
          .join(" — "),
      })),
    [sessions]
  )

  const selectedExportSession = sessions.find((s) => s.id === exportSessionId)

  const handleImportFileChange = async (fileList: UploadFile[]) => {
    const nextFiles = fileList.slice(-1)
    setImportFiles(nextFiles)

    if (nextFiles.length === 0) {
      setImportPreview(null)
      setImportParseError(null)
      return
    }

    const file = nextFiles[0]?.originFileObj
    if (!file) {
      setImportPreview(null)
      setImportParseError("Không đọc được file đã chọn")
      return
    }

    setParsingImportFile(true)
    setImportParseError(null)
    try {
      const preview = await parseImportJsonFile(file)
      setImportPreview(preview)
    } catch (error) {
      setImportPreview(null)
      setImportParseError(
        error instanceof Error ? error.message : "Không đọc được thông tin từ file JSON"
      )
      message.error(
        error instanceof Error ? error.message : "Không đọc được thông tin từ file JSON"
      )
    } finally {
      setParsingImportFile(false)
    }
  }

  const handleImport = async () => {
    if (importFiles.length === 0) {
      message.warning("Vui lòng chọn file JSON từ phần mềm nội bộ")
      return
    }
    if (!importPreview) {
      message.warning(importParseError ?? "File JSON chưa hợp lệ hoặc đang được đọc")
      return
    }

    setImporting(true)
    let syncId: string | undefined
    try {
      const startRes = await startDataSync({
        type: "IMPORT",
        sessionName: importPreview.sessionName,
        classRegisterSessionId: importPreview.sessionId,
        fileName: importFiles[0]?.name,
        fileVersion: importPreview.version,
        sourceExportedAt: importPreview.exportedAt,
        recordCounts: importPreview.recordCounts,
      })

      if (startRes.status !== 200) {
        message.error("Không ghi được lịch sử đồng bộ")
        return
      }

      syncId = startRes.data.id
      await new Promise((resolve) => setTimeout(resolve, 800))
      await finishDataSync({ id: syncId, status: "FAILED", errorMessage: "Chức năng nhập dữ liệu đang phát triển" })
      await refetchHistory()
      message.info("Chức năng nhập dữ liệu đang phát triển. Lịch sử đồng bộ đã được ghi nhận.")
    } catch (error) {
      if (syncId) {
        await finishDataSync({
          id: syncId,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Đồng bộ thất bại",
        })
        await refetchHistory()
      }
      message.error(error instanceof Error ? error.message : "Nhập dữ liệu thất bại")
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    if (!hasSessions) {
      message.warning("Chưa có đợt đăng ký. Vui lòng nhập dữ liệu từ nội bộ trước.")
      return
    }
    if (!exportSessionId) {
      message.warning("Vui lòng chọn đợt đăng ký học")
      return
    }

    setExporting(true)
    let syncId: string | undefined
    try {
      const startRes = await startDataSync({
        type: "EXPORT",
        sessionName: selectedExportSession?.name ?? "",
        classRegisterSessionId: exportSessionId,
      })

      if (startRes.status !== 200) {
        message.error("Không ghi được lịch sử đồng bộ")
        return
      }

      syncId = startRes.data.id
      await new Promise((resolve) => setTimeout(resolve, 800))
      await finishDataSync({ id: syncId, status: "FAILED", errorMessage: "Chức năng xuất dữ liệu đang phát triển" })
      await refetchHistory()
      message.info("Chức năng xuất dữ liệu đang phát triển. Lịch sử đồng bộ đã được ghi nhận.")
    } catch (error) {
      if (syncId) {
        await finishDataSync({
          id: syncId,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Đồng bộ thất bại",
        })
        await refetchHistory()
      }
      message.error(error instanceof Error ? error.message : "Xuất dữ liệu thất bại")
    } finally {
      setExporting(false)
    }
  }

  const exportTabLoading = activeTab === "export" && (isFetching || isLoading)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Title level={3} className="!mb-1">
          Đồng bộ dữ liệu
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Trao đổi dữ liệu giữa phần mềm nội bộ (Quản lý đào tạo) và cổng đăng ký học internet.
        </Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<Info className="size-4 mt-0.5" />}
        message="Quy trình đồng bộ"
        description={
          <ol className="mb-0 pl-4 list-decimal space-y-1">
            <li>
              <Text strong>Nội bộ → Internet:</Text> Xuất JSON từ QL đào tạo và nhập vào đây. Đợt
              đăng ký, lớp HP, sinh viên sẽ được tạo từ file — hệ thống internet ban đầu chưa có dữ
              liệu.
            </li>
            <li>
              <Text strong>Internet:</Text> Học viên đăng ký môn trên cổng đăng ký học.
            </li>
            <li>
              <Text strong>Internet → Nội bộ:</Text> Xuất kết quả đăng ký (JSON) và nhập lại vào
              phần mềm nội bộ.
            </li>
          </ol>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: "import",
            label: (
              <span className="inline-flex items-center gap-2">
                <ArrowDownToLine className="size-4" />
                Nhập từ nội bộ
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="Nhập dữ liệu từ phần mềm nội bộ" className="h-full">
                    <Alert
                      type="info"
                      showIcon
                      className="mb-4"
                      message="Hệ thống internet chưa có đợt đăng ký"
                      // description="Không cần chọn đợt trước khi nhập. Thông tin đợt đăng ký học nằm trong file JSON xuất từ QL đào tạo và sẽ được tạo sau khi import thành công."
                    />

                    <Steps
                      direction="vertical"
                      size="small"
                      current={importPreview ? 1 : 0}
                      className="mb-6"
                      items={[
                        { title: "Tải file JSON từ nội bộ" },
                        { title: "Xác nhận và nhập dữ liệu" },
                      ]}
                    />

                    <div className="mb-4">
                      <Text strong className="block mb-2">
                        File JSON từ QL đào tạo
                      </Text>
                      <Dragger
                        accept=".json,application/json"
                        maxCount={1}
                        fileList={importFiles}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => {
                          void handleImportFileChange(fileList)
                        }}
                        onRemove={() => {
                          void handleImportFileChange([])
                          return true
                        }}
                      >
                        <p className="ant-upload-drag-icon flex justify-center">
                          <FileJson className="size-10 text-green-700" />
                        </p>
                        <p className="ant-upload-text">
                          Kéo thả hoặc bấm để chọn file JSON xuất từ đợt đăng ký nội bộ
                        </p>
                        <p className="ant-upload-hint text-gray-500">
                          Định dạng: export-dot-dang-ky-*.json (phiên bản 1.3.0). File chứa đầy đủ
                          thông tin đợt đăng ký cần khởi tạo.
                        </p>
                      </Dragger>
                    </div>

                    <Button
                      type="primary"
                      icon={<UploadIcon className="size-4" />}
                      loading={importing || parsingImportFile}
                      onClick={handleImport}
                      disabled={importFiles.length === 0 || !importPreview || parsingImportFile}
                    >
                      Nhập dữ liệu
                    </Button>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card title="Thông tin nhập" className="h-full">
                    {importParseError && (
                      <Alert type="error" showIcon message={importParseError} className="mb-4" />
                    )}

                    <Descriptions column={1} size="small" bordered className="mb-4">
                      <Descriptions.Item label="File đã chọn">
                        {importFiles[0]?.name ?? "Chưa chọn"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Kích thước">
                        {importFiles[0]?.size
                          ? `${(importFiles[0].size / 1024).toFixed(1)} KB`
                          : "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phiên bản file">
                        {parsingImportFile ? "Đang đọc..." : (importPreview?.version ?? "—")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Đợt đăng ký">
                        {parsingImportFile ? (
                          "Đang đọc..."
                        ) : importPreview ? (
                          <Text strong>{importPreview.sessionName}</Text>
                        ) : (
                          <Text type="secondary">—</Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Học kỳ">
                        {parsingImportFile ? "Đang đọc..." : (importPreview?.semesterName ?? "—")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Năm học">
                        {parsingImportFile ? "Đang đọc..." : (importPreview?.schoolYearName ?? "—")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian đăng ký">
                        {parsingImportFile ? (
                          "Đang đọc..."
                        ) : importPreview?.startDate && importPreview?.endDate ? (
                          <>
                            {dayjs(importPreview.startDate).format("DD/MM/YYYY")}
                            {" — "}
                            {dayjs(importPreview.endDate).format("DD/MM/YYYY")}
                          </>
                        ) : (
                          "—"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        {parsingImportFile ? (
                          "Đang đọc..."
                        ) : importPreview?.active != null ? (
                          importPreview.active ? (
                            <Tag color="success">Đang mở</Tag>
                          ) : (
                            <Tag color="error">Đã đóng</Tag>
                          )
                        ) : (
                          "—"
                        )}
                      </Descriptions.Item>
                    </Descriptions>

                    <Text strong className="block mb-2">
                      Dữ liệu sẽ được nhập
                    </Text>
                    <ul className="pl-4 list-disc space-y-1 text-sm text-gray-600">
                      {IMPORT_DATA_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "export",
            label: (
              <span className="inline-flex items-center gap-2">
                <ArrowUpFromLine className="size-4" />
                Xuất về nội bộ
              </span>
            ),
            children: exportTabLoading ? (
              <Loading />
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="Xuất kết quả đăng ký về phần mềm nội bộ" className="h-full">
                    <Paragraph type="secondary">
                      Sau khi học viên hoàn tất đăng ký trên internet, xuất file JSON để nhập lại
                      vào QL đào tạo (đợt đăng ký học online → Nhập dữ liệu).
                    </Paragraph>

                    {!hasSessions ? (
                      <Alert
                        type="warning"
                        showIcon
                        className="mb-4"
                        message="Chưa có đợt đăng ký học"
                        description="Danh sách đợt sẽ xuất hiện sau khi bạn nhập dữ liệu từ phần mềm nội bộ ở tab «Nhập từ nội bộ»."
                      />
                    ) : (
                      <>
                        <div className="mb-4">
                          <Text strong className="block mb-2">
                            Đợt đăng ký học
                          </Text>
                          <Select
                            className="w-full"
                            placeholder="Chọn đợt đăng ký cần xuất kết quả"
                            options={sessionOptions}
                            value={exportSessionId}
                            onChange={setExportSessionId}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                          />
                        </div>

                        {selectedExportSession && (
                          <Descriptions column={1} size="small" bordered className="mb-4">
                            <Descriptions.Item label="Đợt đăng ký">
                              {selectedExportSession.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Học kỳ">
                              {selectedExportSession.semester?.name ?? "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Kết thúc đăng ký">
                              {selectedExportSession.endDate
                                ? dayjs(selectedExportSession.endDate).format("HH:mm — DD/MM/YYYY")
                                : "—"}
                            </Descriptions.Item>
                          </Descriptions>
                        )}
                      </>
                    )}

                    <Button
                      type="primary"
                      icon={<ArrowUpFromLine className="size-4" />}
                      loading={exporting}
                      onClick={handleExport}
                      disabled={!hasSessions || !exportSessionId}
                    >
                      Xuất file JSON
                    </Button>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card title="Nội dung xuất" className="h-full">
                    <ul className="pl-4 list-disc space-y-1 text-sm text-gray-600 mb-4">
                      {EXPORT_DATA_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <Alert
                      type="warning"
                      showIcon
                      message="Lưu ý"
                      description="Chỉ xuất sau khi đợt đăng ký đã kết thúc hoặc khi cần đồng bộ kết quả về hệ thống nội bộ."
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      <Card title="Lịch sử đồng bộ">
        <Table
          size="small"
          loading={historyLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Chưa có lịch sử đồng bộ" }}
          rowKey="id"
          dataSource={history}
          columns={[
            {
              title: "Loại",
              dataIndex: "type",
              width: 120,
              render: (type: "IMPORT" | "EXPORT") =>
                type === "IMPORT" ? <Tag color="blue">Nhập</Tag> : <Tag color="green">Xuất</Tag>,
            },
            {
              title: "Đợt đăng ký",
              dataIndex: "sessionName",
            },
            {
              title: "Tên file",
              dataIndex: "fileName",
              render: (value: string | null) => value ?? "—",
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              render: (status: "PENDING" | "SUCCESS" | "FAILED") => {
                if (status === "SUCCESS") return <Tag color="success">Thành công</Tag>
                if (status === "FAILED") return <Tag color="error">Thất bại</Tag>
                return <Tag color="processing">Đang xử lý</Tag>
              },
            },
            {
              title: "Thời gian",
              dataIndex: "createdAt",
              width: 180,
              render: (value: string) => (value ? dayjs(value).format("HH:mm — DD/MM/YYYY") : "—"),
            },
          ]}
        />
      </Card>
    </div>
  )
}

DongBoDuLieuPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Đồng bộ dữ liệu" }]}>{page}</DefaultLayout>
}

export default DongBoDuLieuPage
