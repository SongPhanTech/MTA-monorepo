import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import Loading from "@components/commons/loading"
import DefaultLayout from "@layouts/default-layout"
import { usePagination } from "@hooks/usePagination"
import ModalPreviewImportJson from "@components/modal/modal-preview-import-json"
import { type ImportJsonPreview, parseImportJsonFile } from "@/utils/parse-import-json"
import {
  finishDataSync,
  startDataSync,
  useGetDataSyncHistory,
  type DataSyncHistoryItem,
} from "@workspace/libs/api/data-sync-history"
import {
  importFromInternal,
  isImportFromInternalOk,
} from "@workspace/libs/api/portal-import-training-data"
import {
  downloadExportJson,
  exportToInternal,
} from "@workspace/libs/api/portal-export-registration-results"
import {
  getGetClassRegisterSessionQueryKey,
  useGetClassRegisterSession,
} from "@workspace/libs/api/portal"
import { useQueryClient } from "@tanstack/react-query"
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
  History,
  Info,
  Loader2,
  Upload as UploadIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

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
  "Nhật ký đăng ký học (ClassRegisterLogs)",
  "Điểm môn học sau đăng ký (StudentSubjectScore)",
  "Sinh viên / hồ sơ liên quan (Student, UserProfile)",
  "Lớp học phần đã đăng ký (SubjectClass, SubjectVersion)",
  "Thông tin đợt đăng ký (ClassRegisterSession)",
]

function DongBoDuLieuPage() {
  const [activeTab, setActiveTab] = useState("import")
  const [exportSessionId, setExportSessionId] = useState<string>()
  const [importFiles, setImportFiles] = useState<UploadFile[]>([])
  const [importPreview, setImportPreview] = useState<ImportJsonPreview | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [parsingImportFile, setParsingImportFile] = useState(false)
  const [importParseError, setImportParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeImportId, setActiveImportId] = useState<string>()
  const prevImportStatus = useRef<string>()
  const queryClient = useQueryClient()
  const {
    currentPage,
    pageSize,
    onChange: onPaginationChange,
  } = usePagination(DEFAULT_PAGINATE_SIZE)

  const {
    data: history = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetDataSyncHistory(50, {
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const stateData = query.state.data
      let items: Array<{ status?: string }> | undefined
      if (Array.isArray(stateData)) {
        items = stateData
      } else if (
        stateData &&
        typeof stateData === "object" &&
        "data" in stateData &&
        Array.isArray((stateData as any).data)
      ) {
        items = (stateData as any).data
      }
      const hasPending = items?.some((h) => h.status === "PENDING")
      return hasPending ? 2000 : false
    },
  })
  const { data: classRegisterSession, isLoading: sessionLoading } = useGetClassRegisterSession({
    query: { refetchOnWindowFocus: false, staleTime: 60_000 },
  })

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
  const pendingImport = history.find((h) => h.type === "IMPORT" && h.status === "PENDING")

  const handleImportFileChange = async (fileList: UploadFile[]) => {
    const nextFiles = fileList.slice(-1)
    setImportFiles(nextFiles)

    if (nextFiles.length === 0) {
      setImportPreview(null)
      setPreviewModalOpen(false)
      setImportParseError(null)
      return
    }

    const file = nextFiles[0]?.originFileObj
    if (!file) {
      setImportPreview(null)
      setPreviewModalOpen(false)
      setImportParseError("Không đọc được file đã chọn")
      return
    }

    setParsingImportFile(true)
    setImportParseError(null)
    try {
      const preview = await parseImportJsonFile(file)
      setImportPreview(preview)
      setPreviewModalOpen(true)
    } catch (error) {
      setImportPreview(null)
      setPreviewModalOpen(false)
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

  useEffect(() => {
    const trackedId = activeImportId || pendingImport?.id
    if (!trackedId) return
    const item = history.find((h) => h.id === trackedId)
    if (!item) return

    if (item.status === "SUCCESS" && prevImportStatus.current !== "SUCCESS") {
      message.success(`Nhập dữ liệu thành công: ${item.sessionName}`)
      void queryClient.invalidateQueries({ queryKey: getGetClassRegisterSessionQueryKey() })
      setActiveImportId(undefined)
    }
    if (item.status === "FAILED" && prevImportStatus.current !== "FAILED") {
      message.error(item.errorMessage || `Nhập dữ liệu thất bại: ${item.sessionName}`)
      setActiveImportId(undefined)
    }
    prevImportStatus.current = item.status
  }, [history, activeImportId, pendingImport?.id, queryClient])

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
      const file = importFiles[0]?.originFileObj
      if (!file) {
        message.error("Không đọc được file đã chọn")
        return
      }

      const startRes = await startDataSync({
        type: "IMPORT",
        sessionName: importPreview.sessionName || file.name,
        classRegisterSessionId: importPreview.encrypted
          ? undefined
          : importPreview.sessionId || undefined,
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

      const importRes = await importFromInternal({
        file,
        syncHistoryId: syncId,
      })

      await refetchHistory()

      if (
        isImportFromInternalOk(importRes) &&
        (importRes.status === 202 || importRes.data.status === "PENDING")
      ) {
        prevImportStatus.current = "PENDING"
        setActiveImportId(importRes.data.syncHistoryId || syncId)
        message.success(
          importRes.data.message ||
            "Đã nhận file. Hệ thống đang nhập nền — theo dõi tab Lịch sử đồng bộ."
        )
        setActiveTab("history")
        return
      }

      if (isImportFromInternalOk(importRes) && importRes.data.sessionName) {
        await queryClient.invalidateQueries({ queryKey: getGetClassRegisterSessionQueryKey() })
        const warningCount = importRes.data.warnings?.length ?? 0
        if (warningCount > 0) {
          message.warning(
            `Đã nhập đợt «${importRes.data.sessionName}» với ${warningCount} cảnh báo. Kiểm tra tab Lịch sử đồng bộ.`
          )
        } else {
          message.success(`Nhập dữ liệu thành công: ${importRes.data.sessionName}`)
        }
        return
      }

      const errMessage = isImportFromInternalOk(importRes)
        ? "Nhập dữ liệu thất bại"
        : String(importRes.data.message ?? "Nhập dữ liệu thất bại")
      if (syncId && importRes.status >= 400) {
        await finishDataSync({
          id: syncId,
          status: "FAILED",
          errorMessage: errMessage,
        })
        await refetchHistory()
      }
      message.error(errMessage)
    } catch (error) {
      const errText = error instanceof Error ? error.message : String(error)
      const isNetworkError =
        error instanceof TypeError ||
        /failed to fetch|network|err_connection|aborted|load failed|econnreset/i.test(errText)
      if (syncId && isNetworkError) {
        prevImportStatus.current = "PENDING"
        setActiveImportId(syncId)
        message.warning(
          "Mất kết nối khi gửi file. Nếu máy chủ đã nhận, tiến trình vẫn chạy — theo dõi tab Lịch sử đồng bộ."
        )
        setActiveTab("history")
        await refetchHistory()
        return
      }
      if (syncId) {
        await finishDataSync({
          id: syncId,
          status: "FAILED",
          errorMessage: errText || "Đồng bộ thất bại",
        })
        await refetchHistory()
      }
      message.error(errText || "Nhập dữ liệu thất bại")
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

      const exportRes = await exportToInternal({
        classRegisterSessionId: exportSessionId,
        syncHistoryId: syncId,
      })

      await refetchHistory()

      if (exportRes.status === 200 && "meta" in exportRes.data) {
        downloadExportJson(exportRes.data, selectedExportSession?.name)
        const count = exportRes.data.meta.registrationCount
        if (!exportRes.data.meta.sessionEnded) {
          message.warning(
            `Đã xuất ${count} lượt đăng ký. Lưu ý: đợt đăng ký chưa kết thúc / vẫn đang mở.`
          )
        } else {
          message.success(`Xuất thành công ${count} lượt đăng ký`)
        }
      } else {
        const errMessage =
          exportRes.data && "message" in exportRes.data
            ? String(exportRes.data.message ?? "Xuất dữ liệu thất bại")
            : "Xuất dữ liệu thất bại"
        message.error(errMessage)
      }
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

  const exportTabLoading = activeTab === "export" && sessionLoading && !hasSessions

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
        destroyInactiveTabPane={false}
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
                    {/* <Alert
                      type="info"
                      showIcon
                      className="mb-4"
                      message="Hệ thống internet chưa có đợt đăng ký"
                      description="File lớn được nhập nền (bất đồng bộ) để tránh lỗi 504. Sau khi bấm nhập, theo dõi tab Lịch sử đồng bộ."
                    /> */}
                    {pendingImport && (
                      <Alert
                        type="warning"
                        showIcon
                        className="mb-4"
                        message="Đang nhập dữ liệu nền"
                        description={`Đợt «${pendingImport.sessionName}» đang được xử lý. Có thể chuyển tab hoặc rời trang — tiến trình vẫn chạy trên server.`}
                      />
                    )}

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
                        File đồng bộ từ QL đào tạo
                      </Text>
                      <Dragger
                        accept=".dat,.sync,.json,application/x-mta-dat,application/octet-stream,application/json"
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
                          Kéo thả hoặc bấm để chọn file xuất từ đợt đăng ký nội bộ
                        </p>
                        <p className="ant-upload-hint text-gray-500">
                          Định dạng: export-dot-dang-ky-*.dat (Gzip + AES-256, phiên bản 1.6.0).
                          File mã hóa — chỉ Portal giải mã được.
                        </p>
                      </Dragger>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setPreviewModalOpen(true)}
                        disabled={!importPreview || parsingImportFile}
                      >
                        Xem dữ liệu file
                      </Button>
                      <Button
                        type="primary"
                        icon={<UploadIcon className="size-4" />}
                        loading={importing || parsingImportFile}
                        onClick={handleImport}
                        disabled={
                          importFiles.length === 0 ||
                          !importPreview ||
                          parsingImportFile ||
                          Boolean(pendingImport)
                        }
                      >
                        {pendingImport ? "Đang nhập nền..." : "Nhập dữ liệu"}
                      </Button>
                    </div>
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
                          ? importFiles[0].size >= 1024 * 1024
                            ? `${(importFiles[0].size / (1024 * 1024)).toFixed(1)} MB`
                            : `${(importFiles[0].size / 1024).toFixed(1)} KB`
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
          {
            key: "history",
            label: (
              <span className="inline-flex items-center gap-2">
                <History className="size-4" />
                Lịch sử đồng bộ
              </span>
            ),
            children: (
              <Card>
                {pendingImport && (
                  <Alert
                    type="info"
                    showIcon
                    icon={<Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                    className="mb-4 bg-blue-50/80 border-blue-200"
                    message={
                      <div className="font-semibold text-blue-900">
                        Đang đồng bộ dữ liệu: {pendingImport.sessionName}
                      </div>
                    }
                    description={
                      <div className="mt-1 text-sm text-blue-800 flex flex-col gap-1">
                        <div className="font-medium flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                          <span>{pendingImport.description || "Hệ thống đang chuẩn bị và xử lý dữ liệu..."}</span>
                        </div>
                        <div className="text-xs text-blue-600/80 mt-0.5">
                          Tệp: {pendingImport.fileName ?? "—"} • Bắt đầu lúc:{" "}
                          {dayjs(pendingImport.createdAt).format("HH:mm:ss — DD/MM/YYYY")}
                        </div>
                      </div>
                    }
                  />
                )}
                <Table
                  size="small"
                  loading={historyLoading}
                  pagination={{
                    current: currentPage,
                    pageSize,
                    total: history.length,
                    showSizeChanger: true,
                    onChange: onPaginationChange,
                  }}
                  locale={{ emptyText: "Chưa có lịch sử đồng bộ" }}
                  rowKey="id"
                  dataSource={history}
                  bordered={true}
                  columns={[
                    {
                      title: "STT",
                      width: 70,
                      align: "center",
                      render: (_: unknown, __: unknown, index: number) =>
                        (currentPage - 1) * pageSize + index + 1,
                    },
                    {
                      title: "Loại",
                      dataIndex: "type",
                      width: 110,
                      render: (type: "IMPORT" | "EXPORT") =>
                        type === "IMPORT" ? (
                          <Tag color="blue">Nhập</Tag>
                        ) : (
                          <Tag color="green">Xuất</Tag>
                        ),
                    },
                    {
                      title: "Đợt đăng ký",
                      dataIndex: "sessionName",
                      width: 180,
                    },
                    {
                      title: "Tên file",
                      dataIndex: "fileName",
                      render: (value: string | null) => value ?? "—",
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 135,
                      render: (status: "PENDING" | "SUCCESS" | "FAILED") => {
                        if (status === "SUCCESS") return <Tag color="success">Thành công</Tag>
                        if (status === "FAILED") return <Tag color="error">Thất bại</Tag>
                        return (
                          <Tag color="processing" className="inline-flex items-center gap-1.5 font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Đang xử lý
                          </Tag>
                        )
                      },
                    },
                    {
                      title: "Ghi chú/ Lỗi",
                      dataIndex: "description",
                      ellipsis: true,
                      render: (_: unknown, record: DataSyncHistoryItem) => {
                        if (record.status === "PENDING") {
                          return (
                            <span className="text-blue-600 font-medium inline-flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-600" />
                              <span className="truncate">{record.description || "Đang xử lý..."}</span>
                            </span>
                          )
                        }
                        if (record.status === "FAILED") {
                          return (
                            <span className="text-red-500" title={record.errorMessage ?? undefined}>
                              {record.errorMessage || "Thất bại"}
                            </span>
                          )
                        }
                        return (
                          <span className="text-gray-600" title={record.description ?? undefined}>
                            {record.description || "—"}
                          </span>
                        )
                      },
                    },
                    {
                      title: "Thời gian",
                      dataIndex: "createdAt",
                      width: 180,
                      render: (value: string) =>
                        value ? dayjs(value).format("HH:mm — DD/MM/YYYY") : "—",
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <ModalPreviewImportJson
        open={previewModalOpen}
        preview={importPreview}
        fileName={importFiles[0]?.name}
        importing={importing}
        onClose={() => setPreviewModalOpen(false)}
        onConfirmImport={() => {
          setPreviewModalOpen(false)
          void handleImport()
        }}
      />
    </div>
  )
}

DongBoDuLieuPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Đồng bộ dữ liệu" }]}>{page}</DefaultLayout>
}

export default DongBoDuLieuPage
