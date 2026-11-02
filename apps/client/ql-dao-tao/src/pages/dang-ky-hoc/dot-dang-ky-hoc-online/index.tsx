import { EyeOutlined, UploadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import { ExportInternetDownloadButton } from "@components/ui/export-internet-download-button"
import {
  CloudUploadPanel,
  type CloudUploadPanelHandle,
} from "@components/ui/cloud-upload-panel"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma, TrainingCourse } from "@workspace/db/client"
import {
  useCountClassRegisterSession,
  useFindManyClassRegisterSession,
  useFindManyTrainingCourse,
  useUpdateClassRegisterSession,
} from "@workspace/db/hooks"
import {
  getExportStatus,
  useExportTrainingDataAsync,
} from "@workspace/libs/api/export-training-data"
import {
  confirmImportRegistrationResults,
  previewImportRegistrationResults,
  type ImportRegistrationPreviewPayload,
  type ImportTrainingDataPayload,
} from "@workspace/libs/api/import-training-data"
import { invalidateRegistrationCaches } from "@workspace/libs/api/invalidate-class-register-cache"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Select, useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Modal, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { trackNewExportJob, useExportTrainingStore } from "@/stores/export-training-store"

export default function ClassRegisterSession() {
  const { can } = useAbility()
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    startDate: undefined,
    endDate: undefined,
    trainingCourseId: undefined,
    active: undefined,
  })

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const where = useMemo(
    () =>
      ({
        deletedAt: null,
        ...(filters.code
          ? {
              code: {
                contains: filters.code,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(filters.name && filters.name !== ""
          ? {
              name: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(semesterId
          ? {
              semesterId,
            }
          : {}),
        ...(filters.startDate?.length === 2
          ? {
              startDate: {
                gte: dayjs(filters.startDate?.[0], "DD/MM/YYYY").toDate(),
                lte: dayjs(filters.startDate?.[1], "DD/MM/YYYY").toDate(),
              },
            }
          : {}),
        ...(filters.endDate?.length === 2
          ? {
              endDate: {
                gte: dayjs(filters.endDate?.[0], "DD/MM/YYYY").toDate(),
                lte: dayjs(filters.endDate?.[1], "DD/MM/YYYY").toDate(),
              },
            }
          : {}),
        ...(filters.active !== undefined && {
          active:
            String(filters.active) === "true"
              ? true
              : String(filters.active) === "false"
                ? false
                : undefined,
        }),
        trainingCourses: {
          some: {
            trainingObjectTypeId,
            ...(filters.trainingCourseId && filters.trainingCourseId !== ""
              ? { id: filters.trainingCourseId }
              : {}),
          },
        },
      }) satisfies Prisma.ClassRegisterSessionWhereInput,
    [filters, semesterId, trainingObjectTypeId]
  )

  const { data } = useFindManyClassRegisterSession({
    where,
    include: { semester: { include: { schoolYear: true } }, trainingCourses: true },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountClassRegisterSession({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: { active: true, trainingObjectTypeId, deletedAt: null },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const trainingCourseOptions = useMemo(
    () =>
      trainingCourseData.map((i: TrainingCourse) => ({
        value: i.id,
        label: i.name,
      })),
    [trainingCourseData]
  )

  const { onOpen: onOpenPutClassRegisterSession } = useDisclosure<string>({
    tag: "PutClassRegisterSession",
  })

  const { mutateAsync: deleteClassRegisterSession } = useUpdateClassRegisterSession()
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const cloudImportRef = useRef<CloudUploadPanelHandle>(null)
  const [importSessionId, setImportSessionId] = useState<string | null>(null)
  const [cloudImportOpen, setCloudImportOpen] = useState(false)
  const cloudImportToastRef = useRef<{ type: "success" | "warning"; text: string } | null>(null)
  const pendingImportRef = useRef<{
    sessionId: string
    file: File
    preview: ImportRegistrationPreviewPayload
  } | null>(null)

  async function handleDeleteClassRegisterSession(id: string) {
    try {
      showSpinner()
      await deleteClassRegisterSession({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })
      try {
        await invalidateRegistrationCaches(id)
      } catch (cacheErr) {
        console.warn("Không reset được cache cổng đăng ký", cacheErr)
      }
      message.success("Xóa thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { mutateAsync: exportRawDataAsync } = useExportTrainingDataAsync()
  const exportJobState = useExportTrainingStore()

  async function handleExportRawData(sessionId?: string, sessionName?: string) {
    try {
      message.loading({
        content: "Đang xuất dữ liệu",
        key: "global-export-task",
        duration: 2,
      })

      const res = await exportRawDataAsync(sessionId ? { classRegisterSessionId: sessionId } : {})
      if (res.status === 202 && res.data.jobId) {
        trackNewExportJob(res.data.jobId, sessionId, sessionName)
      } else if (res.status === 429) {
        message.warning({
          content: "Đang xuất dữ liệu",
          key: "global-export-task",
        })
      } else {
        message.error({
          content: "Không xuất được dữ liệu",
          key: "global-export-task",
        })
      }
    } catch (err: any) {
      console.error(err)
      message.error({
        content: "Không xuất được dữ liệu",
        key: "global-export-task",
      })
    }
  }

  function handleImportRawData(sessionId: string) {
    setImportSessionId(sessionId)
    importFileInputRef.current?.click()
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    const sessionId = importSessionId

    if (!file || !sessionId) {
      setImportSessionId(null)
      return
    }

    const nameOk =
      file.name.endsWith(".dat") ||
      file.name.endsWith(".sync") ||
      file.type === "application/x-mta-dat" ||
      file.type === "application/octet-stream"
    if (!nameOk) {
      message.warning("Không nhập được dữ liệu")
      setImportSessionId(null)
      return
    }

    try {
      showSpinner()
      const previewRes = await previewImportRegistrationResults({
        classRegisterSessionId: sessionId,
        file,
      })

      if (previewRes.status !== 200 || !("fileHash" in previewRes.data)) {
        message.error("Không nhập được dữ liệu")
        return
      }

      const preview = previewRes.data
      pendingImportRef.current = { sessionId, file, preview }
      const s = preview.stats

      Modal.confirm({
        title: "Xác nhận nhập kết quả đăng ký",
        width: 520,
        content: (
          <div className="space-y-2 text-sm">
            <p>
              Đợt: <strong>{preview.sessionName}</strong>
            </p>
            <ul className="list-disc pl-5">
              <li>
                Nhật ký đăng ký: thêm {s.createLogs}, cập nhật {s.updateLogs}
              </li>
              <li>
                Điểm môn (placeholder): thêm {s.createScores}, cập nhật {s.updateScores}, bỏ qua đã
                có điểm {s.skipScoresWithGrade}
              </li>
              <li>
                Sẽ ẩn (soft-delete): {s.removeLogs} đăng ký, {s.removeScores} điểm trống
              </li>
              {s.failed > 0 ? <li>Bản ghi lỗi / bỏ qua: {s.failed}</li> : null}
            </ul>
            {preview.warnings.length > 0 ? (
              <p className="text-amber-700">
                {preview.warnings.length} cảnh báo (xem chi tiết sau khi xác nhận)
              </p>
            ) : null}
            <p className="text-slate-500">Chỉ xác nhận khi đúng đợt và đúng file từ Portal.</p>
          </div>
        ),
        okText: "Xác nhận nhập",
        cancelText: "Hủy",
        onOk: () => {
          if (!pendingImportRef.current) return
          cloudImportToastRef.current = null
          setCloudImportOpen(true)
        },
        onCancel: () => {
          pendingImportRef.current = null
        },
      })
    } catch {
      message.error("Không nhập được dữ liệu")
    } finally {
      hideSpinner()
      setImportSessionId(null)
    }
  }

  return (
    <div>
      <input
        ref={importFileInputRef}
        type="file"
        accept=".dat,.sync,application/x-mta-dat,application/octet-stream"
        className="hidden"
        onChange={handleImportFileChange}
      />
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={12}>
              <Row gutter={[16, 16]} align="top">
                <Col span={8}>
                  <Select
                    placeholder="Chọn khoá"
                    options={trainingCourseOptions}
                    style={{ width: "100%" }}
                    onChange={(val) => {
                      setFilters((prev) => ({
                        ...prev,
                        trainingCourseId: val,
                      }))
                      setCurrentPage(1)
                    }}
                    allowClear
                  />
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Flex justify="end" gap={4} wrap="wrap">
                {/* {(() => {
                  const isGlobalJob = !exportJobState.sessionId
                  const isBusy =
                    exportJobState.status === "PENDING" || exportJobState.status === "PROCESSING"
                  const isOtherJobRunning = isBusy && !isGlobalJob

                  return (
                    <Tooltip title="Xuất toàn bộ dữ liệu ra internet">
                      <span>
                        <ExportInternetDownloadButton
                          label="Xuất toàn bộ dữ liệu ra internet"
                          prepareProgress={isGlobalJob ? exportJobState.progress : 0}
                          externalStatus={isGlobalJob ? exportJobState.status : "IDLE"}
                          downloadUrl={isGlobalJob ? exportJobState.downloadUrl : undefined}
                          fileName={isGlobalJob ? exportJobState.fileName : undefined}
                          isOtherJobRunning={isOtherJobRunning}
                          onOtherJobRunning={() => message.info("Đang xuất dữ liệu")}
                          onStartExport={() => void handleExportRawData()}
                        />
                      </span>
                    </Tooltip>
                  )
                })()} */}
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                  "THEM"
                ) && (
                  <Button type="primary" onClick={() => onOpenPutClassRegisterSession()}>
                    <BookPlus />
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              // {
              //     title: 'Mã đợt đăng ký',
              //     align: 'center',
              //     dataIndex: 'code',
              //     type: 'input',
              //     width: 100,
              //     fixed: 'left',
              // },
              {
                title: "Tên đợt đăng ký",
                align: "center",
                dataIndex: "name",
                type: "input",
                width: 150,
                fixed: "left",
              },
              {
                title: "Học kỳ",
                align: "center",
                width: 150,
                render: (_, record) => record?.semester?.name,
              },
              {
                title: "Khoá học",
                align: "center",
                width: 150,
                render: (_, record) => (
                  <div className="text-left">
                    {record?.trainingCourses?.map((i: TrainingCourse, index: number) => (
                      <div key={`${index + 1}`}>- {i.name}</div>
                    ))}
                  </div>
                ),
              },
              {
                title: "Ngày bắt đầu",
                align: "center",
                width: 120,
                dataIndex: "startDate",
                type: "date",
                render: (_, record) =>
                  record?.startDate ? dayjs(record?.startDate).format("HH:mm - DD/MM/YYYY") : "",
              },
              {
                title: "Ngày kết thúc",
                align: "center",
                width: 120,
                dataIndex: "endDate",
                type: "date",
                render: (_, record) =>
                  record?.endDate ? dayjs(record?.endDate).format("HH:mm - DD/MM/YYYY") : "",
              },
              {
                title: "Mô tả",
                width: 200,
                align: "center",
                dataIndex: "description",
                render: (value: string) => {
                  return (
                    <Tooltip title={value}>
                      <div className="line-clamp-2">{value}</div>
                    </Tooltip>
                  )
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 130,
                fixed: "right",
                dataIndex: "active",
                type: "select",
                options: [
                  {
                    value: true,
                    label: "Đang mở",
                  },
                  {
                    value: false,
                    label: "Đã đóng",
                  },
                ],
                render: (__, record) => {
                  return !record?.active ? (
                    <Tag color="error">Đã đóng</Tag>
                  ) : (
                    <Tag color="success">Đang mở</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <div className="flex items-center justify-center gap-2 flex-nowrap">
                    <Tooltip title="Nhập gói .dat kết quả đăng ký từ Portal" placement="top">
                      <UploadOutlined
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImportRawData(record.id)
                        }}
                        className="text-sm cursor-pointer"
                      />
                    </Tooltip>
                    {(() => {
                      const isThisRow =
                        exportJobState.sessionId === record.id &&
                        exportJobState.status !== "IDLE"
                      const isBusy =
                        exportJobState.status === "PENDING" ||
                        exportJobState.status === "PROCESSING"
                      const isOtherJobRunning = isBusy && exportJobState.sessionId !== record.id

                      return (
                        <Tooltip title="Xuất dữ liệu đợt này ra internet" placement="top">
                          <span onClick={(e) => e.stopPropagation()}>
                            <ExportInternetDownloadButton
                              compact
                              prepareProgress={isThisRow ? exportJobState.progress : 0}
                              externalStatus={
                                isThisRow ? exportJobState.status : "IDLE"
                              }
                              downloadUrl={isThisRow ? exportJobState.downloadUrl : undefined}
                              fileName={isThisRow ? exportJobState.fileName : undefined}
                              isOtherJobRunning={isOtherJobRunning}
                              onOtherJobRunning={() => message.info("Đang xuất dữ liệu")}
                              onStartExport={() =>
                                void handleExportRawData(record.id, record.name)
                              }
                            />
                          </span>
                        </Tooltip>
                      )
                    })()}
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                      "XEM_CHI_TIET"
                    ) && (
                      <Tooltip title="Xem các đơn đăng ký" placement="top">
                        <EyeOutlined
                          onClick={() => {
                            router.push(
                              ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE_ID.replace(
                                "[id]",
                                record.id
                              )
                            )
                          }}
                          className="text-sm cursor-pointer"
                        />
                      </Tooltip>
                    )}
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                      "SUA"
                    ) && (
                      <EditIcon
                        onClick={(e) => {
                          onOpenPutClassRegisterSession(record.id)
                          e?.stopPropagation()
                        }}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                      "XOA"
                    ) && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: (e) => {
                            handleDeleteClassRegisterSession(record.id)
                            e?.stopPropagation()
                          },
                          onCancel: (e) => {
                            e?.stopPropagation()
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                ),
              },
            ]}
            data={data}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>

      <Modal
        title="Nhập kết quả đăng ký từ Portal"
        open={cloudImportOpen}
        footer={null}
        closable={false}
        maskClosable={false}
        onCancel={() => {
          setCloudImportOpen(false)
          pendingImportRef.current = null
          cloudImportRef.current?.reset()
        }}
        width={480}
        destroyOnClose
        afterOpenChange={(open) => {
          if (!open) return
          const pending = pendingImportRef.current
          if (!pending) return
          cloudImportRef.current?.setExternalFile(pending.file)
          window.setTimeout(() => {
            void cloudImportRef.current?.startUpload()
          }, 320)
        }}
      >
        <CloudUploadPanel
          ref={cloudImportRef}
          hidePicker
          showUploadButton={false}
          hint="Gói .dat từ Portal"
          onUpload={async (file, onProgress) => {
            const pending = pendingImportRef.current
            if (!pending) return false
            let timer: ReturnType<typeof setInterval> | undefined
            try {
              onProgress(10)
              let fake = 12
              timer = setInterval(() => {
                fake = Math.min(85, fake + 3 + Math.random() * 4)
                onProgress(fake)
              }, 300)
              const res = await confirmImportRegistrationResults({
                classRegisterSessionId: pending.sessionId,
                file,
                fileHash: pending.preview.fileHash,
              })
              if (timer) clearInterval(timer)
              onProgress(100)
              if (res.status === 200) {
                const payload = res.data as ImportTrainingDataPayload
                const warningCount = payload.warnings?.length ?? 0
                cloudImportToastRef.current =
                  warningCount > 0
                    ? {
                        type: "warning",
                        text: "Nhập dữ liệu thành công",
                      }
                    : {
                        type: "success",
                        text: "Nhập dữ liệu thành công",
                      }
                return true
              }
              message.error("Không nhập được dữ liệu")
              return false
            } catch {
              message.error("Không nhập được dữ liệu")
              return false
            } finally {
              if (timer) clearInterval(timer)
            }
          }}
          onComplete={() => {
            const toast = cloudImportToastRef.current
            cloudImportToastRef.current = null
            if (toast?.type === "warning") message.warning(toast.text)
            else if (toast?.type === "success") message.success(toast.text)
            setCloudImportOpen(false)
            pendingImportRef.current = null
          }}
        />
      </Modal>
    </div>
  )
}

ClassRegisterSession.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
