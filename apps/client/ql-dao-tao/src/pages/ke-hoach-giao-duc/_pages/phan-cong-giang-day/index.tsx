import { formatThangIn } from "@workspace/libs/timezone"
import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import TreeSelectDepartment from "@components/commons/department-select/TreeSelectDepartment"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE, SUBJECT_CLASS_SCHEDULE_TYPE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { layGiangVienPhanCongThayDoi, thongBaoPhanCongGiangDay } from "@lib/thong-bao-giang-vien"
import { buildOrgFlat } from "@lib/utils"
import { emptyObjectIf } from "@workspace/constant"
import { $Enums, type Prisma, type SubjectClass } from "@workspace/db/client"
import {
  useCountDM_DonVi,
  useCountSubjectClass,
  useDeleteSubjectClass,
  useFindManyBuilding,
  useFindManyDM_DonVi,
  useFindManyTrainingLocation,
  useUpdateManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { whereOrganization } from "@workspace/libs/constants"
import { exportFromTemplate } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import {
  dayjs,
  useFixedClassStore,
  useSemesterStore,
  useTrainingCourseStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import {
  Affix,
  Button,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  message,
  Popover,
  Row,
  Switch,
  Tooltip,
  Modal,
  Radio,
} from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import {
  ActionsCell,
  AssignmentRowPaint,
  DeadlineCell,
  ExamTypeCell,
  FixedClassCodes,
  FormStateGate,
  LecturerCell,
  LecturerNameProvider,
  LocationCell,
  LockLecturerCell,
  RoomCell,
  ScheduleCell,
  SubjectNameCell,
  type TeachingAssignmentForm,
} from "@components/phan-cong-giang-day/assignment-cells"

const SCHEDULE_OPTIONS = Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(([key, value]) => ({
  label: value,
  value: key,
}))

const LECTURER_USER_PROFILE_SELECT = {
  id: true,
  code: true,
  fullname: true,
  academicRankType: true,
  academicDegreeType: true,
} as const

type BaoDayForm = {
  deadline: string
  isOverride: boolean
}

type XepKhuVucForm = {
  trainingCourseId?: string
  trainingLocationId?: string
  schedule?: $Enums.SubjectClassSchedule
  isOverride: boolean
}

type FilterStatus = "YEU_CAU_PCGD" | "LMH_DA_HUY" | "CHO_DUYET_PCGD" | "DA_DUYET_PCGD"

type CopyFields = {
  lecturerId: boolean
  extraLecturerId: boolean
  enterGradeLecturerId: boolean
}

export default function PhanCongGiangDay({
  type,
  khoaBoMon = false,
  role,
}: {
  type?: $Enums.SubjectClassType
  khoaBoMon?: boolean
  role?: "P2_QLDT" | "P2_KHCT"
}) {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    lecturerId: undefined,
    maxStudent: undefined,
    subjectClassStudent: undefined,
    mainLecturer: undefined,
    extraLecturer: undefined,
    enterGradeLecturer: undefined,
    examType: undefined,
    room: undefined,
    managementOrganizationId: undefined,
  })

  const [filterStatus, setFilterStatus] = useState<FilterStatus>()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportGroupType, setExportGroupType] = useState<"department" | "faculty">("faculty")

  const [copySourceId, setCopySourceId] = useState<string | null>(null)
  const [copyFields, setCopyFields] = useState<CopyFields>({
    lecturerId: true,
    extraLecturerId: true,
    enterGradeLecturerId: true,
  })

  const [form] = Form.useForm<TeachingAssignmentForm>()

  const [selectionVersion, setSelectionVersion] = useState(0)

  const [formBaoDay] = Form.useForm<BaoDayForm>()
  const [formXepKhuVuc] = Form.useForm<XepKhuVucForm>()

  const { id: semesterId } = useSemesterStore()
  const { options, getExamTypeLabel } = useExamTypeOptions()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()
  const { id: fixedClassId } = useFixedClassStore()
  const canXemTatCa = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, "XEM_TAT_CA")
  const orgId = window.contextData?.organizationId
  const where = useMemo(
    () =>
      ({
        ...(filters?.name
          ? { name: { contains: filters.name, mode: "insensitive" as const } }
          : {}),
        ...(filters?.code
          ? { code: { contains: filters.code, mode: "insensitive" as const } }
          : {}),
        ...(filters?.examType ? { examType: { in: filters.examType } } : {}),
        ...(filters?.schedule ? { schedule: { in: filters.schedule } } : {}),
        ...(semesterId ? { semester: { id: semesterId } } : {}),
        ...(filters.lecturerId?.length === 1
          ? filters.lecturerId[0]
            ? { lecturerId: { not: null } }
            : { lecturerId: null }
          : {}),
        ...(filters.mainLecturer
          ? {
              mainLecturer: {
                userProfile: filters.mainLecturer
                  ? {
                      fullname: {
                        contains: filters.mainLecturer,
                        mode: "insensitive" as const,
                      },
                    }
                  : {},
              },
            }
          : {}),
        ...(filters.extraLecturer
          ? {
              extraLecturer: {
                userProfile: filters.extraLecturer
                  ? {
                      fullname: {
                        contains: filters.extraLecturer,
                        mode: "insensitive" as const,
                      },
                    }
                  : {},
              },
            }
          : {}),
        ...(filters.room
          ? {
              room: {
                building: {
                  trainingLocation: {
                    name: {
                      contains: filters.room,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            }
          : {}),
        ...(filters.organization && filters.organization.length > 0
          ? {
              subject: {
                subject: {
                  managementOrganizationId: {
                    in: filters.organization,
                  },
                },
              },
            }
          : {}),
        ...(trainingCourseId && type === "NORMAL"
          ? { fixedClasses: { some: { trainingCourseId } } }
          : {}),
        ...(fixedClassId ? { fixedClasses: { some: { id: fixedClassId } } } : {}),
        deletedAt: null,
        active: true,
        trainingObjectTypeId,
        ...(khoaBoMon
          ? {
              lecturerAssignmentDeadline: {
                not: null,
              },
            }
          : {}),
        type: type,
        ...(filterStatus === "CHO_DUYET_PCGD"
          ? {
              submitLecturerAssignmentAt: {
                not: null,
              },
            }
          : filterStatus === "YEU_CAU_PCGD"
            ? {
                OR: [
                  { lecturerId: null },
                  { extraLecturerId: null },
                  { enterGradeLecturerId: null },
                ],
              }
            : filterStatus === "DA_DUYET_PCGD"
              ? {
                  approveLecturerAssignmentAt: {
                    not: null,
                  },
                }
              : filterStatus === "LMH_DA_HUY"
                ? { cancelled: true }
                : {}),
      }) satisfies Prisma.SubjectClassWhereInput,
    [
      filters,
      semesterId,
      trainingObjectTypeId,
      trainingCourseId,
      fixedClassId,
      khoaBoMon,
      type,
      filterStatus,
    ]
  )

  const { data: dmDonViIds = [] } = useFindManyDM_DonVi(
    {
      select: { Id: true, sParentId: true },
      where: whereOrganization,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    { refetchOnWindowFocus: false }
  )

  const orgIds = useMemo(
    () =>
      [
        ...buildOrgFlat(
          dmDonViIds.map((e) => ({
            Id: e.Id,
            sTen: null,
            sParentId: e.sParentId,
            sMa: null,
          })),
          orgId || "0"
        ).map((org) => org.value),
        orgId,
      ].filter(Boolean),
    [dmDonViIds, orgId]
  )

  const { data: dmDonViData = [], refetch } = useFindManyDM_DonVi(
    {
      include: {
        subjects: {
          include: {
            subjectVersion: {
              include: {
                subjectClass: {
                  where,
                  include: {
                    subject: {
                      select: {
                        name: true,
                        credit: true,
                        managementOrganizationId: true,
                        subject: {
                          select: {
                            managementOrganization: {
                              select: { sMa: true },
                            },
                          },
                        },
                      },
                    },
                    mainLecturer: {
                      include: {
                        userProfile: {
                          select: LECTURER_USER_PROFILE_SELECT,
                        },
                      },
                    },
                    extraLecturer: {
                      include: {
                        userProfile: {
                          select: LECTURER_USER_PROFILE_SELECT,
                        },
                      },
                    },
                    enterGradeLecturer: {
                      include: {
                        userProfile: {
                          select: LECTURER_USER_PROFILE_SELECT,
                        },
                      },
                    },
                    _count: {
                      select: {
                        subjectClassStudent: true,
                      },
                    },
                    trainingLocation: {
                      select: { name: true },
                    },
                    subjectClassStudent: {
                      where: { examScore: { not: null } },
                      take: 1,
                      select: { id: true },
                    },
                    subjectClassHistory: {
                      where: { isLockLecturer: { not: null } },
                      orderBy: { createdAt: "desc" },
                      take: 1,
                      select: {
                        isLockLecturer: true,
                        createdAt: true,
                        updatedBy: { select: { fullname: true } },
                      },
                    },
                    fixedClasses: {
                      select: {
                        code: true,
                      },
                    },
                  },
                  orderBy: [
                    ...emptyObjectIf(
                      [
                        {
                          maxStudent: filters.maxStudent,
                        },
                      ],
                      !!filters.maxStudent
                    ),
                    ...emptyObjectIf(
                      [
                        {
                          subjectClassStudent: {
                            _count: filters.subjectClassStudent,
                          },
                        },
                      ],
                      !!filters.subjectClassStudent
                    ),
                    {
                      code: "asc",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
      where: {
        bActive: true,
        subjects: {
          some: {
            subjectVersion: {
              some: {
                subjectClass: {
                  some: {
                    ...where,
                  },
                },
              },
            },
          },
        },
        ...(!khoaBoMon ? {} : { Id: { in: orgIds } }),
        ...whereOrganization,
      },
    },
    {
      enabled: !!semesterId && !!trainingObjectTypeId,
      refetchOnWindowFocus: false,
    }
  )

  const { data: countSubjectClassOfficial = 0 } = useCountSubjectClass({
    where: {
      status: "OFFICIAL",
      trainingObjectTypeId,
      semesterId,
      active: true,
      deletedAt: null,
      cancelled: false,
      type: type,
      ...(trainingCourseId && type === "NORMAL"
        ? { fixedClasses: { some: { trainingCourseId } } }
        : {}),
    },
  })

  const { data: countSubjectClass = 0 } = useCountSubjectClass({
    where: {
      trainingObjectTypeId,
      semesterId,
      active: true,
      deletedAt: null,
      cancelled: false,
      type: type,
      ...(trainingCourseId && type === "NORMAL"
        ? { fixedClasses: { some: { trainingCourseId } } }
        : {}),
    },
  })

  const { data: count } = useCountDM_DonVi({
    where: {
      bActive: true,
      subjects: {
        some: { subjectVersion: { some: { subjectClass: { some: where } } } },
      },
      Id: !khoaBoMon ? undefined : { in: orgIds },
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { showSpinner, hideSpinner } = useSpinner()

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const { mutateAsync: updateManySubjectClass } = useUpdateManySubjectClass()

  function handleCopyApply() {
    if (!copySourceId || selectedRowKeys.length === 0) return

    const subjectClassMap = form.getFieldValue("subjectClass") || {}
    const sourceData = subjectClassMap[copySourceId]
    if (!sourceData) {
      message.warning("Không tìm thấy dữ liệu dòng nguồn")
      return
    }
    const overwriteRows = selectedRowKeys.filter((destId) => {
      const id = destId as string
      if (id === copySourceId || subjectClassMap[id]?.cancelled) return false
      const dest = subjectClassMap[id]
      if (!dest) return false
      return (
        (copyFields.lecturerId && !!dest.lecturerId) ||
        (copyFields.extraLecturerId && !!dest.extraLecturerId) ||
        (copyFields.enterGradeLecturerId && !!dest.enterGradeLecturerId)
      )
    })

    if (overwriteRows.length > 0) {
      const overwriteCodes = overwriteRows
        .map(
          (id) => dataWithRowSpan.flatMap((e) => e.children).find((c) => c.id === id)?.code || id
        )
        .join(", ")

      Modal.confirm({
        title: "Xác nhận áp dụng phân công",
        content: (
          <span>
            Lớp : <b>{overwriteCodes}</b> đã được phân công giảng viên
            <br />
            Bạn có chắc chắn muốn tiếp tục?
          </span>
        ),
        okText: "Thay thế",
        okButtonProps: { type: "primary" },
        cancelText: "Hủy",
        onOk: () => applyCopy(),
      })
      return
    }

    applyCopy()
  }

  function applyCopy() {
    const subjectClassMap = form.getFieldValue("subjectClass") || {}
    const sourceData = subjectClassMap[copySourceId!]
    const updated = { ...subjectClassMap }

    selectedRowKeys.forEach((destId) => {
      const id = destId as string
      if (id === copySourceId || updated[id]?.cancelled) return

      updated[id] = {
        ...updated[id],
        ...(copyFields.lecturerId ? { lecturerId: sourceData.lecturerId } : {}),
        ...(copyFields.extraLecturerId ? { extraLecturerId: sourceData.extraLecturerId } : {}),
        ...(copyFields.enterGradeLecturerId
          ? { enterGradeLecturerId: sourceData.enterGradeLecturerId }
          : {}),
        isEdit: true,
      }
    })

    form.setFieldValue("subjectClass", updated)
    setSelectionVersion((value) => value + 1)

    const appliedCount = selectedRowKeys.filter((id) => id !== copySourceId).length
    message.success(`Đã copy phân công GV vào ${appliedCount} lớp. Nhấn "Lưu" để ghi vào hệ thống.`)

    setCopySourceId(null)
    setCopyFields({ lecturerId: true, extraLecturerId: true, enterGradeLecturerId: true })
  }
  const handleCopyCancel = useCallback(() => {
    setCopySourceId(null)
    setCopyFields({ lecturerId: true, extraLecturerId: true, enterGradeLecturerId: true })
    setSelectedRowKeys([])
  }, [])

  const handleCopyToggle = useCallback((id: string) => {
    setCopySourceId((prev) => {
      if (prev === id) {
        setCopyFields({ lecturerId: true, extraLecturerId: true, enterGradeLecturerId: true })
        setSelectedRowKeys([])
        return null
      }
      setSelectedRowKeys([])
      return id
    })
  }, [])

  const p2GuiBaoDay = async (values: BaoDayForm) => {
    try {
      showSpinner()
      await updateManySubjectClass({
        data: {
          lecturerAssignmentDeadline: dayjs(values.deadline).endOf("day").toDate(),
          sendLecturerAssignmentAt: new Date(),
        },
        where: {
          trainingObjectTypeId,
          semesterId,
          ...(values.isOverride ? {} : { lecturerAssignmentDeadline: null }),
          type: type,
        },
      })
      message.success("Báo dạy thành công")
      debouncedRefetch()
      formBaoDay.resetFields()
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data: trainingLocationData = [] } = useFindManyTrainingLocation({
    orderBy: { name: "asc" },
    where: { deletedAt: null, active: true },
  })

  const { data: buildingData = [] } = useFindManyBuilding({
    orderBy: { name: "asc" },
    where: { deletedAt: null, active: true },
    include: {
      rooms: {
        where: {
          deletedAt: null,
          active: true,
        },
      },
    },
  })

  const trainingLocationOptions = useMemo(
    () => trainingLocationData.map((e) => ({ label: e.name, value: e.id })),
    [trainingLocationData]
  )

  const roomCapacityById = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const building of buildingData) {
      for (const room of building.rooms) {
        map.set(room.id, room.capacity ?? null)
      }
    }
    return map
  }, [buildingData])

  const buildingTreeByLocationId = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const building of buildingData) {
      const locationId = building.trainingLocationId
      if (!locationId) continue
      if (!map[locationId]) map[locationId] = []
      map[locationId].push({
        title: building.name,
        label: building.name,
        value: building.id,
        selectable: false,
        children: building.rooms.map((room) => ({
          title: (
            <span>
              {room.name} - Sức chứa: {room.capacity}
            </span>
          ),
          label: room.name,
          filterValue: room.name,
          value: room.id,
          selectable: true,
        })),
      })
    }
    return map
  }, [buildingData])

  async function handleP2LuuKeHoach() {
    try {
      showSpinner()
      const subjectClassMap = form.getFieldValue("subjectClass") || {}
      const banGhiSua = (
        Object.entries(subjectClassMap) as [
          string,
          NonNullable<TeachingAssignmentForm["subjectClass"]>[string],
        ][]
      ).filter(([_, sc]) => sc.isEdit)
      const lopGoc = dataWithRowSpan.flatMap((e) => e.children)

      const res = await sqlTransaction(
        banGhiSua.map(([id, subjectClass]: any) => ({
          model: "SubjectClass",
          operation: "update",
          data: {
            where: { id },
            data: {
              schedule: subjectClass.schedule,
              lecturerAssignmentDeadline: subjectClass.lecturerAssignmentDeadline
                ? subjectClass.lecturerAssignmentDeadline?.toDate()
                : null,
              lecturerId: subjectClass.lecturerId ?? null,
              extraLecturerId: subjectClass.extraLecturerId ?? null,
              enterGradeLecturerId: subjectClass.enterGradeLecturerId ?? null,
              examType: subjectClass.examType ?? null,
              roomId: subjectClass.roomId ?? null,
              trainingLocationId: subjectClass.trainingLocationId ?? null,
              maxStudent: subjectClass.maxStudent ?? null,
              isLockLecturer: subjectClass.isLockLecturer ?? true,
            },
          },
        }))
      )
      if (res.status !== 200) {
        throw new Error("Lỗi khi phân công giảng dạy")
      }

      for (const [id, subjectClass] of banGhiSua) {
        const goc = lopGoc.find((item) => item.id === id)
        const gvMoi = layGiangVienPhanCongThayDoi(
          { lecturerId: goc?.lecturerId, extraLecturerId: goc?.extraLecturerId },
          {
            lecturerId: subjectClass.lecturerId,
            extraLecturerId: subjectClass.extraLecturerId,
          }
        )
        if (gvMoi.length) {
          await thongBaoPhanCongGiangDay([id], gvMoi)
        }
      }

      debouncedRefetch()
      message.success("Phân công giảng dạy thành công")
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  async function handleKhoaBoMonLuuPCGD() {
    try {
      showSpinner()
      const subjectClassMap = form.getFieldValue("subjectClass") || {}
        const banGhiSua = (
          Object.entries(subjectClassMap) as [
            string,
            NonNullable<TeachingAssignmentForm["subjectClass"]>[string],
          ][]
        ).filter(([_, sc]) => sc.isEdit)
      const lopGoc = dataWithRowSpan.flatMap((e) => e.children)

      const res = await sqlTransaction(
        banGhiSua.map(([id, subjectClass]: any) => ({
          model: "SubjectClass",
          operation: "update",
          data: {
            where: { id },
            data: {
              schedule: subjectClass.schedule,
              examType: subjectClass.examType ?? null,
              roomId: subjectClass.roomId ?? null,
              maxStudent: subjectClass.maxStudent ?? null,
              lecturerId: subjectClass.lecturerId ?? null,
              extraLecturerId: subjectClass.extraLecturerId ?? null,
              enterGradeLecturerId: subjectClass.enterGradeLecturerId ?? null,
              isLockLecturer: subjectClass.isLockLecturer ?? true,
            },
          },
        }))
      )
      if (res.status !== 200) {
        throw new Error("Lỗi khi lưu phân công giảng dạy")
      }

      for (const [id, subjectClass] of banGhiSua) {
        const goc = lopGoc.find((item) => item.id === id)
        const gvMoi = layGiangVienPhanCongThayDoi(
          { lecturerId: goc?.lecturerId, extraLecturerId: goc?.extraLecturerId },
          {
            lecturerId: subjectClass.lecturerId,
            extraLecturerId: subjectClass.extraLecturerId,
          }
        )
        if (gvMoi.length) {
          await thongBaoPhanCongGiangDay([id], gvMoi)
        }
      }

      debouncedRefetch()
      message.success("Lưu phân công giảng dạy thành công")
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  async function handleP2TuChoiPCGD() {
    try {
      showSpinner()
      await updateManySubjectClass({
        data: {
          submitLecturerAssignmentAt: null,
          enterGradeLecturerId: null,
          extraLecturerId: null,
          lecturerId: null,
        },
        where: {
          trainingObjectTypeId,
          semesterId,
          id: {
            in: selectedRowKeys as string[],
          },
        },
      })
      setSelectedRowKeys([])
      message.success("Đã từ chối PCGD")
      debouncedRefetch()
      formBaoDay.resetFields()
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  interface ExportOrgItem {
    sMa: string | null
    sTKBUCode: string | null
    Id: string
    sTen: string
    sParentId: string | null
  }

  interface ExportSemesterItem {
    semesterType: $Enums.SemesterType
    schoolYear: {
      startDate: Date | string
      endDate: Date | string
    }
  }

  interface ExportSubjectClassItem {
    submitLecturerAssignmentAt: Date | null
    sendLecturerAssignmentAt: Date | null
    schedule: string | null
    examType: $Enums.ExamType | null
    mainLecturer?: {
      userProfile?: {
        fullname: string
      } | null
    } | null
    subject: {
      code: string
      codeTkb?: string | null
      name: string
      credit: number
      period: number
      subject?: {
        managementOrganization?: {
          sTen: string
          sMa: string | null
          sTKBUCode: string | null
          sParentId: string | null
        } | null
      } | null
    }
    extraLecturer?: {
      userProfile?: {
        fullname: string
      } | null
    } | null
    fixedClasses: Array<{
      code: string
      _count: {
        students: number
      }
    }>
    _count?: {
      subjectClassStudent: number
    }
    room?: {
      code: string
      name: string
    } | null
    trainingLocation?: {
      name: string
    } | null
  }

  const handleExportExcel = async (groupType: "department" | "faculty") => {
    try {
      showSpinner()
      const res = await sqlTransaction([
        {
          model: "SubjectClass",
          operation: "findMany",
          data: {
            where,
            select: {
              submitLecturerAssignmentAt: true,
              schedule: true,
              examType: true,
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              subject: {
                select: {
                  code: true,
                  codeTkb: true,
                  name: true,
                  credit: true,
                  period: true,
                  subject: {
                    select: {
                      managementOrganization: {
                        where: {
                          bDeleted: false,
                        },
                        select: {
                          sTen: true,
                          sMa: true,
                          sTKBUCode: true,
                          sParentId: true,
                        },
                      },
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              fixedClasses: {
                select: {
                  code: true,
                  _count: {
                    select: {
                      students: {
                        where: {
                          deletedAt: null,
                          active: true,
                          status: "ENROLLED",
                        },
                      },
                    },
                  },
                },
              },
              _count: {
                select: {
                  subjectClassStudent: true,
                },
              },
              room: {
                select: {
                  code: true,
                  name: true,
                },
              },
              trainingLocation: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        {
          model: "Semester",
          operation: "findUnique",
          data: {
            where: { id: semesterId },
            select: {
              semesterType: true,
              schoolYear: {
                select: {
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
        {
          model: "DM_DonVi",
          operation: "findMany",
          data: {
            where: {
              bActive: true,
              bDeleted: false,
            },
            select: {
              sMa: true,
              sTKBUCode: true,
              Id: true,
              sTen: true,
              sParentId: true,
            },
          },
        },
      ])

      if (res.status !== 200) {
        throw new Error("Lỗi khi xuất PCGD")
      }

      const payload = res.data[0] as ExportSubjectClassItem[]
      const semesterPayload = res.data[1] as ExportSemesterItem
      const orgPayload = res.data[2] as ExportOrgItem[]

      const hocKy = (() => {
        if (semesterPayload.semesterType === $Enums.SemesterType.FIRST) return "1"
        if (semesterPayload.semesterType === $Enums.SemesterType.SECOND) return "2"
        if (semesterPayload.semesterType === $Enums.SemesterType.SUMMER) return "Hè"
        if (semesterPayload.semesterType === $Enums.SemesterType.FIRST_SUPPLEMENTARY) return "Phụ 1"
        if (semesterPayload.semesterType === $Enums.SemesterType.SECOND_SUPPLEMENTARY)
          return "Phụ 2"
        return ""
      })()

      const namHoc = (() => {
        const startYear = dayjs(semesterPayload.schoolYear.startDate).year()
        const endYear = startYear + 1
        return `${startYear} - ${endYear}`
      })()

      let groupedPayload: Record<string, ExportSubjectClassItem[]> = {}
      if (groupType === "faculty") {
        const getFacultyMa = (item: ExportSubjectClassItem) => {
          const deptMa = item?.subject?.subject?.managementOrganization?.sMa
          if (!deptMa) return "MTA"
          const dept = orgPayload.find((e) => e.sMa === deptMa)
          if (!dept) return "MTA"

          let current = dept
          while (current) {
            const parent = orgPayload.find((e) => e.Id === current.sParentId)
            if (!parent || parent.sTen?.includes("Học viện") || !parent.sParentId) {
              return current.sMa || current.Id || "MTA"
            }
            current = parent
          }
          return "MTA"
        }
        groupedPayload = Object.groupBy(payload, (item) => getFacultyMa(item)) as Record<
          string,
          any[]
        >
      } else {
        groupedPayload = Object.groupBy(
          payload,
          (item) => item?.subject?.subject?.managementOrganization?.sMa || "MTA"
        ) as Record<string, ExportSubjectClassItem[]>
      }

      exportFromTemplate({
        templateUrl: getMinioUrl("/mta/template/ke-hoach-dao-tao/bao-day.xlsx"),
        extension: "xls",
        fileName: `Bao_day_${dayjs().format("DD_MM_YYYY")}.xls`,
        fontFamily: "Tahoma",
        fontSize: 9,
        sheets: Object.entries(groupedPayload).map(([key, items = []]) => {
          const ngayGui = dayjs.unix(
            Math.min(
              ...items.map(
                (i) => dayjs(i.sendLecturerAssignmentAt).unix() ?? Number.POSITIVE_INFINITY
              )
            )
          )
          const ngayNhan = dayjs.unix(
            Math.max(
              ...items.map(
                (i) => dayjs(i.sendLecturerAssignmentAt).unix() ?? Number.NEGATIVE_INFINITY
              )
            )
          )

          let khoa: ExportOrgItem | undefined
          let boMon: ExportOrgItem | undefined
          let sheetName = "MTA"

          if (groupType === "faculty") {
            khoa = orgPayload.find((e) => e.sMa === key || e.Id === key)
            const parentOrg = orgPayload.find((e) => e.Id === khoa?.sParentId)
            boMon = khoa
            khoa = parentOrg
            sheetName = (boMon?.sTKBUCode || boMon?.sMa || boMon?.sTen || "MTA")
              .substring(0, 30)
              .replace(/[:\\/?*[\]]/g, "_")
          } else {
            boMon = orgPayload.find((e) => e.sMa === key)
            khoa = orgPayload.find((e) => e.Id === boMon?.sParentId)
            sheetName = `BM_${boMon?.sTKBUCode || boMon?.sMa}`
          }

          const itemBySubjectCode = Object.groupBy(
            items.filter((e) => e.fixedClasses.length > 0),
            (item) => item.subject.code
          )

          return {
            tableStartCell: {
              col: 1,
              row: 10,
            },
            data: {
              khoa: khoa?.sTen || "",
              bo_mon: boMon?.sTen || "",
              ngay_gui: `Ngày ${ngayGui.format("DD")} tháng ${formatThangIn(ngayGui.month() + 1)} năm ${ngayGui.format("YYYY")}`,
              ngay_nhan: `Ngày ${ngayNhan.format("DD")} tháng ${formatThangIn(ngayNhan.month() + 1)} năm ${ngayNhan.format("YYYY")}`,
              hoc_ky: hocKy,
              nam_hoc: namHoc,
            },
            rows: Object.entries(itemBySubjectCode).flatMap(
              ([_, subjectItems = []], idxOfSubject) => {
                return subjectItems.map((item, index) => {
                  const rowSpan = index === 0 ? subjectItems.length : 1
                  return {
                    cells: [
                      { value: idxOfSubject + 1, rowSpan, align: "center" },
                      {
                        value: item.subject?.codeTkb || item.subject?.code,
                        rowSpan,
                      },
                      { value: item.subject?.name, rowSpan },
                      { value: item.subject?.credit, rowSpan, align: "right" },
                      {
                        value: Math.floor((item.subject?.period ?? 0) / 15),
                        rowSpan,
                        align: "right",
                      },
                      { value: item.subject?.period ?? 0, rowSpan, align: "right" },
                      { value: subjectItems.length, rowSpan, align: "right" },
                      {
                        value: item.schedule
                          ? SUBJECT_CLASS_SCHEDULE_TYPE[
                              item.schedule as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                            ]
                          : "",
                        align: "center",
                      },
                      {
                        value: item._count?.subjectClassStudent ?? 0,
                      },
                      {
                        value: item.fixedClasses
                          .map((fc: { code: string; _count: { students: number } }) => fc?.code)
                          .join(", "),
                      },
                      { value: item.trainingLocation?.name ?? "" },
                      { value: item.mainLecturer?.userProfile?.fullname || "" },
                      {
                        value: item.extraLecturer?.userProfile?.fullname || "",
                      },
                      {
                        value: item.room ? item.room.code || item.room.name : "",
                      },
                      {
                        value: item.examType
                          ? getExamTypeLabel(item?.examType, {
                              exportPCGD: true,
                            })
                          : "",
                      },
                    ],
                  }
                })
              }
            ),
            sheet: sheetName,
          }
        }),
      })
      setIsExportModalOpen(false)
    } catch (error) {
    } finally {
      hideSpinner()
    }
  }

  async function handleP2DuyetPCGD() {
    try {
      showSpinner()
      const lopDuyetIds = selectedRowKeys as string[]
      await updateManySubjectClass({
        data: {
          approveLecturerAssignmentAt: new Date(),
        },
        where: {
          trainingObjectTypeId,
          semesterId,
          id: {
            in: lopDuyetIds,
          },
        },
      })
      await thongBaoPhanCongGiangDay(lopDuyetIds)
      setSelectedRowKeys([])
      message.success("Duyệt PCGD thành công")
      debouncedRefetch()
      formBaoDay.resetFields()
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        showSpinner()
        await deleteSubjectClass({ where: { id } })
      } catch (error: any) {
        if (error?.info?.message) {
          message.error(error?.info?.message)
        } else {
          message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
        }
      } finally {
        hideSpinner()
      }
    },
    [deleteSubjectClass]
  )

  const { onOpen: onOpenModalNhapTKB } = useDisclosure<{
    type?: $Enums.SubjectClassType
    trainingCourseId?: string
  }>({
    tag: "ModalNhapTKB",
  })

  const { onOpen: onOpenEditSubjectClass } = useDisclosure<{
    id: string
    mode: "edit" | "view"
  }>({
    tag: "PutOneSubjectClassModal",
  })
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: { name: "asc" },
    where: {
      deletedAt: null,
      active: true,
      trainingObjectTypeId,
    },
  })
  const dataWithRowSpan = useMemo(() => {
    if (dmDonViData) {
      const countSubjectClassBySubjectId: Record<string, number> = {}
      dmDonViData.forEach((dmDonVi) => {
        dmDonVi.subjects.forEach((subject) => {
          subject.subjectVersion.forEach((sv) => {
            sv.subjectClass.forEach((subjectClass) => {
              countSubjectClassBySubjectId[subjectClass.subjectId] =
                (countSubjectClassBySubjectId[subjectClass.subjectId] || 0) + 1
            })
          })
        })
      })

      const mapWithCount = dmDonViData.map((dmDonVi) => ({
        ...dmDonVi,
        id: dmDonVi.Id,
        children: dmDonVi.subjects.flatMap((subject) =>
          subject.subjectVersion.flatMap((sv) =>
            sv.subjectClass.map((subjectClass) => {
              const cloneCount = countSubjectClassBySubjectId[subjectClass.subjectId]
              countSubjectClassBySubjectId[subjectClass.subjectId] = 0
              return {
                ...subjectClass,
                rowSpan: cloneCount,
              }
            })
          )
        ),
      }))
      return mapWithCount
    }
    return []
  }, [dmDonViData])

  const resetForm = useCallback(() => {
    form.setFieldsValue({
      subjectClass: dataWithRowSpan
        .flatMap((e) => e.children)
        .reduce(
          (acc, curr) => {
            acc[curr.id] = {
              schedule: curr.schedule,
              lecturerId: curr.lecturerId ?? null,
              extraLecturerId: curr.extraLecturerId ?? null,
              enterGradeLecturerId: curr.enterGradeLecturerId ?? null,
              lecturerAssignmentDeadline: curr.lecturerAssignmentDeadline
                ? dayjs(curr.lecturerAssignmentDeadline)
                : null,
              examType: curr.examType,
              roomId: curr.roomId,
              trainingLocationId: curr.trainingLocationId ?? null,
              maxStudent: curr.maxStudent ?? null,
              isEdit: false,
              cancelled: !!curr.cancelled,
              isLockLecturer: curr.isLockLecturer ?? true,
            }
            return acc
          },
          {} as TeachingAssignmentForm["subjectClass"]
        ),
    })
  }, [dataWithRowSpan, form])

  useEffect(() => {
    if (resetForm) {
      resetForm()
      setSelectionVersion((value) => value + 1)
    }
  }, [resetForm])

  const canEditSubjectClass = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, "SUA")
  const canDeleteSubjectClass = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, "XOA")

  const handleEditSubjectClass = useCallback(
    (id: string) => {
      onOpenEditSubjectClass({ id, mode: "edit" })
    },
    [onOpenEditSubjectClass]
  )

  const handleTablePageChange = useCallback(
    (page: number, pageSize: number) => {
      if (numberOfPages === pageSize) {
        setCurrentPage(page)
      } else {
        setCurrentPage(1)
        setNumberOfPages(pageSize)
      }
    },
    [numberOfPages]
  )

  const pagination = useMemo(
    () => ({
      current: currentPage,
      pageSize: numberOfPages,
      total: count,
      onChange: handleTablePageChange,
    }),
    [count, currentPage, handleTablePageChange, numberOfPages]
  )

  const columns = useMemo(() => {
    const isDeadlinePassed = (deadline?: Date | string | null) =>
      !!khoaBoMon &&
      !!deadline &&
      dayjs(deadline).isBefore(dayjs().startOf("day"))

    const canShowLecturerSelect = (record: any) =>
      role === "P2_KHCT"
        ? true
        : !khoaBoMon
          ? true
          : !record?.submitLecturerAssignmentAt && !record?.approveLecturerAssignmentAt

    return [
      {
        title: "Hạn PCGD",
        width: 100,
        align: "center" as const,
        distinctFilters: [],
        render: (_: unknown, record: any) => (
          <DeadlineCell
            recordId={record.id}
            canEdit={canXemTatCa && !khoaBoMon}
            lecturerAssignmentDeadline={record.lecturerAssignmentDeadline}
            approveLecturerAssignmentAt={record.approveLecturerAssignmentAt}
          />
        ),
      },
      {
        title: "Mã LMH",
        width: 90,
        dataIndex: "code",
        align: "center" as const,
        type: "input" as const,
        render: (_: unknown, record: any) => (
          <>
            <AssignmentRowPaint
              recordId={record.id}
              submitLecturerAssignmentAt={record.submitLecturerAssignmentAt}
              approveLecturerAssignmentAt={record.approveLecturerAssignmentAt}
              isParent={record.$type === "parent"}
              copySourceId={copySourceId}
            />
            {record?.code || ""}
          </>
        ),
      },
      {
        title: "Tên môn",
        align: "center" as const,
        width: 220,
        dataIndex: "name",
        type: "input" as const,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
        }),
        render: (_: unknown, record: any) => (
          <SubjectNameCell name={record?.subject?.name} credit={record.subject?.credit} />
        ),
      },
      {
        title: "Kíp",
        align: "center" as const,
        width: 90,
        options: SCHEDULE_OPTIONS,
        render: (_: unknown, record: any) => (
          <ScheduleCell recordId={record.id} options={SCHEDULE_OPTIONS} />
        ),
      },
      {
        title: "Lớp QL",
        align: "center" as const,
        width: 100,
        render: (_: unknown, record: any) => <FixedClassCodes codes={record?.fixedClasses} />,
      },
      {
        title: "Số SV",
        width: 50,
        align: "center" as const,
        render: (_: unknown, record: any) => <p>{record?._count?.subjectClassStudent ?? 0}</p>,
      },
      {
        title: "Khóa GV",
        width: 80,
        align: "center" as const,
        render: (_: unknown, record: any) => {
          if (record.$type === "parent" || !record.id) return null
          const history = record.subjectClassHistory?.[0]
          const logText = history
            ? `${history.isLockLecturer ? "Khóa" : "Mở"} bởi: ${history.updatedBy?.fullname ?? "-"} lúc ${dayjs(history.createdAt).format("HH:mm DD/MM")}`
            : ""
          return <LockLecturerCell recordId={record.id} logText={logText} refetch={refetch} />
        },
      },
      {
        title: "Giảng viên 1",
        align: "center" as const,
        type: "input" as const,
        width: 200,
        dataIndex: "mainLecturer",
        render: (_: unknown, record: any) => (
          <LecturerCell
            recordId={record.id}
            field="lecturerId"
            ignoreField="extraLecturerId"
            organizationId={record?.subject?.managementOrganizationId ?? ""}
            lecturer={record?.mainLecturer}
            canShowSelect={canShowLecturerSelect(record)}
            deadlinePassed={isDeadlinePassed(record.lecturerAssignmentDeadline)}
          />
        ),
      },
      {
        title: "Giảng viên 2",
        align: "center" as const,
        dataIndex: "extraLecturer",
        type: "input" as const,
        width: 200,
        render: (_: unknown, record: any) => (
          <LecturerCell
            recordId={record.id}
            field="extraLecturerId"
            ignoreField="lecturerId"
            organizationId={record?.subject?.managementOrganizationId}
            lecturer={record?.extraLecturer}
            canShowSelect={canShowLecturerSelect(record)}
            deadlinePassed={isDeadlinePassed(record.lecturerAssignmentDeadline)}
          />
        ),
      },
      {
        title: "GV nhập điểm",
        dataIndex: "enterGradeLecturer",
        align: "center" as const,
        type: "input" as const,
        width: 200,
        render: (_: unknown, record: any) => (
          <LecturerCell
            recordId={record.id}
            field="enterGradeLecturerId"
            organizationId={record?.subject?.managementOrganizationId}
            lecturer={record?.enterGradeLecturer}
            canShowSelect={canShowLecturerSelect(record)}
            deadlinePassed={isDeadlinePassed(record.lecturerAssignmentDeadline)}
          />
        ),
      },
      {
        title: "Hình thức thi",
        align: "center" as const,
        width: 110,
        type: "select" as const,
        options: options,
        dataIndex: "examType",
        render: (_: unknown, record: any) => (
          <ExamTypeCell
            recordId={record.id}
            options={options}
            cancelled={record.cancelled}
            hasGradedStudent={(record.subjectClassStudent?.length ?? 0) > 0}
            khoaBoMon={!!khoaBoMon}
            submitLecturerAssignmentAt={record.submitLecturerAssignmentAt}
            deadlinePassed={isDeadlinePassed(record.lecturerAssignmentDeadline)}
            initialValue={getExamTypeLabel(record.examType)}
          />
        ),
      },
      {
        title: "Khu vực",
        align: "center" as const,
        width: 150,
        type: "input" as const,
        dataIndex: "room",
        render: (_: unknown, record: any) => (
          <LocationCell
            recordId={record.id}
            options={trainingLocationOptions}
            canEdit={!khoaBoMon}
            trainingLocationName={record.trainingLocation?.name}
          />
        ),
      },
      {
        title: "Phòng học",
        align: "center" as const,
        width: 150,
        render: (_: unknown, record: any) => (
          <RoomCell
            recordId={record.id}
            treeDataByLocation={buildingTreeByLocationId}
            cancelled={record.cancelled}
            khoaBoMon={!!khoaBoMon}
            submitLecturerAssignmentAt={record.submitLecturerAssignmentAt}
            deadlinePassed={isDeadlinePassed(record.lecturerAssignmentDeadline)}
          />
        ),
      },
      {
        title: <Tooltip title="Đơn vị phụ trách">ĐVPT</Tooltip>,
        width: 80,
        align: "center" as const,
        render: (_: unknown, record: any) =>
          record?.subject?.subject?.managementOrganization?.sMa || "",
      },
      ...(canXemTatCa && !khoaBoMon
        ? [
            {
              title: "Thao tác",
              width: 100,
              align: "center" as const,
              render: (_: unknown, record: SubjectClass) => (
                <ActionsCell
                  recordId={record?.id}
                  cancelled={record.cancelled}
                  status={record.status}
                  copySourceId={copySourceId}
                  canEdit={canEditSubjectClass}
                  canDelete={canDeleteSubjectClass}
                  onCopyToggle={handleCopyToggle}
                  onEdit={handleEditSubjectClass}
                  onDelete={handleDelete}
                />
              ),
            },
          ]
        : []),
    ]
  }, [
    buildingTreeByLocationId,
    canDeleteSubjectClass,
    canEditSubjectClass,
    canXemTatCa,
    copySourceId,
    handleCopyToggle,
    handleDelete,
    handleEditSubjectClass,
    khoaBoMon,
    options,
    refetch,
    role,
    trainingLocationOptions,
  ])

  return (
    <div>
      <Form
        form={form}
        onValuesChange={(changedValue) => {
          if (!changedValue.subjectClass) return
          const subjectClassId = Object.keys(changedValue.subjectClass)[0]
          const changedField = changedValue.subjectClass[subjectClassId]
          if (
            !subjectClassId ||
            Object.keys(changedField || {}).includes("submitLecturerAssignmentAt")
          ) {
            return
          }

          const current = form.getFieldValue(["subjectClass", subjectClassId]) || {}
          const newSubjectClassData = {
            ...current,
            ...changedField,
            isEdit: true,
          }

          if ("lecturerId" in changedField) {
            newSubjectClassData.enterGradeLecturerId = changedField.lecturerId
            if (
              changedField.lecturerId &&
              current?.extraLecturerId === changedField.lecturerId
            ) {
              newSubjectClassData.extraLecturerId = null
            }
          }

          if ("extraLecturerId" in changedField) {
            if (
              changedField.extraLecturerId &&
              current?.lecturerId === changedField.extraLecturerId
            ) {
              newSubjectClassData.lecturerId = null
            }
          }

          if ("trainingLocationId" in changedField) {
            newSubjectClassData.roomId = null
            newSubjectClassData.maxStudent = null
          }

          if ("roomId" in changedField) {
            newSubjectClassData.maxStudent = roomCapacityById.get(changedField.roomId) ?? null
          }

          form.setFieldValue(["subjectClass", subjectClassId], newSubjectClassData)
          if (
            "lecturerId" in changedField ||
            "enterGradeLecturerId" in changedField ||
            "cancelled" in changedField
          ) {
            setSelectionVersion((value) => value + 1)
          }
        }}
      >
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Affix offsetTop={105} style={{ zIndex: 1000 }}>
            <Flex justify="space-between" gap={4} className="bg-white py-1">
              <Col span={10}>
                {!khoaBoMon && (
                  <p className="mt-1">
                    Khoa/Viện/Bộ môn chỉ có thể nhìn thấy lớp môn học có hạn phân công giảng dạy.
                  </p>
                )}
                <Flex gap={2} className="px-1">
                  <Button
                    type={filterStatus === "YEU_CAU_PCGD" ? "primary" : "link"}
                    className="flex gap-1 items-center cursor-pointer px-1"
                    onClick={() => {
                      if (filterStatus === "YEU_CAU_PCGD") {
                        setFilterStatus(undefined)
                      } else {
                        setFilterStatus("YEU_CAU_PCGD")
                      }
                    }}
                  >
                    <p className="bg-slate-200 h-4 w-4 rounded" />
                    <span>Yêu cầu PCGD</span>
                  </Button>
                  <Button
                    type={filterStatus === "LMH_DA_HUY" ? "primary" : "link"}
                    className="flex gap-1 items-center cursor-pointer"
                    onClick={() => {
                      if (filterStatus === "LMH_DA_HUY") {
                        setFilterStatus(undefined)
                      } else {
                        setFilterStatus("LMH_DA_HUY")
                      }
                    }}
                  >
                    <p className="bg-red-200 h-4 w-4 rounded" />
                    <span>LMH đã huỷ</span>
                  </Button>
                  <Button
                    type={filterStatus === "CHO_DUYET_PCGD" ? "primary" : "link"}
                    className="flex gap-1 items-center cursor-pointer"
                    onClick={() => {
                      if (filterStatus === "CHO_DUYET_PCGD") {
                        setFilterStatus(undefined)
                      } else {
                        setFilterStatus("CHO_DUYET_PCGD")
                      }
                    }}
                  >
                    <p className="bg-yellow-200 h-4 w-4 rounded" />
                    <span>Chờ duyệt PCGD</span>
                  </Button>
                  <Button
                    type={filterStatus === "DA_DUYET_PCGD" ? "primary" : "link"}
                    className="flex gap-1 items-center"
                    onClick={() => {
                      filterStatus === "DA_DUYET_PCGD"
                        ? setFilterStatus(undefined)
                        : setFilterStatus("DA_DUYET_PCGD")
                    }}
                  >
                    <p className="bg-green-200 h-4 w-4 rounded " />
                    <span>Đã duyệt PCGD</span>
                  </Button>
                  {!khoaBoMon && (
                    <p className="flex gap-1 items-center">
                      <Checkbox
                        indeterminate={
                          countSubjectClassOfficial > 0 &&
                          countSubjectClassOfficial < countSubjectClass
                        }
                        checked={
                          countSubjectClassOfficial > 0 &&
                          countSubjectClassOfficial === countSubjectClass
                        }
                        onChange={async (e) => {
                          try {
                            await sqlTransaction([
                              {
                                model: "SubjectClass",
                                operation: "updateMany",
                                data: {
                                  where: {
                                    semesterId,
                                    approveLecturerAssignmentAt: {
                                      not: null,
                                    },
                                    trainingObjectTypeId,
                                    lecturerId: { not: null },
                                    cancelled: false,
                                    active: true,
                                    deletedAt: null,
                                    type: type,
                                    ...(trainingCourseId && type === "NORMAL"
                                      ? {
                                          fixedClasses: {
                                            some: {
                                              trainingCourseId,
                                            },
                                          },
                                        }
                                      : {}),
                                  },
                                  data: {
                                    status: e.target.checked
                                      ? $Enums.SubjectClassStatus.OFFICIAL
                                      : $Enums.SubjectClassStatus.DRAFT,
                                  },
                                },
                              },
                            ])
                            queryClient.invalidateQueries({
                              queryKey: ["zenstack", "SubjectClass"],
                            })
                          } catch (error) {}
                        }}
                      />
                      <span>Đưa LMH vào giảng dạy</span>
                    </p>
                  )}
                </Flex>
              </Col>
              <Col span={14}>
                <Flex gap={4} justify="end">
                  <TreeSelectDepartment
                    className="w-[300px]"
                    rootId={!khoaBoMon ? "0" : orgId}
                    onChange={(val) => handleFilterChange("organization", val)}
                  />
                  {khoaBoMon &&
                    can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
                      "SUA"
                    ) && (
                      <FormStateGate form={form}>
                        {({ hasUnsavedEdits }) => (
                          <Button
                            onClick={() => handleKhoaBoMonLuuPCGD()}
                            type="primary"
                            disabled={!dmDonViData.length || !hasUnsavedEdits}
                          >
                            Lưu
                          </Button>
                        )}
                      </FormStateGate>
                    )}
                  {khoaBoMon &&
                    can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
                      "SUA"
                    ) && (
                      <Popover
                        content={
                          <Flex gap={12} className="text-right mt-4">
                            <Button
                              type="primary"
                              className="bg-yellow-400 text-black"
                              onClick={async () => {
                                try {
                                  showSpinner()
                                  await updateManySubjectClass({
                                    data: {
                                      submitLecturerAssignmentAt: new Date(),
                                    },
                                    where: {
                                      lecturerId: {
                                        not: null,
                                      },
                                      lecturerAssignmentDeadline: { not: null },
                                      submitLecturerAssignmentAt: null,
                                      approveLecturerAssignmentAt: null,
                                      type: type,
                                      trainingObjectTypeId,
                                      semesterId,
                                      id: {
                                        in: selectedRowKeys as string[],
                                      },
                                    },
                                  })
                                  message.success("Gửi PCGD thành công")
                                  form.resetFields()
                                  setSelectedRowKeys([])
                                  debouncedRefetch()
                                } catch (error: any) {
                                  message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
                                } finally {
                                  hideSpinner()
                                }
                              }}
                              disabled={selectedRowKeys.length === 0}
                            >
                              Gửi PCGD {selectedRowKeys.length} lớp MH đã chọn
                            </Button>
                          </Flex>
                        }
                        title="Gửi phân công giảng dạy"
                        trigger="click"
                        placement="bottomRight"
                      >
                        <Button
                          type="primary"
                          disabled={!dmDonViData.length || selectedRowKeys.length === 0}
                        >
                          Gửi PCGD
                        </Button>
                      </Popover>
                    )}
                  {!khoaBoMon && (
                    <Popover
                      content={
                        <Form
                          form={formXepKhuVuc}
                          initialValues={{ isOverride: false }}
                          layout="horizontal"
                          labelCol={{ span: 8 }}
                          wrapperCol={{ span: 16 }}
                          labelAlign="left"
                          colon={true}
                          style={{ width: 360 }}
                          className="[&_.ant-form-item]:mb-3"
                          onFinish={async (values: XepKhuVucForm) => {
                            try {
                              showSpinner()
                              const res = await sqlTransaction([
                                {
                                  model: "SubjectClass",
                                  operation: "updateMany",
                                  data: {
                                    where: {
                                      trainingObjectTypeId,
                                      semesterId,
                                      active: true,
                                      deletedAt: null,
                                      type: type,
                                      ...(values.trainingCourseId
                                        ? {
                                            fixedClasses: {
                                              some: { trainingCourseId: values.trainingCourseId },
                                            },
                                          }
                                        : {}),
                                      ...(!values.isOverride ? { trainingLocationId: null } : {}),
                                    },
                                    data: {
                                      ...(values.trainingLocationId
                                        ? { trainingLocationId: values.trainingLocationId }
                                        : {}),
                                      ...(values.schedule ? { schedule: values.schedule } : {}),
                                    },
                                  },
                                },
                              ])
                              if (res.status !== 200) {
                                throw new Error("Lỗi khi xếp khu vực")
                              }
                              debouncedRefetch()
                              formXepKhuVuc.resetFields()
                              message.success("Xếp khu vực / kíp học thành công")
                            } catch (error: any) {
                              message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
                            } finally {
                              hideSpinner()
                            }
                          }}
                        >
                          <Form.Item name="trainingCourseId" label="Khoá đào tạo">
                            <Select
                              options={trainingCourseData.map((e) => ({
                                label: e.name,
                                value: e.id,
                              }))}
                              allowClear
                              showSearch
                              placeholder="Tất cả khoá"
                              filterOption={(input, option) =>
                                (option?.label ?? "")
                                  .toString()
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              dropdownStyle={{ width: 320 }}
                            />
                          </Form.Item>

                          <Form.Item name="trainingLocationId" label="Khu vực đào tạo">
                            <Select
                              options={trainingLocationData.map((e) => ({
                                label: e.name,
                                value: e.id,
                              }))}
                              allowClear
                              showSearch
                              placeholder="Không thay đổi"
                              filterOption={(input, option) =>
                                (option?.label ?? "")
                                  .toString()
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              dropdownStyle={{ width: 320 }}
                            />
                          </Form.Item>

                          <Form.Item name="schedule" label="Kíp học">
                            <Select
                              options={Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                                ([key, value]) => ({
                                  label: value,
                                  value: key,
                                })
                              )}
                              allowClear
                              placeholder="Không thay đổi"
                            />
                          </Form.Item>

                          <Divider className="my-2" />

                          <Form.Item
                            name="isOverride"
                            label="Ghi đè đã xếp"
                            valuePropName="checked"
                          >
                            <Switch checkedChildren="Ghi đè" unCheckedChildren="Bỏ qua" />
                          </Form.Item>

                          <Form.Item wrapperCol={{ offset: 9, span: 15 }}>
                            <Flex gap={8} justify="end">
                              <Button onClick={() => formXepKhuVuc.resetFields()}>Đặt lại</Button>
                              <Button type="primary" htmlType="submit">
                                Xếp nhanh
                              </Button>
                            </Flex>
                          </Form.Item>
                        </Form>
                      }
                      title="Xếp khu vực / kíp học (nhanh)"
                      trigger="click"
                      placement="bottomRight"
                    >
                      <Button type="dashed">Xếp khu vực (nhanh)</Button>
                    </Popover>
                  )}
                  {!khoaBoMon && (
                    <Button
                      onClick={() => handleP2LuuKeHoach()}
                      type="default"
                      className="text-primary"
                    >
                      0. Lưu kế hoạch
                    </Button>
                  )}
                  {!khoaBoMon && (
                    <Popover
                      content={
                        <Form
                          form={formBaoDay}
                          initialValues={{ isOverride: false }}
                          onFinish={p2GuiBaoDay}
                        >
                          <FormItem
                            form={formBaoDay}
                            name={"deadline"}
                            required
                            label="Hạn phân công giảng dạy"
                          >
                            <DatePicker />
                          </FormItem>
                          <FormItem
                            form={formBaoDay}
                            name={"isOverride"}
                            label="Ghi đè hạn PCGD"
                            className="mt-2"
                          >
                            <Switch />
                          </FormItem>
                          <Col span={24} className="text-right mt-4">
                            <Button type="primary" htmlType="submit">
                              Gửi báo dạy
                            </Button>
                          </Col>
                        </Form>
                      }
                      title="Báo dạy cho Khoa/Viện/Bộ môn"
                      trigger="click"
                      placement="bottomRight"
                    >
                      <FormStateGate form={form}>
                        {({ missingTrainingLocation }) => (
                      <Tooltip
                        title={
                          missingTrainingLocation
                            ? "Vui lòng nhập khu vực đào tạo cho tất cả lớp môn học trước khi báo dạy"
                            : undefined
                        }
                      >
                        <Button
                          type="primary"
                          className="bg-red-500"
                          disabled={missingTrainingLocation}
                        >
                          1.Báo dạy
                        </Button>
                      </Tooltip>
                        )}
                      </FormStateGate>
                    </Popover>
                  )}
                  {!khoaBoMon &&
                    can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, "DUYET") && (
                      <Popover
                        content={
                          <Flex gap={12} className="text-right mt-4">
                            <Button
                              type="primary"
                              disabled={selectedRowKeys.length === 0}
                              danger
                              onClick={handleP2TuChoiPCGD}
                            >
                              Từ chối PCGD {selectedRowKeys.length} LMH
                            </Button>
                            <Button
                              type="primary"
                              onClick={handleP2DuyetPCGD}
                              disabled={selectedRowKeys.length === 0}
                            >
                              Duyệt PCGD {selectedRowKeys.length} LMH
                            </Button>
                          </Flex>
                        }
                        title="Duyệt báo dạy"
                        trigger="click"
                        placement="bottomRight"
                      >
                        <Button type="primary">2. Tiếp nhận báo dạy</Button>
                      </Popover>
                    )}
                  {!khoaBoMon && (
                    <>
                      <Button
                        onClick={() => setIsExportModalOpen(true)}
                        type="primary"
                        className="bg-blue-500"
                        disabled={!dataWithRowSpan?.length}
                      >
                        3. Xuất PCGD
                      </Button>
                      <Modal
                        title="Tùy chọn xuất phân công giảng dạy"
                        open={isExportModalOpen}
                        onCancel={() => setIsExportModalOpen(false)}
                        onOk={() => handleExportExcel(exportGroupType)}
                        okText="Xuất file"
                        cancelText="Hủy"
                      >
                        <div style={{ padding: "16px 0" }}>
                          <Radio.Group
                            onChange={(e) => setExportGroupType(e.target.value)}
                            value={exportGroupType}
                            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                          >
                            <Radio value="faculty">
                              <strong>Xuất theo Khoa/Viện</strong>
                            </Radio>
                            <Radio value="department">
                              <strong>Xuất theo Bộ môn</strong>
                            </Radio>
                          </Radio.Group>
                        </div>
                      </Modal>
                    </>
                  )}
                  {!khoaBoMon &&
                    can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, "NHAP_EXCEL") && (
                      <Button
                        type="primary"
                        className="bg-yellow-500 text-black"
                        onClick={() =>
                          onOpenModalNhapTKB({ type, trainingCourseId: trainingCourseId })
                        }
                      >
                        4. Nhập từ TKB
                      </Button>
                    )}
                </Flex>
              </Col>
            </Flex>
            {copySourceId && (
              <Flex
                align="center"
                gap={8}
                className="px-2 py-2 bg-green-50 border border-green-200 rounded mt-1"
                style={{ flexWrap: "wrap" }}
              >
                <span style={{ fontSize: 13, color: "#27500A", fontWeight: 500 }}>
                  Copy PCGV từ:{" "}
                  <span style={{ color: "#185FA5" }}>
                    {dataWithRowSpan.flatMap((e) => e.children).find((c) => c.id === copySourceId)
                      ?.code || copySourceId}
                  </span>
                </span>
                <Divider type="vertical" />
                <span style={{ fontSize: 12, color: "#5F5E5A" }}>Thông tin :</span>
                <Checkbox
                  checked={copyFields.lecturerId}
                  onChange={(e) => setCopyFields((p) => ({ ...p, lecturerId: e.target.checked }))}
                >
                  GV 1
                </Checkbox>
                <Checkbox
                  checked={copyFields.extraLecturerId}
                  onChange={(e) =>
                    setCopyFields((p) => ({ ...p, extraLecturerId: e.target.checked }))
                  }
                >
                  GV 2
                </Checkbox>
                <Checkbox
                  checked={copyFields.enterGradeLecturerId}
                  onChange={(e) =>
                    setCopyFields((p) => ({ ...p, enterGradeLecturerId: e.target.checked }))
                  }
                >
                  GV nhập điểm
                </Checkbox>
                <Divider type="vertical" />
                <span style={{ fontSize: 12, color: "#5F5E5A" }}>
                  {selectedRowKeys.length > 0
                    ? `Đã chọn ${selectedRowKeys.length} dòng đích`
                    : "Chọn lớp cần áp dụng"}
                </span>
                <Button size="small" onClick={handleCopyCancel}>
                  Hủy
                </Button>
                <Button
                  size="small"
                  type="primary"
                  disabled={
                    selectedRowKeys.length === 0 || !Object.values(copyFields).some(Boolean)
                  }
                  onClick={handleCopyApply}
                >
                  Áp dụng {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length} dòng)` : ""}
                </Button>
              </Flex>
            )}

            <Divider className="m-0" />
          </Affix>
        </Col>
        <Col span={24}>
            <FormItem form={form} name={"subjectClass"} hidden />
            <LecturerNameProvider>
            <TableCollapse
              rowKey="id"
              scrollable
              maxHeight={khoaBoMon ? "calc(100vh - 370px)" : "calc(100vh - 460px)"}
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPage(1)
              }}
              rowSelection={{
                type: "checkbox",
                columnWidth: 35,
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                getCheckboxProps(record) {
                  void selectionVersion
                  const row = form.getFieldValue(["subjectClass", record.id])
                  let disabledRecord =
                    !row?.lecturerId ||
                    !row?.enterGradeLecturerId ||
                    !!record.cancelled ||
                    !!record.approveLecturerAssignmentAt ||
                    record?.$type === "parent"

                  if (khoaBoMon) {
                    disabledRecord = disabledRecord || !!record.submitLecturerAssignmentAt
                  }
                  if (copySourceId) {
                    const isSelf = record.id === copySourceId
                    const isCancelled = !!row?.cancelled
                    const isParent = record?.$type === "parent"
                    disabledRecord = isSelf || isCancelled || isParent
                  }

                  return {
                    disabled: disabledRecord,
                    className: cn(disabledRecord && "hidden"),
                  }
                },
              }}
              defaultExpandAll
              onRow={(record) => {
                if ((record as any)?.$type === "parent") {
                  return { className: "bg-white" }
                }
                return {}
              }}
              columns={columns}
              headerTitleKey={"sTen"}
              data={dataWithRowSpan}
              childrenFieldName="children"
              pagination={pagination}
            />
            </LecturerNameProvider>
        </Col>
      </Row>
      </Form>
      <style>
        {`
          .readonly-checkbox.ant-checkbox-wrapper-disabled {
            opacity: 1;
            pointer-events: none;
          }
          .readonly-checkbox .ant-checkbox-disabled .ant-checkbox-inner {
            background-color: #fff;
            border-color: #d9d9d9;
          }
        `}
      </style>
    </div>
  )
}

PhanCongGiangDay.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
