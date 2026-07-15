import { DownloadOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons"
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
import { useExportTrainingData } from "@workspace/libs/api/export-training-data"
import { useImportTrainingData } from "@workspace/libs/api/import-training-data"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Select, useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

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
  const { mutateAsync: exportRawData } = useExportTrainingData()
  const { mutateAsync: importRawData } = useImportTrainingData()
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [importSessionId, setImportSessionId] = useState<string | null>(null)

  async function handleDeleteClassRegisterSession(id: string) {
    try {
      showSpinner()
      await deleteClassRegisterSession({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })
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

  async function handleExportRawData(sessionId: string, sessionName?: string | null) {
    try {
      showSpinner()
      const res = await exportRawData({ classRegisterSessionId: sessionId })

      if (res.status === 200) {
        message.success("Xuất dữ liệu thô thành công")
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json;charset=utf-8",
        })
        const safeName = (sessionName || sessionId).replace(/[\\/:*?"<>|]/g, "_")
        saveAs(blob, `export-dot-dang-ky-${safeName}.json`)
        return
      }

      message.error(
        ("message" in res.data ? res.data.message : undefined) || "Xuất dữ liệu thô thất bại"
      )
    } catch {
      message.error("Đã xảy ra lỗi khi xuất dữ liệu thô")
    } finally {
      hideSpinner()
    }
  }

  function handleImportRawData(sessionId: string) {
    setImportSessionId(sessionId)
    importFileInputRef.current?.click()
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !importSessionId) {
      setImportSessionId(null)
      return
    }

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      message.warning("Vui lòng chọn file JSON")
      setImportSessionId(null)
      return
    }

    try {
      showSpinner()
      const res = await importRawData({
        classRegisterSessionId: importSessionId,
        file,
      })

      if (res.status === 200) {
        const payload = res.data as import("@workspace/libs/api/import-training-data").ImportTrainingDataPayload
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
        ("message" in res.data ? res.data.message : undefined) || "Nhập dữ liệu đăng ký thất bại"
      )
    } catch {
      message.error("Đã xảy ra lỗi khi nhập dữ liệu đăng ký")
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
        accept=".json,application/json"
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
            <Col span={8}>
              <Flex justify="end" gap={4}>
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
                width: 160,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Nhập dữ liệu đăng ký từ internet" placement="top">
                      <UploadOutlined
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImportRawData(record.id)
                        }}
                        className="text-sm cursor-pointer"
                      />
                    </Tooltip>
                    <Tooltip title="Xuất dữ liệu thô" placement="top">
                      <DownloadOutlined
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportRawData(record.id, record.name)
                        }}
                        className="text-sm cursor-pointer"
                      />
                    </Tooltip>
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
                  </Row>
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
