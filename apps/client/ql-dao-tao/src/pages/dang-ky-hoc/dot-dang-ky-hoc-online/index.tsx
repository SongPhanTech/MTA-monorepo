import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import Table from "@components/commons/table"
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
import {
  downloadExportedFile,
  trackNewExportJob,
  useExportTrainingStore,
} from "@/stores/export-training-store"

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
  const [importSessionId, setImportSessionId] = useState<string | null>(null)
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
          content:
            (res.data as { message?: string })?.message ||
            "Đang có quá nhiều tiến trình xuất. Vui lòng đợi rồi thử lại.",
          key: "global-export-task",
        })
      } else {
        message.error({
          content: "Không thể khởi tạo tiến trình xuất dữ liệu",
          key: "global-export-task",
        })
      }
    } catch (err: any) {
      console.error(err)
      message.error({
        content: "Đã xảy ra lỗi khi khởi tạo xuất dữ liệu",
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
      message.warning("Vui lòng chọn gói .dat xuất từ Portal (không còn hỗ trợ JSON thuần)")
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
        message.error(
          ("message" in previewRes.data ? previewRes.data.message : undefined) ||
            "Xem trước nhập thất bại"
        )
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
        onOk: async () => {
          const pending = pendingImportRef.current
          if (!pending) return
          try {
            showSpinner()
            const res = await confirmImportRegistrationResults({
              classRegisterSessionId: pending.sessionId,
              file: pending.file,
              fileHash: pending.preview.fileHash,
            })
            if (res.status === 200) {
              const payload = res.data as ImportTrainingDataPayload
              const warningCount = payload.warnings?.length ?? 0
              if (warningCount > 0) {
                message.warning(
                  `${payload.message || "Nhập thành công"} (${warningCount} cảnh báo)`
                )
              } else {
                message.success(payload.message || "Nhập dữ liệu đăng ký thành công")
              }
              return
            }
            message.error(
              ("message" in res.data ? res.data.message : undefined) ||
                "Nhập dữ liệu đăng ký thất bại"
            )
          } catch {
            message.error("Đã xảy ra lỗi khi xác nhận nhập")
          } finally {
            hideSpinner()
            pendingImportRef.current = null
          }
        },
        onCancel: () => {
          pendingImportRef.current = null
        },
      })
    } catch {
      message.error("Đã xảy ra lỗi khi xem trước nhập dữ liệu đăng ký")
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
                {(() => {
                  const isGlobalJob = !exportJobState.sessionId
                  const isGlobalProcessing =
                    isGlobalJob && (exportJobState.status === "PENDING" || exportJobState.status === "PROCESSING")
                  const isGlobalSuccess = isGlobalJob && exportJobState.status === "SUCCESS"
                  const isGlobalFailed = isGlobalJob && exportJobState.status === "FAILED"

                  return (
                    <Tooltip
                      title={
                        isGlobalProcessing
                          ? "Đang xuất dữ liệu"
                          : isGlobalSuccess
                            ? "Hoàn thành"
                            : isGlobalFailed
                              ? "Xuất thất bại"
                              : "Xuất toàn bộ dữ liệu ra internet"
                      }
                    >
                      <Button
                        style={
                          isGlobalProcessing
                            ? {
                                position: "relative",
                                overflow: "hidden",
                                borderColor: "#1890ff",
                                color: "#096dd9",
                                fontWeight: 600,
                                background: `linear-gradient(to right, rgba(24, 144, 255, 0.22) ${exportJobState.progress}%, #ffffff ${exportJobState.progress}%)`,
                                transition: "background 0.3s ease",
                              }
                            : isGlobalSuccess
                              ? {
                                  borderColor: "#52c41a",
                                  color: "#389e0d",
                                  background: "#f6ffed",
                                  fontWeight: 600,
                                }
                              : isGlobalFailed
                                ? {
                                    borderColor: "#ff4d4f",
                                    color: "#cf1322",
                                    background: "#fff1f0",
                                  }
                                : undefined
                        }
                        icon={
                          isGlobalProcessing ? (
                            <LoadingOutlined spin />
                          ) : isGlobalSuccess ? (
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          ) : isGlobalFailed ? (
                            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                          ) : (
                            <DownloadOutlined />
                          )
                        }
                        onClick={() => {
                          if (exportJobState.status === "PENDING" || exportJobState.status === "PROCESSING") {
                            message.info("Đang xuất dữ liệu")
                            return
                          }
                          if (isGlobalSuccess && exportJobState.downloadUrl) {
                            downloadExportedFile(exportJobState.downloadUrl, exportJobState.fileName)
                            return
                          }
                          void handleExportRawData()
                        }}
                      >
                        {isGlobalProcessing
                          ? "Đang xuất dữ liệu"
                          : isGlobalSuccess
                            ? "Hoàn thành"
                            : isGlobalFailed
                              ? "Thử lại"
                              : "Xuất toàn bộ dữ liệu ra internet"}
                      </Button>
                    </Tooltip>
                  )
                })()}
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
                width: 170,
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
                      const isThisRowExporting =
                        exportJobState.sessionId === record.id &&
                        (exportJobState.status === "PENDING" || exportJobState.status === "PROCESSING")
                      const isThisRowSuccess =
                        exportJobState.sessionId === record.id && exportJobState.status === "SUCCESS"
                      const isThisRowFailed =
                        exportJobState.sessionId === record.id && exportJobState.status === "FAILED"

                      if (isThisRowExporting) {
                        return (
                          <Tooltip title="Đang xuất dữ liệu" placement="top">
                            <span
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-300 cursor-wait select-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LoadingOutlined spin className="text-xs" />
                              <span className="text-xs">{exportJobState.progress}%</span>
                            </span>
                          </Tooltip>
                        )
                      }

                      if (isThisRowSuccess) {
                        return (
                          <Tooltip title="Hoàn thành" placement="top">
                            <span
                              className="inline-flex items-center gap-1 font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-300 cursor-pointer select-none hover:bg-green-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (exportJobState.downloadUrl) {
                                  downloadExportedFile(exportJobState.downloadUrl, exportJobState.fileName)
                                }
                              }}
                            >
                              <CheckCircleOutlined className="text-xs text-green-600" />
                              <span className="text-xs">Hoàn thành</span>
                            </span>
                          </Tooltip>
                        )
                      }

                      if (isThisRowFailed) {
                        return (
                          <Tooltip title="Xuất thất bại" placement="top">
                            <span
                              className="inline-flex items-center gap-1 font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-300 cursor-pointer select-none hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleExportRawData(record.id, record.name)
                              }}
                            >
                              <CloseCircleOutlined className="text-xs text-red-600" />
                              <span className="text-xs">Thử lại</span>
                            </span>
                          </Tooltip>
                        )
                      }

                      return (
                        <Tooltip title="Xuất dữ liệu đợt này ra internet" placement="top">
                          <DownloadOutlined
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                exportJobState.status === "PENDING" ||
                                exportJobState.status === "PROCESSING"
                              ) {
                                message.info("Đang xuất dữ liệu")
                                return
                              }
                              void handleExportRawData(record.id, record.name)
                            }}
                            className="text-sm cursor-pointer"
                          />
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
    </div>
  )
}

ClassRegisterSession.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
