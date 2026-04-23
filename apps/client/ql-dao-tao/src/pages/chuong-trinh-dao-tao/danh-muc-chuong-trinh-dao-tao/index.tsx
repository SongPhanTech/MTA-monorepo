import { HighlightOutlined } from "@ant-design/icons"
import TableCollapse from "@components/commons/tableCollapse"
import CopyPlusIcon from "@components/icons/copyPlus"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import LockPlusIcon from "@components/icons/lockPlus"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { CurriculumVersionType,  Prisma,  TrainingMajor,  TrainingTime } from "@workspace/db/client"
import {
  useCountCurriculum,
  useFindManyCurriculum,
  useFindManyTrainingCourse,
  useFindManyTrainingMajor,
  useFindManyTrainingTime,
  useUpdateCurriculum,
  useUpdateCurriculumVersion,
} from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Select, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Input, message, Row, Tag, Tooltip } from "antd"
import { BookPlus, Download, Search } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const SESSION_KEYS = {
  FILTERS: "curriculum-filters",
  PAGE: "curriculum-current-page",
}

const createDefaultFilters = (): FilterProps => ({
  searchText: "",
  trainingObjectTypes: undefined,
  trainingCourses: undefined,
  code: "",
  name: "",
  trainingTime: undefined,
  trainingMajorId: undefined,
  managementOrganizationId: undefined,
})

const getStoredFilters = (): FilterProps => {
  if (typeof window === "undefined") return createDefaultFilters()

  try {
    const saved = sessionStorage.getItem(SESSION_KEYS.FILTERS)
    if (!saved) return createDefaultFilters()

    const parsed = JSON.parse(saved)

    return {
      ...createDefaultFilters(),
      ...parsed,
    }
  } catch {
    return createDefaultFilters()
  }
}
const getStoredPage = (): number => {
  if (typeof window === "undefined") return 1

  try {
    const saved = sessionStorage.getItem(SESSION_KEYS.PAGE)
    const p = Number(saved)

    return Number.isInteger(p) && p > 0 ? p : 1
  } catch {
    return 1
  }
}

const persistState = (filters: FilterProps, page: number) => {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SESSION_KEYS.FILTERS, JSON.stringify(filters))
    sessionStorage.setItem(SESSION_KEYS.PAGE, String(page))
  } catch (e) {}
}

export default function TrainingProgramCatalog() {
  const { can } = useAbility()
  const [expandAll, setExpandAll] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const router = useRouter()
  const { data: me } = useSession()
  const donViId = me?.sDM_DonViId || ""
  const [currentPage, setCurrentPage] = useState(() => getStoredPage())
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>(() => getStoredFilters())

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  useEffect(() => {
    const t = setTimeout(() => {
      persistState(filters, currentPage)
    }, 300)

    return () => clearTimeout(t)
  }, [filters, currentPage])

  const isApprove = can(
    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
    "DUYET"
  )
  const isViewAll = can(
    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
    "XEM_TAT_CA"
  )

  const where = useMemo(() => {
    const curriculumVersionFilter = {
      ...(!isViewAll && {
        organizationId: donViId,
      }),
      ...(filters.name && {
        name: { contains: filters.name, mode: "insensitive" as const },
      }),
      ...(filters.code && {
        code: { contains: filters.code, mode: "insensitive" as const },
      }),
      ...(filters.trainingCourses &&
        filters.trainingCourses.length > 0 && {
          fixedClass: {
            trainingCourseId: { in: filters.trainingCourses },
          },
        }),
      ...(filters.trainingTime && {
        trainingTimeId: { in: filters.trainingTime },
      }),
      ...(filters.requiredCredits
        ? {
            requiredCredits: {
              ...(filters.requiredCredits.gte
                ? {
                    gte: Number(filters.requiredCredits.gte),
                  }
                : {}),
              ...(filters.requiredCredits.lte
                ? {
                    lte: Number(filters.requiredCredits.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.electiveCredits
        ? {
            electiveCredits: {
              ...(filters.electiveCredits.gte
                ? {
                    gte: Number(filters.electiveCredits.gte),
                  }
                : {}),
              ...(filters.electiveCredits.lte
                ? {
                    lte: Number(filters.electiveCredits.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.numberOfSemesters
        ? {
            numberOfSemesters: {
              ...(filters.numberOfSemesters.gte
                ? {
                    gte: Number(filters.numberOfSemesters.gte),
                  }
                : {}),
              ...(filters.numberOfSemesters.lte
                ? {
                    lte: Number(filters.numberOfSemesters.lte),
                  }
                : {}),
            },
          }
        : {}),
    } satisfies Prisma.CurriculumVersionWhereInput

    return {
      deletedAt: null,
      trainingObjectTypeId,
      ...(filters.managementOrganizationId && {
        managementOrganizationId: filters.managementOrganizationId,
      }),
      ...(filters.trainingMajorId && {
        trainingMajorId: filters.trainingMajorId,
      }),
      ...(filters.searchText && {
        OR: [
          {
            code: {
              contains: filters.searchText,
              mode: "insensitive" as const,
            },
          },
          {
            name: {
              contains: filters.searchText,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
      ...(Object.keys(curriculumVersionFilter).length > 0 && {
        curriculumVersion: { some: curriculumVersionFilter },
      }),
    }
  }, [trainingObjectTypeId, filters, donViId, isViewAll])

  const { data = [] } = useFindManyCurriculum({
    where,
    select: {
      id: true,
      active: true,
      code: true,
      name: true,
      managementOrganization: { select: { sTen: true } },
      trainingMajor: { select: { name: true } },
      curriculumVersion: {
        where: {
          ...(filters.name
            ? {
                name: {
                  contains: filters.name,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.code
            ? {
                code: {
                  contains: filters.code,
                  mode: "insensitive",
                },
              }
            : {}),
          trainingObjectTypeId,
          ...(filters.trainingCourses && filters.trainingCourses.length > 0
            ? {
                fixedClass: {
                  trainingCourseId: {
                    in: filters.trainingCourses,
                  },
                },
              }
            : {}),
          ...(filters.trainingTime
            ? {
                trainingTimeId: {
                  in: filters.trainingTime,
                },
              }
            : {}),
        },
        select: {
          id: true,
          active: true,
          curriculumId: true,
          type: true,
          code: true,
          name: true,
          isLock: true,
          requiredCredits: true,
          electiveCredits: true,
          trainingTime: true,
          numberOfSemesters: true,
          yearCreation: true,
          yearApplication: true,
          description: true,
          trainingBlocks: {
            select: {
              subjects: {
                select: {
                  subject: { select: { credit: true } },
                },
              },
            },
          },
          trainingObjectType: true,
          documentFiles: true,
          fixedClass: {
            include: {
              trainingCourse: true,
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const sortedCurriculumData = useMemo(() => {
    const hasFrameworkVersion = (
      curriculumVersion: {
        type?: CurriculumVersionType
      }[] = []
    ) => curriculumVersion.some((version) => version.type === CurriculumVersionType.FRAMEWORK)

    return [...data]
      .map((curriculum) => ({
        ...curriculum,
        curriculumVersion: [...(curriculum.curriculumVersion || [])].sort((a, b) => {
          const aPriority = a.type === CurriculumVersionType.FRAMEWORK ? 0 : 1
          const bPriority = b.type === CurriculumVersionType.FRAMEWORK ? 0 : 1

          if (aPriority !== bPriority) return aPriority - bPriority

          return (a.name || "").localeCompare(b.name || "", "vi")
        }),
      }))
      .sort((a, b) => {
        const aPriority = hasFrameworkVersion(a.curriculumVersion) ? 0 : 1
        const bPriority = hasFrameworkVersion(b.curriculumVersion) ? 0 : 1

        if (aPriority !== bPriority) return aPriority - bPriority

        return (a.name || "").localeCompare(b.name || "", "vi")
      })
  }, [data])

  const { data: count } = useCountCurriculum({ where })
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    where: {
      trainingObjectTypeId,
      active: true,
      deletedAt: null,
    },
  })

  const { data: trainingTimeData = [] } = useFindManyTrainingTime({
    orderBy: { name: "asc" },
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
    where: trainingObjectTypeId ? { trainingObjectTypes: { some: { trainingObjectTypeId } } } : {},
  })

  const { onOpen: onOpenCurriculum } = useDisclosure<string>({
    tag: "PutCurriculum",
  })

  const { onOpen: onOpenCurriculumVersion } = useDisclosure<{
    curriculumId: string
    versionId: string
    isFramework?: boolean
  }>({
    tag: "PutCurriculumVersion",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpenCurriculum()
  }
  const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
  async function handleDeleteCurriculum(id: string) {
    try {
      showSpinner()
      await updateCurriculum({
        where: { id },
        data: { deletedAt: new Date() },
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

  const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()
  async function handleDeleteCurriculumVersion(id: string) {
    try {
      showSpinner()
      await updateCurriculumVersion({
        where: { id },
        data: { deletedAt: new Date() },
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

  const handleToggleLock = async (id: string, isLocked: boolean) => {
    try {
      showSpinner()
      await updateCurriculumVersion({
        where: { id },
        data: { isLock: !isLocked },
      })
      message.success(isLocked ? "Mở khoá thành công" : "Khoá thành công")
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleRowClick = (record: { id?: string }) => {
    if (
      record?.id &&
      can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
        "XEM_CHI_TIET"
      )
    ) {
      router.push(
        ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO_ID.replace(
          "[id]",
          record.id || ""
        )
      )
    }
  }

  const { onOpen: onOpenChuyenCTDT } = useDisclosure<{ id: string }>({
    tag: "ModalChuyenCTDT",
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={18}>
              <Flex>
                <Col span={6}>
                  <Input
                    id="search"
                    value={filters.searchText}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        searchText: e.target.value,
                      })
                    }
                    className="py-0"
                    placeholder="Tìm kiếm chương trình đào tạo"
                    prefix={
                      <Search
                        size={15}
                        style={{
                          color: "rgba(0, 0, 0, 0.25)",
                        }}
                      />
                    }
                    allowClear
                  />
                </Col>
                <Col span={6}>
                  <Select
                    className="w-full"
                    value={filters.trainingCourses}
                    placeholder="Chọn khoá đào tạo"
                    options={trainingCourseData.map((i) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    onChange={(val) => {
                      setFilters({
                        ...filters,
                        trainingCourses: val,
                      })
                    }}
                    mode="multiple"
                    allowClear
                  />
                </Col>
                <Col span={6}>
                  <Select
                    className="w-full"
                    value={filters.trainingMajorId}
                    placeholder="Chọn chuyên ngành đào tạo"
                    options={trainingMajorData.map((i: TrainingMajor) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        ?.toLowerCase()
                        ?.includes(input?.toLowerCase())
                    }
                    onChange={(val) =>
                      setFilters({
                        ...filters,
                        trainingMajorId: val,
                      })
                    }
                    allowClear
                  />
                </Col>
              </Flex>
            </Col>
            <Col span={6}>
              <Flex justify="end" className="gap-2">
                <Button
                  onClick={() => {
                    if (expandAll) {
                      setExpandedKeys([])
                    } else {
                      setExpandedKeys(sortedCurriculumData.map((d) => d.id))
                    }
                    setExpandAll(!expandAll)
                  }}
                >
                  {expandAll ? "Thu gọn" : "Mở rộng"}
                </Button>
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                  "THEM"
                ) && (
                  <>
                    <Button href={getMinioUrl("mta/template/MAU-NHAP_CTDT.xlsx")} type="primary">
                      <Download />
                      Mẫu nhập CTĐT
                    </Button>
                    <Button onClick={handleModal} type="primary">
                      <BookPlus />
                      Thêm CTĐT
                    </Button>
                  </>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <TableCollapse
            rowKey="key"
            id="version-category"
            headerTitleKey={({ code, name, managementOrganization, trainingMajor }) => {
              const displayText = [code, name, managementOrganization?.sTen, trainingMajor?.name]
                .filter(Boolean)
                .join(" - ")

              const tooltipContent = (
                <div>
                  {code && (
                    <div>
                      <strong>Mã:</strong> {code}
                    </div>
                  )}
                  {name && (
                    <div>
                      <strong>Tên:</strong> {name}
                    </div>
                  )}
                  {managementOrganization?.sTen && (
                    <div>
                      <strong>Đơn vị quản lý:</strong> {managementOrganization.sTen}
                    </div>
                  )}
                  {trainingMajor?.name && (
                    <div>
                      <strong>Chuyên ngành đào tạo:</strong> {trainingMajor.name}
                    </div>
                  )}
                </div>
              )

              return (
                <Tooltip title={tooltipContent} placement="top">
                  <span className="truncate inline-flex items-center gap-2 align-middle rounded px-2">
                    <span>Khung: {displayText}</span>
                  </span>
                </Tooltip>
              )
            }}
            childrenFieldName="curriculumVersion"
            currentPage={currentPage}
            expandable={{
              expandedRowKeys: expandedKeys,
              onExpand: (expanded, record) => {
                setExpandedKeys((prev) =>
                  expanded ? [...prev, record.id] : prev.filter((k) => k !== record.id)
                )
              },
            }}
            onRowClick={(record) => handleRowClick(record)}
            rowClassName={(record) => {
              const row = record as { $type?: "parent" | "child"; type?: CurriculumVersionType }

              if (row.$type === "child" && row.type === CurriculumVersionType.FRAMEWORK) {
                return "framework-curriculum-version-row"
              }

              return ""
            }}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "Mã CTĐT",
                dataIndex: "code",
                align: "center",
                fixed: "left",
                width: 150,
                type: "input",
              },
              {
                title: "Tên chương trình đào tạo",
                dataIndex: "name",
                fixed: "left",
                width: 300,
                type: "input",
              },
              {
                title: "Khoá",
                align: "center",
                width: 120,
                render: (__, record) => {
                  return record?.fixedClass?.trainingCourse?.name
                },
              },
              {
                title: <Tooltip title="Tổng số tín chỉ">Số tín chỉ</Tooltip>,
                align: "center",
                width: 90,
                render: ({ trainingBlocks = [] }) => {
                  const totalCredit = trainingBlocks.reduce(
                    (
                      total: number,
                      block: {
                        subjects?: {
                          subject: { credit?: number }
                        }[]
                      }
                    ) => {
                      const blockCredit =
                        block?.subjects?.reduce(
                          (
                            sum: number,
                            {
                              subject,
                            }: {
                              subject: {
                                credit?: number
                              }
                            }
                          ) => sum + (subject?.credit || 0),
                          0
                        ) || 0
                      return total + blockCredit
                    },
                    0
                  )

                  return totalCredit
                },
              },
              {
                title: <Tooltip title="Số tín chỉ bắt buộc">Số tín chỉ (Bắt buộc)</Tooltip>,
                dataIndex: "requiredCredits",
                align: "center",
                type: "cmp",
                distinctFilters: ["requiredCredits"],
                width: 90,
              },
              {
                title: <Tooltip title="Số tín chỉ tự chọn">Số tín chỉ (Tự chọn)</Tooltip>,
                align: "center",
                type: "cmp",
                width: 90,
                dataIndex: "electiveCredits",
                distinctFilters: ["electiveCredits"],
              },
              {
                title: <Tooltip title="Số học kỳ">Số HK</Tooltip>,
                dataIndex: "numberOfSemesters",
                align: "center",
                type: "cmp",
                distinctFilters: ["numberOfSemesters"],
                width: 90,
              },
              {
                title: <Tooltip title="Thời gian đào tạo">TGĐT</Tooltip>,
                dataIndex: "trainingTime",
                align: "center",
                width: 100,
                type: "select",
                options: trainingTimeData.map((i: TrainingTime) => ({
                  value: i.id,
                  label: i.name,
                })),
                render: (value: TrainingTime) => (value?.name ? value.name : ""),
              },
              {
                title: <Tooltip title="Năm khởi tạo">Năm KT</Tooltip>,
                dataIndex: "yearCreation",
                align: "center",
                width: 90,
              },
              {
                title: <Tooltip title="Năm áp dụng">Năm AD</Tooltip>,
                dataIndex: "yearApplication",
                align: "center",
                width: 90,
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                align: "center",
                width: 200,
                render: (value) => <span className="line-clamp-1">{value}</span>,
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 100,
                fixed: "right",
                render: (_, record) => {
                  return !record?.active ? (
                    <Tag color="error">Không hoạt động</Tag>
                  ) : (
                    <Tag color="success">Đang hoạt động</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 150,
                fixed: "right",
                align: "center",
                // hidden: !canSome(
                //     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                //     'XEM_CHI_TIET',
                //     'THEM',
                //     'SUA',
                //     'XOA'
                // ),
                render: (_, record) => {
                  if (record?.id) {
                    const isLocked = record?.isLock

                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                          "XEM_CHI_TIET"
                        ) && (
                          <Tooltip title="Chỉnh sửa nội dung" placement="top">
                            <HighlightOutlined size={16} className="text-base cursor-pointer" />
                          </Tooltip>
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                          "THEM"
                        ) && (
                          <CopyPlusIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenChuyenCTDT({ id: record.id })
                            }}
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                          "SUA"
                        ) && (
                          <EditIcon
                            title="Sửa thông tin chung"
                            disabled={isLocked}
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenCurriculumVersion({
                                curriculumId: record.curriculumId,
                                versionId: record?.id,
                              })
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {/* TODO: CẦN THÊM MỘT QUYỀN ĐỂ LOCK/UNLOCK*/}
                        {isApprove && (
                          <LockPlusIcon
                            isLocked={isLocked}
                            popConfirm={{
                              onConfirm: (e) => {
                                handleToggleLock(record?.id, record?.isLock || false)
                                e?.stopPropagation()
                              },
                              onCancel: (e) => {
                                e?.stopPropagation()
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            disabled={isLocked}
                            popConfirm={{
                              onConfirm: (e) => {
                                handleDeleteCurriculumVersion(record?.id)
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
                    )
                  }
                  return ""
                },
              },
            ]}
            headerRight={({ id, curriculumVersion = [] }) => {
              const hasFrameworkVersion = curriculumVersion.some(
                (version) => version.type === CurriculumVersionType.FRAMEWORK
              )

              return (
                <div className="flex gap-2.5 w-[85px] items-center">
                  {can(
                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                    "THEM"
                  ) &&
                    !hasFrameworkVersion && (
                      <CreateIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenCurriculumVersion({
                            curriculumId: id,
                            versionId: "",
                            isFramework: true,
                          })
                        }}
                        title="Thêm mới CTĐT khung"
                      />
                    )}
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                  "SUA"
                ) && (
                  <EditIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenCurriculum(id)
                    }}
                    className="text-sm text-blue-700 cursor-pointer"
                  />
                )}
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                  "XOA"
                ) && (
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: (e) => {
                        handleDeleteCurriculum(id)
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
              )
            }}
            data={sortedCurriculumData}
            scrollable
            maxHeight={"calc(100vh - 290px)"}
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
      <style>
        {`
          .framework-curriculum-version-row > td {
            background-color: #fef9c3 !important;
          }
        `}
      </style>
    </div>
  )
}

TrainingProgramCatalog.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
