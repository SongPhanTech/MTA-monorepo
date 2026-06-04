/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <sử dụng onClick để ngăn chặn sự kiện click lồng nhau> */
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import type { ModalTaoDuLieuMauLuanVanInput } from "@components/modal/modal-tao-du-lieu-mau-luan-van"
import ApproveIcon from "@components/icons/approve"
import DeleteIcon from "@components/icons/delete"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { useThesisProjectStatusOptions } from "@hooks/thesisProjectStatus"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import {
  CouncilMember,
  CouncilProposalStatus,
  CouncilRole,
  PaymentStatus,
  SupervisorRole,
  ThesisProjectStatus,
  ThesisType,
} from "@workspace/db/client"
import { queryClient } from "@api/index"
import {
  useCountStudent,
  useCreatePaymentRecord,
  useCreateSupervisorPaymentRecord,
  useDeleteManyCouncil,
  useDeleteManyCouncilMember,
  useDeleteManyDecision,
  useDeleteManyDefenseRecord,
  useDeleteManyDocumentFile,
  useDeleteManyInvitation,
  useDeleteManyLibrarySubmission,
  useDeleteManyPaymentRecord,
  useDeleteManyStudentThesisRegistration,
  useDeleteManySupervisorPaymentRecord,
  useDeleteManyThesisProject,
  useDeleteSupervisorPaymentRecord,
  useFindManyDefaultCouncilRolePayAmount,
  useFindManyDefaultSupervisorPayAmount,
  useFindManyDefenseSession,
  useFindManyDM_DonVi,
  useFindManyExpertProfile,
  useFindManyFixedClass,
  useFindManyRoom,
  useFindManyStudent,
  useFindManyThesisSession,
  useUpdateManyThesisProject,
  useUpdateThesisProject,
  useUpdateThesisSession,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { dayjs, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Tag,
} from "antd"
import Decimal from "decimal.js"
import { SquarePen } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TreeSelect from "@/components/commons/tree-select"
import {
  exportBanSaoHDDGLV,
  exportDanhSachBaoVe,
  exportDanhSachBaoVeDanNgoaiPhong,
  exportDanhSachNopLuanVanThuVien,
  exportDsChuyenGia,
  exportGiayMoiChamLvPb,
  exportGiayMoiHdlv,
  exportHDDanhGiaLuanVan,
  exportHosobvlv,
  exportKetQuaBaoVeLuanVan,
  exportKiemTraTienDo,
  exportPhuLucDsLuanVan,
  exportPhuLucQdhdd,
  exportSaoQDHDLV,
  exportThanhToanHoiDongBaoVe,
  exportThanhToanHuongDanTrongHv,
  exportThongKeCbHdlv,
  exportThongKeCbThamGiaHd,
  exportThongKeCoQuanDonViCanBoNgoaiHv,
} from "@/utils/thesis-excel"
import type { FilterProps } from "@constants/type"

export function formatDefenseSessionClock(startTime: Date | string | null | undefined): string {
  if (startTime === null || startTime === undefined) {
    return ""
  }
  const d = typeof startTime === "string" ? new Date(startTime) : startTime
  if (Number.isNaN(d.getTime())) {
    return ""
  }
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

interface ThesisProjectForm {
  thesisSessionId: string
  fixedClassId: string[]
  organizationId: string
  topicEntryDeadline?: ReturnType<typeof dayjs>
  councilDeadline?: ReturnType<typeof dayjs>
}

export interface DanhMucLuanVanProps {
  role?: "P7" | "Khoa"
}

export function getThesisRegistrationForSession(studentOrRecord: any, thesisSessionId?: string) {
  if (!thesisSessionId) return undefined
  return studentOrRecord?.thesisRegistrations?.find((reg: any) => {
    if (reg?.deletedAt) return false
    const project = reg?.thesisProject
    if (!project || project.deletedAt) return false
    return (
      project.thesisSession?.id === thesisSessionId || project.thesisSessionId === thesisSessionId
    )
  })
}

export function getThesisProjectForSession(studentOrRecord: any, thesisSessionId?: string) {
  return getThesisRegistrationForSession(studentOrRecord, thesisSessionId)?.thesisProject
}

/** GVHD chính và GVHD phụ không được cùng một chuyên gia (khi cả hai đều được chọn). */
export function hasDuplicateThesisSupervisors(
  supervisor: string | null | undefined,
  coSupervisor: string | null | undefined
): boolean {
  const sup =
    supervisor === "" || supervisor === undefined || supervisor === null ? null : String(supervisor)
  const co =
    coSupervisor === "" || coSupervisor === undefined || coSupervisor === null
      ? null
      : String(coSupervisor)
  return sup !== null && co !== null && sup === co
}

const THESIS_COUNCIL_EXPERT_FIELDS = [
  "councilChairman",
  "councilSecretary",
  "reviewer1",
  "reviewer2",
  "councilMember",
] as const

function normalizeCouncilExpertId(id: unknown): string | null {
  if (id === "" || id === undefined || id === null) return null
  return String(id)
}

/** Các cán bộ hội đồng bảo vệ (đã chọn) không được trùng chuyên gia. */
export function hasDuplicateCouncilExperts(row: Record<string, unknown>): boolean {
  const ids = THESIS_COUNCIL_EXPERT_FIELDS.map((field) =>
    normalizeCouncilExpertId(row[field])
  ).filter((id): id is string => id !== null)
  return new Set(ids).size !== ids.length
}

export function getCouncilExpertIdsExcludingField(
  row: Record<string, unknown>,
  excludeField: (typeof THESIS_COUNCIL_EXPERT_FIELDS)[number]
): Set<string> {
  const excluded = new Set<string>()
  for (const field of THESIS_COUNCIL_EXPERT_FIELDS) {
    if (field === excludeField) continue
    const id = normalizeCouncilExpertId(row[field])
    if (id) excluded.add(id)
  }
  return excluded
}

export function getCouncilMemberName(record: any, role: CouncilRole, thesisSessionId?: string) {
  const member = getThesisProjectForSession(record, thesisSessionId)?.council?.members?.find(
    (m: CouncilMember) => m.role === role
  )

  if (!member) return ""

  const expert = member.expert
  const profile = expert?.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert?.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert?.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert?.name || profile?.fullname || ""
  const inAcademy = expert?.lecturerId ? true : false
  const workplace = expert?.workplace || ""
  const text = [title, fullname].filter(Boolean).join(" ").trim()
  const textWithWorkplace = [text, workplace].filter(Boolean).join(", ")
  return (
    <span
      title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
      style={{ color: inAcademy ? "#000000" : "#16a34a" }}
    >
      {textWithWorkplace}
    </span>
  )
}
export function getSupervisorName(record: any, htmlRender = false, showWorkplace = false) {
  const expert = record
  if (!expert) return ""

  const profile = expert?.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert?.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert?.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert?.name || profile?.fullname || ""
  const inAcademy = expert?.lecturerId ? true : false
  const workplace = expert?.workplace || ""
  const text = [title, fullname].filter(Boolean).join(" ").trim()
  const textWithWorkplace = [text, showWorkplace ? workplace : ""].filter(Boolean).join(", ")
  return htmlRender ? (
    <span
      title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
      style={{ color: inAcademy ? "#000000" : "#16a34a" }}
    >
      {textWithWorkplace}
    </span>
  ) : (
    textWithWorkplace
  )
}
const { TextArea } = Input

const NAME_SEARCH_DEBOUNCE_MS = 400

export default function DanhMucLuanVan({ role = "P7" }: DanhMucLuanVanProps) {
  const orgId = window.contextData?.organizationId
  const [form] = Form.useForm<ThesisProjectForm>()
  const [searchParams, setSearchParams] = useState<Partial<ThesisProjectForm>>({})
  const { showSpinner, hideSpinner } = useSpinner()
  const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
  const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [nameKeyword, setNameKeyword] = useState("")
  const [debouncedNameKeyword, setDebouncedNameKeyword] = useState("")
  const nameSearchDebounceReady = useRef(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [trainingCourseId, setTrainingCourseId] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = nameKeyword.trim()
      setDebouncedNameKeyword(next)
      if (nameSearchDebounceReady.current) {
        setCurrentPage(1)
        setEditingRowKeys([])
      } else {
        nameSearchDebounceReady.current = true
      }
    }, NAME_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [nameKeyword])
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
  }
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { id: trainingObjectId } = useTrainingObjectTypeStore()
  const { onOpen: openModalCauHinhLuanVan } = useDisclosure<{
    thesisProjectId: string
    thesisSessionId: string
  }>({
    tag: "ModalCauHinhLuanVan",
  })
  const { onOpen: openModalChuyenDiemLopMonHoc } = useDisclosure<{
    allStudentsInClasses: any[]
  }>({
    tag: "ModalChuyenDiemLopMonHoc",
  })
  const { onOpen: openModalTaoDuLieuMau } = useDisclosure<ModalTaoDuLieuMauLuanVanInput>({
    tag: "ModalTaoDuLieuMauLuanVan",
  })
  const { data: sDm_Donvi = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const { data: roomData } = useFindManyRoom()
  const { data: defenseSessionData } = useFindManyDefenseSession()

  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    title: "",
    supervisor: "",
    coSupervisor: "",
  })

  const treeOrgData = buildOrgTree(sDm_Donvi ?? [], "0")
  // const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
  //   useThesisProjectStatusOptions()

  const { data: fixedClasses } = useFindManyFixedClass(
    {
      where: {
        trainingCourseId: trainingCourseId ?? "",
      },
    },
    {
      enabled: !!trainingCourseId,
    }
  )
  const { data: expertProfileData } = useFindManyExpertProfile({
    where: {
      thesisExpert: true,
    },
    include: {
      academicRankType: true,
      academicDegreeType: true,
      lecturer: {
        include: {
          userProfile: {
            include: {
              academicRankType: true,
              academicDegreeType: true,
            },
          },
        },
      },
    },
  })
  useEffect(() => {
    if (role !== "Khoa" || !orgId) return
    form.setFieldValue("organizationId", orgId)
    setSearchParams((prev) => ({
      ...prev,
      organizationId: orgId,
    }))
  }, [role, orgId, form])
  // biome-ignore lint/correctness/useExhaustiveDependencies: dùng cho searchParams
  const studentWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] } }

    const andConditions: any[] = []

    andConditions.push({
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
    })

    if (filters.code) {
      andConditions.push({ code: { contains: filters.code, mode: "insensitive" } })
    }
    if (filters.name) {
      andConditions.push({
        userProfile: { fullname: { contains: filters.name, mode: "insensitive" } },
      })
    }

    const thesisProjectConditions: any = {
      deletedAt: null,
      thesisSessionId: searchParams.thesisSessionId,
      thesisType: ThesisType.THESIS,
      organizationId: searchParams.organizationId || undefined,
    }

    if (filters.title) {
      thesisProjectConditions.title = { contains: filters.title, mode: "insensitive" }
    }

    if (filters.supervisor) {
      thesisProjectConditions.supervisor = {
        OR: [
          { name: { contains: filters.supervisor, mode: "insensitive" } },
          {
            lecturer: {
              userProfile: { fullname: { contains: filters.supervisor, mode: "insensitive" } },
            },
          },
        ],
      }
    }

    if (filters.coSupervisor) {
      thesisProjectConditions.coSupervisor = {
        OR: [
          { name: { contains: filters.coSupervisor, mode: "insensitive" } },
          {
            lecturer: {
              userProfile: { fullname: { contains: filters.coSupervisor, mode: "insensitive" } },
            },
          },
        ],
      }
    }

    andConditions.push({
      thesisRegistrations: {
        some: {
          thesisProject: thesisProjectConditions,
          deletedAt: null,
        },
      },
    })

    if (debouncedNameKeyword) {
      andConditions.push({
        OR: [
          { userProfile: { fullname: { contains: debouncedNameKeyword, mode: "insensitive" } } },
          {
            thesisRegistrations: {
              some: {
                deletedAt: null,
                thesisProject: {
                  deletedAt: null,
                  thesisSessionId: searchParams.thesisSessionId,
                  thesisType: ThesisType.THESIS,
                  OR: [
                    {
                      supervisor: { name: { contains: debouncedNameKeyword, mode: "insensitive" } },
                    },
                    {
                      supervisor: {
                        lecturer: {
                          userProfile: {
                            fullname: { contains: debouncedNameKeyword, mode: "insensitive" },
                          },
                        },
                      },
                    },
                    {
                      coSupervisor: {
                        name: { contains: debouncedNameKeyword, mode: "insensitive" },
                      },
                    },
                    {
                      coSupervisor: {
                        lecturer: {
                          userProfile: {
                            fullname: { contains: debouncedNameKeyword, mode: "insensitive" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      })
    }

    return { AND: andConditions }
  }, [searchParams, fixedClasses, filters, debouncedNameKeyword])

  // biome-ignore lint/correctness/useExhaustiveDependencies: dùng cho searchParams
  const allStudentWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] } }
    const thesisProjectWhere: Record<string, any> = {
      deletedAt: null,
      thesisSessionId: searchParams.thesisSessionId,
      thesisType: ThesisType.THESIS,
      organizationId: searchParams.organizationId || undefined,
    }
    if (debouncedNameKeyword) {
      thesisProjectWhere.OR = [
        {
          supervisor: {
            name: { contains: debouncedNameKeyword, mode: "insensitive" },
          },
        },
        {
          supervisor: {
            lecturer: {
              userProfile: {
                fullname: { contains: debouncedNameKeyword, mode: "insensitive" },
              },
            },
          },
        },
        {
          coSupervisor: {
            name: { contains: debouncedNameKeyword, mode: "insensitive" },
          },
        },
        {
          coSupervisor: {
            lecturer: {
              userProfile: {
                fullname: { contains: debouncedNameKeyword, mode: "insensitive" },
              },
            },
          },
        },
      ]
    }
    const filter: Record<string, any> = {
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
    }
    if (!debouncedNameKeyword) return filter
    return {
      ...filter,
      OR: [
        {
          userProfile: {
            fullname: { contains: debouncedNameKeyword, mode: "insensitive" },
          },
        },
        {
          thesisRegistrations: {
            some: {
              deletedAt: null,
              thesisProject: thesisProjectWhere,
            },
          },
        },
      ],
    }
  }, [searchParams, fixedClasses, debouncedNameKeyword])

  const { data: students = [], refetch: refetchStudents } = useFindManyStudent({
    where: studentWhere,
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: {
            include: { trainingObjectType: true },
          },
        },
      },
      thesisRegistrations: {
        include: {
          thesisProject: {
            include: {
              council: {
                include: {
                  members: {
                    include: {
                      expert: {
                        include: {
                          academicRankType: true,
                          academicDegreeType: true,
                          lecturer: {
                            include: {
                              userProfile: {
                                include: { academicRankType: true, academicDegreeType: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              thesisSession: true,
              defenseSession: true,
              defenseRecord: true,
              room: true,
              organization: true,
              supervisor: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                  lecturer: {
                    include: {
                      userProfile: {
                        include: { academicRankType: true, academicDegreeType: true },
                      },
                    },
                  },
                },
              },
              coSupervisor: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                  lecturer: {
                    include: {
                      userProfile: {
                        include: { academicRankType: true, academicDegreeType: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    skip: (currentPage - 1) * numberOfPages,
    take: numberOfPages,
  })
  const { data: allStudentsInClasses = [], refetch: refetchAllStudentsInClasses } =
    useFindManyStudent({
      where: allStudentWhere,
      include: {
        userProfile: true,
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                managementOrganization: true,
                trainingMajor: { include: { organization: true } },
              },
            },
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: { trainingObjectType: true },
            },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: { trainingField: true, organization: true },
                    },
                  },
                },
              },
            },
          },
        },
        thesisRegistrations: {
          include: {
            thesisProject: {
              // where: { thesisSession: { id: searchParams.thesisSessionId } },
              include: {
                defenseSession: true,
                thesisSession: {
                  include: {
                    configPayment: {
                      include: {
                        councilPayAmounts: true,
                        supervisorPayAmounts: true,
                      },
                    },
                    trainingCourse: {
                      include: {
                        trainingObjectType: true,
                      },
                    },
                  },
                },
                organization: true,
                supervisor: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    lecturer: {
                      include: {
                        organization: true,
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
                coSupervisor: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    lecturer: {
                      include: {
                        organization: true,
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
                room: true,
                defenseRecord: true,
                supervisorPayment: true,
                coSupervisorPayment: true,
                council: {
                  include: {
                    members: {
                      include: {
                        expert: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                            lecturer: {
                              include: {
                                organization: true,
                                userProfile: {
                                  include: {
                                    academicRankType: true,
                                    academicDegreeType: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                        payment: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  const { data: countStudent, refetch: refetchCount } = useCountStudent(
    {
      where: studentWhere,
    },
    {
      enabled: !!searchParams.thesisSessionId,
    }
  )
  const { data: thesisSessionData } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },

    where: {
      trainingObjectTypeId: trainingObjectId,
    },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
  })
  const trainingCourse = thesisSessionData?.find(
    (x) => x.id === searchParams.thesisSessionId
  )?.trainingCourse
  const selectedThesisSession = useMemo(
    () => thesisSessionData?.find((s) => s.id === searchParams.thesisSessionId),
    [thesisSessionData, searchParams.thesisSessionId]
  )
  const thesisConfigPaymentSessionId = selectedThesisSession?.configPaymentSessionId ?? null

  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()
  const { mutateAsync: deleteManyCouncil } = useDeleteManyCouncil()
  const { mutateAsync: deleteManyCouncilMember } = useDeleteManyCouncilMember()
  const { mutateAsync: deleteManyStudentThesisRegistration } =
    useDeleteManyStudentThesisRegistration()
  const { mutateAsync: deleteManyDecision } = useDeleteManyDecision()
  const { mutateAsync: deleteManyDefenseRecord } = useDeleteManyDefenseRecord()
  const { mutateAsync: deleteManyDocumentFile } = useDeleteManyDocumentFile()
  const { mutateAsync: deleteManyInvitation } = useDeleteManyInvitation()
  const { mutateAsync: deleteManyLibrarySubmission } = useDeleteManyLibrarySubmission()
  const { mutateAsync: deleteManyPaymentRecord } = useDeleteManyPaymentRecord()
  const { mutateAsync: deleteManySupervisorPaymentRecord } = useDeleteManySupervisorPaymentRecord()
  const { mutateAsync: deleteManyThesisProject } = useDeleteManyThesisProject()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
  const { mutateAsync: updateManyThesisProject } = useUpdateManyThesisProject()
  const { mutateAsync: createPaymentRecord } = useCreatePaymentRecord()
  const { data: defaultCouncilPayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount(
    {
      where: {
        configPaymentSessionId: thesisConfigPaymentSessionId,
        description: "THESIS",
      },
    },
    { enabled: !!searchParams.thesisSessionId }
  )
  const { data: defaultSupervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount(
    {
      where: {
        configPaymentSessionId: thesisConfigPaymentSessionId,
        description: "THESIS",
      },
    },
    { enabled: !!searchParams.thesisSessionId }
  )
  const { mutateAsync: createSupervisorPaymentRecord } = useCreateSupervisorPaymentRecord()
  const { mutateAsync: deleteSupervisorPaymentRecord } = useDeleteSupervisorPaymentRecord()
  const isWithinGvhdSupervisorEditWindow = (): boolean => {
    const deadline = selectedThesisSession?.topicEntryDeadline
    if (!deadline) return true
    return !dayjs().isAfter(dayjs(deadline).endOf("day"))
  }
  const isWithinCouncilEditWindow = (): boolean => {
    const deadline = selectedThesisSession?.councilDeadline
    if (!deadline) return true
    return !dayjs().isAfter(dayjs(deadline).endOf("day"))
  }

  useEffect(() => {
    const id = searchParams.thesisSessionId
    if (!id || !thesisSessionData?.length) {
      form.setFieldsValue({
        topicEntryDeadline: undefined,
        councilDeadline: undefined,
      })
      return
    }
    const session = thesisSessionData.find((s) => s.id === id)
    if (session) {
      form.setFieldsValue({
        topicEntryDeadline: session.topicEntryDeadline
          ? dayjs(session.topicEntryDeadline)
          : undefined,
        councilDeadline: session.councilDeadline ? dayjs(session.councilDeadline) : undefined,
      })
    }
  }, [searchParams.thesisSessionId, thesisSessionData, form])
  const handleEditChange = (rowId: string, field: string, value: any) => {
    if (field === "supervisor" || field === "coSupervisor") {
      setEditingValues((prev) => {
        const row = prev[rowId] || {}
        const nextSupervisor = field === "supervisor" ? value : row.supervisor
        const nextCoSupervisor = field === "coSupervisor" ? value : row.coSupervisor
        if (hasDuplicateThesisSupervisors(nextSupervisor, nextCoSupervisor)) {
          message.error("GVHD 1 và GVHD 2 không được trùng nhau")
          return prev
        }
        return {
          ...prev,
          [rowId]: { ...row, [field]: value },
        }
      })
      return
    }
    if ((THESIS_COUNCIL_EXPERT_FIELDS as readonly string[]).includes(field)) {
      setEditingValues((prev) => {
        const row = prev[rowId] || {}
        const nextRow = { ...row, [field]: value }
        if (hasDuplicateCouncilExperts(nextRow)) {
          message.error("Các cán bộ trong hội đồng bảo vệ không được trùng nhau")
          return prev
        }
        return {
          ...prev,
          [rowId]: nextRow,
        }
      })
      return
    }
    setEditingValues((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value,
      },
    }))
  }

  const refetchThesisTableData = useCallback(async () => {
    await Promise.all([refetchStudents(), refetchCount(), refetchAllStudentsInClasses()])
  }, [refetchStudents, refetchCount, refetchAllStudentsInClasses])

  /** Xóa cứng ThesisProject và dữ liệu phụ thuộc (chỉ khi không còn đăng ký). */
  const hardDeleteThesisProjectById = useCallback(
    async (thesisProjectId: string) => {
      const councilOnThesis = { thesis: { some: { id: thesisProjectId } } }

      await deleteManyPaymentRecord({
        where: { councilMember: { council: councilOnThesis } },
      })
      await deleteManyInvitation({
        where: { councilMember: { council: councilOnThesis } },
      })
      await deleteManyCouncilMember({
        where: { council: councilOnThesis },
      })
      await deleteManyCouncil({
        where: councilOnThesis,
      })

      await deleteManyDocumentFile({
        where: {
          OR: [
            { defenseRecord: { thesisId: thesisProjectId } },
            { librarySubmission: { thesisId: thesisProjectId } },
            { decision: { thesisProjectId } },
          ],
        },
      })
      await deleteManyDefenseRecord({ where: { thesisId: thesisProjectId } })
      await deleteManyLibrarySubmission({ where: { thesisId: thesisProjectId } })
      await deleteManyDecision({ where: { thesisProjectId } })

      await updateManyThesisProject({
        where: { id: thesisProjectId },
        data: {
          supervisorPaymentId: null,
          coSupervisorPaymentId: null,
          singleSupervisorPaymentId: null,
          councilId: null,
        },
      })
      await deleteManySupervisorPaymentRecord({
        where: {
          OR: [
            { thesisProjects: { some: { id: thesisProjectId } } },
            { coThesisProjects: { some: { id: thesisProjectId } } },
            { singleSupervisorPayment: { some: { id: thesisProjectId } } },
          ],
        },
      })

      await deleteManyThesisProject({
        where: {
          id: thesisProjectId,
          registrations: { none: {} },
        },
      })
    },
    [
      deleteManyCouncil,
      deleteManyCouncilMember,
      deleteManyDecision,
      deleteManyDefenseRecord,
      deleteManyDocumentFile,
      deleteManyInvitation,
      deleteManyLibrarySubmission,
      deleteManyPaymentRecord,
      deleteManySupervisorPaymentRecord,
      deleteManyThesisProject,
      updateManyThesisProject,
    ]
  )

  const handleDeleteStudentThesis = async (record: { id: string }) => {
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi xóa.")
      return
    }

    const registration = getThesisRegistrationForSession(record, thesisSessionId)
    const thesisProjectId =
      registration?.thesisProjectId ?? registration?.thesisProject?.id ?? undefined

    if (!registration?.id) {
      message.error("Không tìm thấy đăng ký luận văn để xóa")
      return
    }

    try {
      showSpinner()

      // Hội đồng gắn trực tiếp đăng ký (nếu có) — gỡ trước để tránh lỗi FK
      await deleteManyCouncilMember({
        where: { council: { studentThesisRegistrationId: registration.id } },
      })
      await deleteManyCouncil({
        where: { studentThesisRegistrationId: registration.id },
      })

      await deleteManyStudentThesisRegistration({
        where: { id: registration.id },
      })

      if (thesisProjectId) {
        await hardDeleteThesisProjectById(thesisProjectId)
      }

      setEditingRowKeys((prev) => prev.filter((k) => k !== record.id))
      setEditingValues((prev) => {
        const next = { ...prev }
        delete next[record.id]
        return next
      })
      setSelectedRowKeys((prev) => prev.filter((k) => k !== record.id))

      await refetchThesisTableData()
      message.success("Xóa luận văn thành công")
    } catch (error: any) {
      const detail = error?.info?.message || error?.message
      message.error(detail || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleBatchSave = async () => {
    if (editingRowKeys.length === 0) {
      message.info("Không có hàng nào đang ở chế độ chỉnh sửa để lưu.")
      return
    }
    if (selectedRowKeys.length === 0) {
      message.info("Vui lòng chọn ít nhất một sinh viên để lưu.")
      return
    }

    showSpinner()
    for (const studentId of selectedRowKeys) {
      const rowData = editingValues[studentId.toString()]
      if (!rowData) continue
      const studentRecord = students?.find((s) => s.id === studentId)
      if (hasDuplicateCouncilExperts(rowData)) {
        message.error(
          `Các cán bộ hội đồng bảo vệ không được trùng nhau (mã học viên: ${studentRecord?.code || studentId}).`
        )
        hideSpinner()
        return
      }
    }
    if (role === "Khoa" || role === "P7") {
      for (const studentId of selectedRowKeys) {
        const rowData = editingValues[studentId.toString()]
        if (!rowData) continue
        const studentRecord = students?.find((s) => s.id === studentId)
        if (hasDuplicateThesisSupervisors(rowData.supervisor, rowData.coSupervisor)) {
          message.error(
            `GVHD 1 và GVHD 2 không được trùng nhau (mã học viên: ${studentRecord?.code || studentId}).`
          )
          hideSpinner()
          return
        }
        const orig = getThesisProjectForSession(studentRecord, searchParams.thesisSessionId)
        if (!orig) continue
        const newSup = rowData.supervisor ?? ""
        const newCo = rowData.coSupervisor ?? ""
        const oldSup = orig.supervisor?.id ?? ""
        const oldCo = orig.coSupervisor?.id ?? ""
        if ((newSup !== oldSup || newCo !== oldCo) && !isWithinGvhdSupervisorEditWindow()) {
          message.error(
            "Đã quá hạn nhập GVHD. Chỉ được thay đổi giáo viên hướng dẫn khi còn trong hạn (theo ngày hạn nhập đề tài của đợt xét)."
          )
          hideSpinner()
          return
        }
      }
    }
    try {
      const updatePromises = selectedRowKeys.map(async (studentId) => {
        const rowData = editingValues[studentId.toString()]

        const studentRecord = students?.find((s) => s.id === studentId)
        const thesisProjectId = getThesisProjectForSession(
          studentRecord,
          searchParams.thesisSessionId
        )?.id

        if (!thesisProjectId || !rowData) return

        if (hasDuplicateCouncilExperts(rowData)) {
          throw new Error("DUPLICATE_COUNCIL")
        }

        const description = `Ngôn ngữ: ${rowData.language} - Luận án/Đề án: ${rowData.type}`
        const status = rowData.status

        const councilMembersData = [
          { role: CouncilRole.CHAIRMAN, expertId: rowData.councilChairman },
          { role: CouncilRole.SECRETARY, expertId: rowData.councilSecretary },
          { role: CouncilRole.REVIEWER_1, expertId: rowData.reviewer1 },
          { role: CouncilRole.REVIEWER_2, expertId: rowData.reviewer2 },
          { role: CouncilRole.MEMBER, expertId: rowData.councilMember },
        ]
          .filter((m) => m.expertId)
          .map((m) => ({
            role: m.role,
            expert: { connect: { id: m.expertId } },
          }))
        const payload: any = {
          title: rowData.title,
          description: description,
          status: status,
          type: rowData.type,
          language: rowData.language,
          defenseDate: rowData.defenseDate ? new Date(rowData.defenseDate) : null,
          researchTopicAssociated: rowData.researchTopicAssociated || "",
          organization: rowData.organization
            ? { connect: { Id: rowData.organization } }
            : { disconnect: true },
          council: {
            upsert: {
              create: {
                proposedDate: new Date(),
                status: CouncilProposalStatus.PENDING,
                members: { create: councilMembersData },
              },
              update: {
                members: {
                  deleteMany: {},
                  create: councilMembersData,
                },
              },
            },
          },

          defenseRecord: {
            upsert: {
              create: {
                finalScore: rowData.score ? Number.parseFloat(rowData.score) : null,
                isProfileComplete: false,
              },
              update: {
                finalScore: rowData.score ? Number.parseFloat(rowData.score) : null,
              },
            },
          },
        }
        if (role === "Khoa" || role === "P7") {
          const normalizedSupervisor = rowData.supervisor === "" ? null : rowData.supervisor
          const normalizedCoSupervisor = rowData.coSupervisor === "" ? null : rowData.coSupervisor

          if (hasDuplicateThesisSupervisors(normalizedSupervisor, normalizedCoSupervisor)) {
            throw new Error("DUPLICATE_SUPERVISORS")
          }

          if (normalizedSupervisor !== undefined) {
            payload.supervisor =
              normalizedSupervisor === null
                ? { disconnect: true }
                : { connect: { id: normalizedSupervisor } }
          }
          if (normalizedCoSupervisor !== undefined) {
            payload.coSupervisor =
              normalizedCoSupervisor === null
                ? { disconnect: true }
                : { connect: { id: normalizedCoSupervisor } }
          }
        }
        const normalizedRoom = rowData.room === "" ? null : (rowData.room ?? undefined)
        const normalizedDefenseSession =
          rowData.defenseSession === "" ? null : (rowData.defenseSession ?? undefined)
        if (normalizedRoom !== undefined) {
          payload.room =
            normalizedRoom === null ? { disconnect: true } : { connect: { id: normalizedRoom } }
        }
        if (normalizedDefenseSession !== undefined) {
          payload.defenseSession =
            normalizedDefenseSession === null
              ? { disconnect: true }
              : { connect: { id: normalizedDefenseSession } }
        }

        return await updateThesisProject({
          data: payload,
          where: { id: thesisProjectId },
        })
      })

      await Promise.all(updatePromises.filter((p) => p !== undefined))

      message.success(`Lưu thành công ${selectedRowKeys.length} đề tài đã chỉnh sửa.`)
    } catch (error: any) {
      if (error?.message === "DUPLICATE_SUPERVISORS") {
        message.error("GVHD 1 và GVHD 2 không được trùng nhau")
      } else if (error?.message === "DUPLICATE_COUNCIL") {
        message.error("Các cán bộ trong hội đồng bảo vệ không được trùng nhau")
      } else {
        message.error("Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại")
      }
    } finally {
      hideSpinner()
      await refetchStudents()
      await refetchAllStudentsInClasses()
      if (refetchCount) await refetchCount()
    }
    setSelectedRowKeys([])
    setEditingRowKeys([])
    setEditingValues({})
  }
  const handleActivateEdit = () => {
    if (!students || students.length === 0) {
      message.info("Không có dữ liệu sinh viên để chỉnh sửa.")
      return
    }

    const newEditingRowKeys = students.map((s) => s.id)
    const initialEditingValues: Record<string, Record<string, any>> = {}

    students.forEach((record) => {
      const thesisProject = getThesisProjectForSession(record, searchParams.thesisSessionId)
      if (thesisProject) {
        initialEditingValues[record.id] = {
          title: thesisProject.title || "",
          supervisor: thesisProject.supervisor?.id || "",
          coSupervisor: thesisProject.coSupervisor?.id || "",
          language: thesisProject.language || "",
          type: thesisProject.type || "",
          status: thesisProject.status || "",
          defenseDate: thesisProject.defenseDate || "",
          defenseSession: thesisProject.defenseSession?.id || "",
          room: thesisProject.room?.id || "",
          councilChairman:
            thesisProject.council?.members.find(
              (member: CouncilMember) => member.role === CouncilRole.CHAIRMAN
            )?.expert?.id || "",
          councilSecretary:
            thesisProject.council?.members.find(
              (member: CouncilMember) => member.role === CouncilRole.SECRETARY
            )?.expert?.id || "",
          reviewer1:
            thesisProject.council?.members.find(
              (member: CouncilMember) => member.role === CouncilRole.REVIEWER_1
            )?.expert?.id || "",
          reviewer2:
            thesisProject.council?.members.find(
              (member: CouncilMember) => member.role === CouncilRole.REVIEWER_2
            )?.expert?.id || "",
          councilMember:
            thesisProject.council?.members.find(
              (member: CouncilMember) => member.role === CouncilRole.MEMBER
            )?.expert?.id || "",
          organization: thesisProject.organization?.Id ?? "",
          score: thesisProject.defenseRecord?.finalScore?.toString() || "",
          researchTopicAssociated: thesisProject.researchTopicAssociated || "",
        }
      }
    })

    setEditingRowKeys(newEditingRowKeys)
    setEditingValues(initialEditingValues)
  }
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState<string | undefined>(
    undefined
  )
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [pendingSignExportTemplateId, setPendingSignExportTemplateId] = useState<string | null>(
    null
  )
  const [signRole, setSignRole] = useState<"chief" | "deputy">("chief")
  const [signingDate, setSigningDate] = useState<ReturnType<typeof dayjs>>(dayjs())
  const [signMoneyAmount, setSignMoneyAmount] = useState<number>(100000)

  const readDecimalAmount = (v: unknown): number => {
    if (v == null) return 0
    if (typeof v === "number") return v
    if (typeof v === "string") return Number(v) || 0
    if (typeof (v as { toNumber?: () => number }).toNumber === "function") {
      return (v as { toNumber: () => number }).toNumber()
    }
    return Number(v) || 0
  }

  const getDefaultSupervisorPay = (
    role: SupervisorRole,
    inAcademy: boolean,
    thesisDesc: "THESIS" | "PROJECT"
  ) => {
    const row =
      defaultSupervisorPayAmounts.find(
        (x) => x.role === role && x.inAcademy === inAcademy && x.description === thesisDesc
      ) ||
      defaultSupervisorPayAmounts.find(
        (x) => x.role === role && x.inAcademy === inAcademy && !x.description
      )
    return row ? readDecimalAmount(row.amount) : 0
  }

  const ensureSupervisorPaymentsForExport = useCallback(
    async (project: any) => {
      if (!project?.id) return

      const thesisDesc: "THESIS" | "PROJECT" =
        project.thesisType === ThesisType.THESIS ? "THESIS" : "PROJECT"

      const supExpert = project.supervisor || null
      const coExpert = project.coSupervisor || null

      if (!supExpert && !coExpert) return

      const paymentAmount = (p: any) => readDecimalAmount(p?.amount)

      const deletePaymentHard = async (id?: string | null) => {
        if (!id) return
        try {
          await deleteSupervisorPaymentRecord({ where: { id } })
        } catch {
          // đã xoá hoặc không tồn tại
        }
      }

      const oldSupPayId = project.supervisorPaymentId as string | undefined
      const oldCoPayId = project.coSupervisorPaymentId as string | undefined
      const oldSinglePayId = project.singleSupervisorPaymentId as string | undefined

      if (supExpert && coExpert) {
        const inAcSup = !!(supExpert.lecturer || supExpert.lecturerId)
        const inAcCo = !!(coExpert.lecturer || coExpert.lecturerId)
        const amtSup = getDefaultSupervisorPay(SupervisorRole.SUPERVISOR, inAcSup, thesisDesc)
        const amtCo = getDefaultSupervisorPay(SupervisorRole.CO_SUPERVISOR, inAcCo, thesisDesc)

        const supMissing =
          !project.supervisorPaymentId || paymentAmount(project.supervisorPayment) <= 0
        const coMissing =
          !project.coSupervisorPaymentId || paymentAmount(project.coSupervisorPayment) <= 0
        const mustClearSingle = !!oldSinglePayId

        if (!supMissing && !coMissing && !mustClearSingle) return

        if (!supMissing && !coMissing && mustClearSingle) {
          await updateThesisProject({
            where: { id: project.id },
            data: {
              singleSupervisorPayment: { disconnect: true },
            },
          })
          if (oldSinglePayId) await deletePaymentHard(oldSinglePayId)
          project.singleSupervisorPaymentId = null
          project.singleSupervisorPayment = null
          return
        }

        let newSupId = oldSupPayId
        let newCoId = oldCoPayId

        if (supMissing) {
          const created = await createSupervisorPaymentRecord({
            data: {
              amount: new Decimal(amtSup),
              status: PaymentStatus.PENDING,
              thesisProjects: { connect: { id: project.id } },
            },
          })
          if (!created?.id) return
          newSupId = created.id
        }

        if (coMissing) {
          const created = await createSupervisorPaymentRecord({
            data: {
              amount: new Decimal(amtCo),
              status: PaymentStatus.PENDING,
              coThesisProjects: { connect: { id: project.id } },
            },
          })
          if (!created?.id) return
          newCoId = created.id
        }

        await updateThesisProject({
          where: { id: project.id },
          data: {
            singleSupervisorPayment: { disconnect: true },
            supervisorPayment: newSupId ? { connect: { id: newSupId } } : { disconnect: true },
            coSupervisorPayment: newCoId ? { connect: { id: newCoId } } : { disconnect: true },
          },
        })

        if (mustClearSingle && oldSinglePayId) {
          await deletePaymentHard(oldSinglePayId)
        }
        if (supMissing && oldSupPayId && newSupId && oldSupPayId !== newSupId) {
          await deletePaymentHard(oldSupPayId)
        }
        if (coMissing && oldCoPayId && newCoId && oldCoPayId !== newCoId) {
          await deletePaymentHard(oldCoPayId)
        }

        project.singleSupervisorPaymentId = null
        project.singleSupervisorPayment = null
        project.supervisorPaymentId = newSupId
        project.coSupervisorPaymentId = newCoId
        project.supervisorPayment = newSupId
          ? { ...(project.supervisorPayment || {}), id: newSupId, amount: amtSup }
          : null
        project.coSupervisorPayment = newCoId
          ? { ...(project.coSupervisorPayment || {}), id: newCoId, amount: amtCo }
          : null
        return
      }

      const expert = supExpert || coExpert
      if (!expert) return

      const inAc = !!(expert.lecturer || expert.lecturerId)
      const amtSingle = getDefaultSupervisorPay(SupervisorRole.SINGLE, inAc, thesisDesc)

      const singleMissing =
        !project.singleSupervisorPaymentId || paymentAmount(project.singleSupervisorPayment) <= 0
      const mustClearDual = !!(oldSupPayId || oldCoPayId)

      if (!singleMissing && !mustClearDual) return

      if (!singleMissing && mustClearDual) {
        await updateThesisProject({
          where: { id: project.id },
          data: {
            supervisorPayment: { disconnect: true },
            coSupervisorPayment: { disconnect: true },
          },
        })
        if (oldSupPayId) await deletePaymentHard(oldSupPayId)
        if (oldCoPayId) await deletePaymentHard(oldCoPayId)
        project.supervisorPaymentId = null
        project.coSupervisorPaymentId = null
        project.supervisorPayment = null
        project.coSupervisorPayment = null
        return
      }

      let newSingleId = oldSinglePayId

      if (singleMissing) {
        const created = await createSupervisorPaymentRecord({
          data: {
            amount: new Decimal(amtSingle),
            status: PaymentStatus.PENDING,
            singleSupervisorPayment: { connect: { id: project.id } },
          },
        })
        if (!created?.id) return
        newSingleId = created.id
      }

      await updateThesisProject({
        where: { id: project.id },
        data: {
          supervisorPayment: { disconnect: true },
          coSupervisorPayment: { disconnect: true },
          singleSupervisorPayment: newSingleId
            ? { connect: { id: newSingleId } }
            : { disconnect: true },
        },
      })

      if (oldSupPayId) await deletePaymentHard(oldSupPayId)
      if (oldCoPayId) await deletePaymentHard(oldCoPayId)
      if (singleMissing && oldSinglePayId && newSingleId && oldSinglePayId !== newSingleId) {
        await deletePaymentHard(oldSinglePayId)
      }

      project.supervisorPaymentId = null
      project.coSupervisorPaymentId = null
      project.supervisorPayment = null
      project.coSupervisorPayment = null
      project.singleSupervisorPaymentId = newSingleId
      project.singleSupervisorPayment = newSingleId
        ? { ...(project.singleSupervisorPayment || {}), id: newSingleId, amount: amtSingle }
        : null
    },
    [
      createSupervisorPaymentRecord,
      defaultSupervisorPayAmounts,
      deleteSupervisorPaymentRecord,
      updateThesisProject,
    ]
  )

  type SignerPayload = {
    signerName: string
    isChief: boolean
    signingDate?: Date
    moneyAmount?: number
  }

  const buttonList: Array<{
    id: number
    label: string
    needModal?: boolean
    needSign?: boolean
    needMoney?: boolean
    disabled?: boolean
    onClick: (signer?: SignerPayload) => Promise<unknown>
  }> = [
    {
      id: 1,
      label: "Phụ lục danh sách luận văn",
      needModal: true,
      needSign: true,
      onClick: async () =>
        await exportPhuLucDsLuanVan({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 2,
      label: "Sao quyết định hướng dẫn luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportSaoQDHDLV({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
          signingDate: signer?.signingDate,
        }),
    },
    {
      id: 3,
      label: "Giấy mời hướng dẫn luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportGiayMoiHdlv({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          isChief: signer?.isChief,
          signerName: signer?.signerName,
          signingDate: signer?.signingDate,
        }),
    },
    {
      id: 5,
      label: "Giấy mời chấm luận văn phản biện",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportGiayMoiChamLvPb({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
          signingDate: signer?.signingDate,
        }),
    },
    {
      id: 6,
      label: "Phụ lục quyết định hội đồng bảo vệ",
      onClick: async () =>
        await exportPhuLucQdhdd({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 6.1,
      label: "Bản sao hội đồng đánh giá luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportBanSaoHDDGLV({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
          signingDate: signer?.signingDate,
        }),
    },
    {
      id: 8,
      label: "Hồ sơ bảo vệ luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportHosobvlv({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
        }),
    },
    {
      id: 9,
      label: "Danh sách bảo vệ",
      onClick: async () =>
        await exportDanhSachBaoVe({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 10,
      label: "Danh sách bảo vệ(Dán PBV)",
      onClick: async () => {
        exportDanhSachBaoVeDanNgoaiPhong({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        })
      },
    },
    {
      id: 11,
      label: "Thanh toán hội đồng bảo vệ",
      onClick: async () =>
        await exportThanhToanHoiDongBaoVe({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
          defaultCouncilPayAmounts,
          createCouncilPaymentRecord: async ({ councilMemberId, amount }) =>
            await createPaymentRecord({
              data: {
                amount,
                councilMember: {
                  connect: { id: councilMemberId },
                },
              },
            }),
        }),
    },
    {
      id: 12,
      label: "Danh sách chuyên gia",
      needModal: true,
      needMoney: true,
      needSign: false,
      onClick: async (signer?: SignerPayload) =>
        await exportDsChuyenGia({
          allStudentsInClasses,
          showSpinner,
          thesisSessionId: searchParams.thesisSessionId,
          hideSpinner,
          message,
          moneyAmount: signer?.moneyAmount,
          signingDate: signer?.signingDate,
        }),
    },

    {
      id: 13,
      label: "Thanh toán hướng dẫn",
      onClick: async () => {
        console.log("students", students)
        await exportThanhToanHuongDanTrongHv({
          allStudentsInClasses,
          showSpinner,
          thesisSessionId: searchParams.thesisSessionId,
          hideSpinner,
          message,
          ensureSupervisorPaymentsForExport,
        })
      },
    },
    {
      id: 14,
      label: "Thống kê chuyên gia hướng dẫn luận văn",
      onClick: async () =>
        await exportThongKeCbHdlv({
          allStudentsInClasses,
          showSpinner,
          thesisSessionId: searchParams.thesisSessionId,
          hideSpinner,
          message,
        }),
    },
    {
      id: 15,
      label: "Thống kê cán bộ tham gia hội đồng bảo vệ",
      onClick: async () =>
        await exportThongKeCbThamGiaHd({
          allStudentsInClasses,
          showSpinner,
          thesisSessionId: searchParams.thesisSessionId,
          hideSpinner,
          message,
        }),
    },
    {
      id: 15.1,
      label: "Thống kê cơ quan đơn vị cán bộ (ngoài học viên)",
      onClick: async () =>
        await exportThongKeCoQuanDonViCanBoNgoaiHv({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 16,
      label: "Thống kê kết quả bảo vệ luận văn",
      onClick: async () =>
        await exportKetQuaBaoVeLuanVan({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 19,
      label: "Danh sách nộp luận văn thư viện",
      onClick: async () =>
        await exportDanhSachNopLuanVanThuVien({
          allStudentsInClasses,
          thesisSessionId: searchParams.thesisSessionId,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
  ]

  const handleExportExcelFromTemplate = async () => {
    if (!selectedPrintTemplateId) {
      message.warning("Vui lòng chọn mẫu in trước khi xuất file.")
      return
    }

    const selected = buttonList.find((i) => String(i.id) === selectedPrintTemplateId)
    if (!selected || selected.disabled) {
      message.warning("Mẫu in hiện không khả dụng.")
      return
    }

    if (selected.needModal) {
      const thesisSessionId = searchParams.thesisSessionId?.trim()
      if (!thesisSessionId) {
        message.warning("Vui lòng chọn đợt xét trước khi xuất file.")
        return
      }
      const session = thesisSessionData?.find((s) => s.id === thesisSessionId)
      if (!session) {
        message.warning("Không tìm thấy thông tin đợt xét.")
        return
      }
      setSignRole(session.chief?.trim() ? "chief" : "deputy")
      setSigningDate(dayjs())
      setSignMoneyAmount(100000)
      setPendingSignExportTemplateId(selectedPrintTemplateId)
      setSignModalOpen(true)
      return
    }

    await selected.onClick()
  }

  const handleConfirmSignExport = async () => {
    if (!pendingSignExportTemplateId) return
    const selected = buttonList.find((i) => String(i.id) === pendingSignExportTemplateId)
    if (!selected?.onClick) return
    const session = selectedThesisSession
    if (!session) {
      message.warning("Không tìm thấy thông tin đợt xét.")
      return
    }
    const chiefName = (session.chief ?? "").trim()
    const deputyName = (session.deputy ?? "").trim()
    const signerName = signRole === "chief" ? chiefName : deputyName
    const isChief = signRole === "chief" ? true : false
    if (selected.needSign && !signerName) {
      message.warning(
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó phòng"} sau đại học trong đợt xét.`
      )
      return
    }
    if (selected.needMoney && (!signMoneyAmount || signMoneyAmount <= 0)) {
      message.warning("Vui lòng nhập số tiền hợp lệ.")
      return
    }
    setSignModalOpen(false)
    setPendingSignExportTemplateId(null)
    await selected.onClick({
      signerName: selected.needSign ? signerName : "",
      isChief: selected.needSign ? isChief : false,
      signingDate: signingDate?.toDate?.() ?? undefined,
      moneyAmount: selected.needMoney ? (signMoneyAmount ?? undefined) : undefined,
    })
  }

  const handleCancelSignModal = () => {
    setSignModalOpen(false)
    setPendingSignExportTemplateId(null)
    setSigningDate(dayjs())
    setSignMoneyAmount(100000)
  }

  const handleAssignDates = async () => {
    if (role !== "P7") {
      message.warning("Chỉ tài khoản P7 mới được gán hạn nhập đề tài và hạn nhập hội đồng.")
      return
    }
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt xét trước khi gán ngày.")
      return
    }
    const topicEntryDeadline = form.getFieldValue("topicEntryDeadline") as
      | ReturnType<typeof dayjs>
      | undefined
    const councilDeadline = form.getFieldValue("councilDeadline") as
      | ReturnType<typeof dayjs>
      | undefined
    showSpinner()
    try {
      await updateThesisSession({
        where: { id: thesisSessionId },
        data: {
          topicEntryDeadline: topicEntryDeadline?.toDate?.() ?? null,
          councilDeadline: councilDeadline?.toDate?.() ?? null,
        },
      })
      message.success("Đã gán ngày thành công")
      queryClient.invalidateQueries({ queryKey: ["ThesisSession"] })
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      if (err?.info?.message) {
        message.error(err.info.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  const chiefDisplay = selectedThesisSession?.chief?.trim() || "(chưa nhập)"
  const deputyDisplay = selectedThesisSession?.deputy?.trim() || "(chưa nhập)"
  const pendingSignExport = buttonList.find((i) => String(i.id) === pendingSignExportTemplateId)

  return (
    <div>
      <Modal
        title="Tham số xuất file"
        open={signModalOpen}
        onCancel={handleCancelSignModal}
        footer={[
          <Button key="cancel" onClick={handleCancelSignModal}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={() => void handleConfirmSignExport()}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <p className="mb-3 text-gray-600">
          Đợt xét hiện tại: {selectedThesisSession?.name ?? "—"}.
        </p>
        {pendingSignExport?.needSign ? (
          <>
            <Radio.Group
              value={signRole}
              onChange={(e) => setSignRole(e.target.value)}
              className="flex flex-col gap-3"
            >
              <Radio value="chief">
                Trưởng phòng sau đại học: <strong>{chiefDisplay}</strong>
              </Radio>
              <Radio value="deputy">
                Phó phòng sau đại học: <strong>{deputyDisplay}</strong>
              </Radio>
            </Radio.Group>
          </>
        ) : null}
        <div className="mt-4">
          <div className="mb-2 text-gray-700">Thời gian ký</div>
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            value={signingDate}
            onChange={(value) => setSigningDate(value || dayjs())}
            placeholder="Chọn thời gian ký"
          />
        </div>

        {pendingSignExport?.needMoney ? (
          <div className="mt-4">
            <div className="mb-2 text-gray-700">Số tiền (VNĐ)</div>
            <InputNumber
              className="w-full"
              min={0}
              value={signMoneyAmount}
              placeholder="Nhập số tiền"
              formatter={(value) =>
                value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
              }
              parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
              onChange={(value) => setSignMoneyAmount(typeof value === "number" ? value : 100000)}
            />
          </div>
        ) : null}
      </Modal>
      <Row gutter={[8, 0]}>
        <Col span={24}>
          <Form form={form} layout="horizontal" className="w-full">
            <Row gutter={[8, 8]} align="top" justify="space-between">
              <Col span={36}>
                <Flex gap={12} className="flex flex-wrap items-end gap-2">
                  <Form.Item name="thesisSessionId" label="Đợt xét" required>
                    <Select
                      className="w-36"
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ minWidth: 300 }}
                      options={thesisSessionData?.map((item) => ({
                        label: item.name,
                        value: item.id,
                      }))}
                      onChange={(value) => {
                        setSearchParams({
                          ...searchParams,
                          thesisSessionId: value as string,
                        })
                        setTrainingCourseId(
                          thesisSessionData?.find((x) => x.id === value)?.trainingCourse?.id || null
                        )
                        setCurrentPage(1)
                        setEditingRowKeys([])
                      }}
                      placeholder="Chọn đợt xét"
                    />
                  </Form.Item>
                  <Form.Item label="Khóa học" required>
                    <Input
                      className="w-36"
                      value={trainingCourse?.name || ""}
                      placeholder="Chọn khóa học"
                      readOnly={true}
                    />
                  </Form.Item>

                  <Form.Item name="fixedClassId" label="Lớp học">
                    <Select
                      mode="multiple"
                      className=" w-64"
                      maxTagCount="responsive"
                      maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                      options={fixedClasses?.map((x) => {
                        return {
                          label: x.name,
                          value: x.id,
                        }
                      })}
                      placeholder="Chọn lớp học"
                      onChange={(value) => {
                        setSearchParams({
                          ...searchParams,
                          fixedClassId: value as string[],
                        })
                        setCurrentPage(1)
                        setEditingRowKeys([])
                      }}
                    />
                  </Form.Item>
                  <Form.Item name="organizationId" label="Khoa quản lí">
                    <TreeSelect
                      className="w-80"
                      placeholder="Chọn khoa quản lý"
                      allowClear={role !== "Khoa"}
                      disabled={role === "Khoa"}
                      showSearch
                      treeDefaultExpandAll
                      treeData={treeOrgData}
                      onChange={(value) => {
                        setSearchParams({
                          ...searchParams,
                          organizationId: value as string,
                        })
                        setCurrentPage(1)
                        setEditingRowKeys([])
                      }}
                    />
                  </Form.Item>
                  {/* <Form.Item label="Tìm kiếm">
                    <Input
                      className="w-48"
                      allowClear
                      value={nameKeyword}
                      placeholder="Tên học viên / GVHD"
                      onChange={(e) => setNameKeyword(e.target.value)}
                    />
                  </Form.Item> */}

                  <Form.Item className="flex justify-end gap-3">
                    {role === "P7" && (
                      <Button
                        type="primary"
                        className="ml-2"
                        onClick={() => {
                          const thesisSessionId = searchParams.thesisSessionId?.trim()
                          if (!thesisSessionId) {
                            message.warning("Vui lòng chọn đợt luận văn trước khi tạo dữ liệu mẫu.")
                            return
                          }
                          setEditingRowKeys([])
                          openModalTaoDuLieuMau({
                            thesisSessionId,
                            students: allStudentsInClasses,
                            onSuccess: refetchThesisTableData,
                          })
                        }}
                      >
                        Tạo dữ liệu mẫu
                      </Button>
                    )}
                    {editingRowKeys.length > 0 ? (
                      <>
                        <Button
                          type="default"
                          className="ml-2"
                          onClick={() => {
                            setEditingRowKeys([])
                            setEditingValues({})
                            message.info("Đã hủy tất cả các thay đổi chưa lưu.")
                          }}
                        >
                          Hủy thay đổi
                        </Button>
                        <Button
                          type="primary"
                          className="ml-2"
                          onClick={handleBatchSave} // Gọi hàm lưu hàng loạt
                        >
                          Lưu thay đổi
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="default"
                        className="ml-2"
                        onClick={handleActivateEdit}
                        disabled={!students?.length}
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                    <Button
                      type="primary"
                      className="ml-2"
                      onClick={() =>
                        openModalChuyenDiemLopMonHoc({
                          allStudentsInClasses: allStudentsInClasses,
                        })
                      }
                      disabled={!students?.length}
                    >
                      Gán điểm sang LMH
                    </Button>
                  </Form.Item>
                </Flex>
              </Col>
            </Row>
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Space size={12} align="end" wrap className="w-full">
                  {role === "P7" && (
                    <Select
                      className="min-w-72 w-72"
                      placeholder="Chọn mẫu in"
                      dropdownMatchSelectWidth={false}
                      options={buttonList.map((item) => ({
                        label: `${item.id}. ${item.label}`,
                        value: String(item.id),
                        disabled: item.disabled,
                      }))}
                      value={selectedPrintTemplateId}
                      onChange={(value) =>
                        setSelectedPrintTemplateId(value ? String(value) : undefined)
                      }
                    />
                  )}
                  {role === "P7" && (
                    <Button
                      type="primary"
                      onClick={handleExportExcelFromTemplate}
                      disabled={!selectedPrintTemplateId}
                    >
                      Xuất file
                    </Button>
                  )}
                  <Form.Item
                    name="topicEntryDeadline"
                    label="Hạn nhập đề tài"
                    className="mb-0"
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-40"
                      allowClear
                      placeholder="Chọn ngày"
                      disabled={role !== "P7"}
                    />
                  </Form.Item>
                  <Form.Item
                    name="councilDeadline"
                    label="Hạn nhập hội đồng"
                    className="mb-0"
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-40"
                      allowClear
                      placeholder="Chọn ngày"
                      disabled={role !== "P7"}
                    />
                  </Form.Item>
                  {role === "P7" && (
                    <Button type="primary" onClick={handleAssignDates}>
                      Gán ngày
                    </Button>
                  )}

                  {role === "Khoa" && (
                    <Button
                      type="primary"
                      onClick={async () => {
                        await exportHDDanhGiaLuanVan({
                          allStudentsInClasses,
                          thesisSessionId: searchParams.thesisSessionId,
                          showSpinner,
                          hideSpinner,
                          message,
                        })
                      }}
                    >
                      Đề xuất hội đồng
                    </Button>
                  )}
                  {role === "Khoa" && (
                    <Button
                      type="primary"
                      onClick={async () => {
                        await exportKiemTraTienDo({
                          allStudentsInClasses,
                          thesisSessionId: searchParams.thesisSessionId,
                          showSpinner,
                          hideSpinner,
                          message,
                        })
                      }}
                    >
                      Kiểm tra tiến độ
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Form>
        </Col>

        <Col span={24}>
          <Table
            bordered
            scroll={{ x: "max-content" }}
            className={"mt-2"}
            rowKey="id"
            filters={filters}
            setFilters={(value: any) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "Khoa quản lí",
                dataIndex: "organization",
                width: 100,
                fixed: "left",
                align: "center",
                render: (_, record) => {
                  const status =
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.status || ""
                  if (editingRowKeys.includes(record?.id) && role === "P7") {
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TreeSelect
                          className="w-full"
                          treeData={treeOrgData}
                          placeholder="Chọn đơn vị quản lý"
                          allowClear
                          showSearch
                          treeDefaultExpandAll
                          defaultValue={
                            getThesisProjectForSession(record, searchParams.thesisSessionId)
                              ?.organization?.Id || ""
                          }
                          onChange={(value) => handleEditChange(record?.id, "organization", value)}
                        />
                      </div>
                    )
                  }
                  if (
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.organization
                  ) {
                    return (
                      `${
                        getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.organization?.sMa || ""
                      } ` || "N/A "
                    )
                  }
                  return ""
                },
              },
              {
                title: "Mã sinh viên",
                width: 120,
                fixed: "left",
                dataIndex: "code",
                type: "input",
                render: (_, record) => {
                  return record?.code
                },
              },
              {
                title: "Họ tên học viên",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                type: "input",
                render: (_, record) => {
                  return record?.userProfile?.fullname
                },
              },
              {
                title: "Ngày sinh",
                width: 120,
                dataIndex: "dateOfBirth",
                align: "center",
                render: (_, record) => {
                  return record?.userProfile?.dateOfBirth
                    ? dayjs(record?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                    : ""
                },
              },
              {
                title: "Lớp quản lí ",
                width: 250,
                dataIndex: "fixedClass",
                align: "center",
                render: (_, record) => {
                  return record?.fixedClass?.name || ""
                },
              },
              {
                title: "Đề tài",
                width: 350,
                // fixed: "left",
                type: "input",
                dataIndex: "title",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.title !== undefined
                        ? editingValues[record?.id]?.title
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)?.title ||
                          ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextArea
                          rows={3}
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          defaultValue={currentValue}
                          onBlur={(e) => {
                            handleEditChange(record?.id, "title", e.target.value)
                          }}
                        />
                      </div>
                    )
                  }
                  return (
                    <p className="line-clamp-2">
                      {getThesisProjectForSession(record, searchParams.thesisSessionId)?.title ||
                        ""}
                    </p>
                  )
                },
              },
              {
                title: "GVHD 1",
                width: 200,
                type: "input",
                dataIndex: "supervisor",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedSupervisor = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "supervisor"
                    )
                    const hasEditedCoSupervisor = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "coSupervisor"
                    )
                    const currentValue = hasEditedSupervisor
                      ? editingValues[record?.id]?.supervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)?.supervisor
                          ?.id || ""
                    const coSupervisorPeerId = hasEditedCoSupervisor
                      ? editingValues[record?.id]?.coSupervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.coSupervisor?.id
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          options={expertProfileData
                            ?.filter(
                              (item) =>
                                !coSupervisorPeerId || item.id !== String(coSupervisorPeerId)
                            )
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "supervisor",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  const supervisor = getThesisProjectForSession(
                    record,
                    searchParams.thesisSessionId
                  )?.supervisor

                  return getSupervisorName(supervisor, true, true)
                },
              },
              {
                title: "GVHD 2",
                width: 200,
                // fixed: "left",
                type: "input",
                dataIndex: "coSupervisor",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedCoSupervisor = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "coSupervisor"
                    )
                    const hasEditedSupervisor = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "supervisor"
                    )
                    const currentValue = hasEditedCoSupervisor
                      ? editingValues[record?.id]?.coSupervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.coSupervisor?.id || ""
                    const supervisorPeerId = hasEditedSupervisor
                      ? editingValues[record?.id]?.supervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)?.supervisor
                          ?.id

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          className="w-full"
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          options={expertProfileData
                            ?.filter(
                              (item) => !supervisorPeerId || item.id !== String(supervisorPeerId)
                            )
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "coSupervisor",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  const coSupervisor = getThesisProjectForSession(
                    record,
                    searchParams.thesisSessionId
                  )?.coSupervisor
                  return getSupervisorName(coSupervisor, true, true)
                },
              },
              {
                title: "Gán với đề tài nghiên cứu",
                width: 350,
                dataIndex: "researchTopicAssociated",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.researchTopicAssociated !== undefined
                        ? editingValues[record?.id]?.researchTopicAssociated
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)
                            ?.researchTopicAssociated || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextArea
                          rows={2}
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          defaultValue={currentValue}
                          onBlur={(e) => {
                            handleEditChange(record?.id, "researchTopicAssociated", e.target.value)
                          }}
                        />
                      </div>
                    )
                  }
                  return (
                    <p className="line-clamp-2">
                      {getThesisProjectForSession(record, searchParams.thesisSessionId)
                        ?.researchTopicAssociated || ""}
                    </p>
                  )
                },
              },
              {
                title: "Ngôn ngữ",
                width: 100,
                dataIndex: "language",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.language !== undefined
                        ? editingValues[record?.id]?.language
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)?.language
                            ?.language || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={currentValue || ""}
                          onChange={(e) => handleEditChange(record?.id, "language", e.target.value)}
                        />
                      </div>
                    )
                  }
                  return (
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.language || ""
                  )
                },
              },
              {
                title: "Luận văn/Đề án",
                width: 130,
                dataIndex: "type",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.type !== undefined
                        ? editingValues[record?.id]?.type
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)?.type ||
                          ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={["Luận văn", "Đề án"].map((item) => ({
                            label: item,
                            value: item,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) => handleEditChange(record?.id, "type", value)}
                        />
                      </div>
                    )
                  }
                  return (
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.type || ""
                  )
                },
              },

              {
                title: "Chủ tịch ",
                width: 200,
                dataIndex: "councilChairman",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedCouncilChairman = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "councilChairman"
                    )
                    const currentValue = hasEditedCouncilChairman
                      ? editingValues[record?.id]?.councilChairman
                      : getThesisProjectForSession(
                          record,
                          searchParams.thesisSessionId
                        )?.council?.members?.find(
                          (member: CouncilMember) => member.role === CouncilRole.CHAIRMAN
                        )?.expert?.id || ""
                    const councilRow = editingValues[record?.id] || {}
                    const excludedCouncilIds = getCouncilExpertIdsExcludingField(
                      councilRow,
                      "councilChairman"
                    )
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          className="w-full"
                          disabled={!isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter(
                              (item) =>
                                item.eligiblePresident === true && !excludedCouncilIds.has(item.id)
                            )
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "councilChairman",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(
                    record,
                    CouncilRole.CHAIRMAN,
                    searchParams.thesisSessionId
                  )
                },
              },
              {
                title: "Thư ký",
                width: 200,
                dataIndex: "councilSecretary",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedCouncilSecretary = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "councilSecretary"
                    )
                    const currentValue = hasEditedCouncilSecretary
                      ? editingValues[record?.id]?.councilSecretary
                      : getThesisProjectForSession(
                          record,
                          searchParams.thesisSessionId
                        )?.council?.members?.find(
                          (member: CouncilMember) => member.role === CouncilRole.SECRETARY
                        )?.expert?.id || ""
                    const councilRow = editingValues[record?.id] || {}
                    const excludedCouncilIds = getCouncilExpertIdsExcludingField(
                      councilRow,
                      "councilSecretary"
                    )
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter(
                              (item) =>
                                item.eligibleSecretary === true && !excludedCouncilIds.has(item.id)
                            )
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "councilSecretary",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(
                    record,
                    CouncilRole.SECRETARY,
                    searchParams.thesisSessionId
                  )
                },
              },
              {
                title: "Phản biện 1",
                width: 200,
                dataIndex: "reviewer1",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedReviewer1 = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "reviewer1"
                    )
                    const currentValue = hasEditedReviewer1
                      ? editingValues[record?.id]?.reviewer1
                      : getThesisProjectForSession(
                          record,
                          searchParams.thesisSessionId
                        )?.council?.members?.find(
                          (member: CouncilMember) => member.role === CouncilRole.REVIEWER_1
                        )?.expert?.id || ""
                    const councilRow = editingValues[record?.id] || {}
                    const excludedCouncilIds = getCouncilExpertIdsExcludingField(
                      councilRow,
                      "reviewer1"
                    )
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter((item) => !excludedCouncilIds.has(item.id))
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "reviewer1",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(
                    record,
                    CouncilRole.REVIEWER_1,
                    searchParams.thesisSessionId
                  )
                },
              },
              {
                title: "Phản biện 2",
                width: 200,
                dataIndex: "reviewer2",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedReviewer2 = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "reviewer2"
                    )
                    const currentValue = hasEditedReviewer2
                      ? editingValues[record?.id]?.reviewer2
                      : getThesisProjectForSession(
                          record,
                          searchParams.thesisSessionId
                        )?.council?.members?.find(
                          (member: any) => member.role === CouncilRole.REVIEWER_2
                        )?.expert?.id || ""
                    const councilRow = editingValues[record?.id] || {}
                    const excludedCouncilIds = getCouncilExpertIdsExcludingField(
                      councilRow,
                      "reviewer2"
                    )
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter((item) => !excludedCouncilIds.has(item.id))
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#000000" : "#16a34a" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "reviewer2",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(
                    record,
                    CouncilRole.REVIEWER_2,
                    searchParams.thesisSessionId
                  )
                },
              },
              {
                title: "Ủy viên",
                width: 200,
                dataIndex: "councilMember",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedCouncilMember = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "councilMember"
                    )
                    const currentValue = hasEditedCouncilMember
                      ? editingValues[record?.id]?.councilMember
                      : getThesisProjectForSession(
                          record,
                          searchParams.thesisSessionId
                        )?.council?.members?.find(
                          (member: any) => member.role === CouncilRole.MEMBER
                        )?.expert?.id || ""
                    const councilRow = editingValues[record?.id] || {}
                    const excludedCouncilIds = getCouncilExpertIdsExcludingField(
                      councilRow,
                      "councilMember"
                    )
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter((item) => !excludedCouncilIds.has(item.id))
                            .map((item) => {
                              const text = getSupervisorName(item, true, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    style={{ color: hasLecturer ? "#16a34a" : "" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "councilMember",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(
                    record,
                    CouncilRole.MEMBER,
                    searchParams.thesisSessionId
                  )
                },
              },
              {
                title: "Phòng bảo vệ",
                width: 150,
                dataIndex: "room",
                render: (text: string, record: any) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedRoom = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "room"
                    )
                    const currentValue = hasEditedRoom
                      ? editingValues[record?.id]?.room
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)?.room
                          ?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinCouncilEditWindow()}
                          className="w-full"
                          value={currentValue === null ? undefined : currentValue || undefined}
                          options={roomData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          onChange={(value) =>
                            handleEditChange(record?.id, "room", value === undefined ? null : value)
                          }
                        />
                      </div>
                    )
                  }

                  return (
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.room?.name ||
                    ""
                  )
                },
              },
              {
                title: "Ngày bảo vệ",
                width: 150,
                dataIndex: "defenseDate",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.defenseDate !== undefined
                        ? editingValues[record?.id]?.defenseDate
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)
                            ?.defenseDate || ""
                    const dayjsValue = currentValue ? dayjs(currentValue) : null
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DatePicker
                          className="w-full"
                          format="DD/MM/YYYY"
                          disabled={!isWithinCouncilEditWindow()}
                          placeholder="Chọn ngày bảo vệ"
                          value={dayjsValue || undefined}
                          onChange={(value) => handleEditChange(record?.id, "defenseDate", value)}
                        />
                      </div>
                    )
                  }
                  return getThesisProjectForSession(record, searchParams.thesisSessionId)
                    ?.defenseDate
                    ? dayjs(
                        getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.defenseDate
                      ).format("DD/MM/YYYY")
                    : ""
                },
              },

              {
                title: "Thời gian bảo vệ",
                width: 120,
                dataIndex: "defenseSession",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const hasEditedDefenseSession = Object.prototype.hasOwnProperty.call(
                      editingValues[record?.id] || {},
                      "defenseSession"
                    )
                    const currentValue = hasEditedDefenseSession
                      ? editingValues[record?.id]?.defenseSession
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.defenseSession?.id || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 100 }}
                          value={currentValue === null ? undefined : currentValue || undefined}
                          disabled={!isWithinCouncilEditWindow()}
                          placeholder="Chọn thời gian bảo vệ"
                          options={defenseSessionData?.map((item) => ({
                            label: item.startTime ? formatDefenseSessionClock(item.startTime) : "",
                            value: item.id,
                          }))}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "defenseSession",
                              value === undefined ? null : value
                            )
                          }
                        />
                      </div>
                    )
                  }
                  return formatDefenseSessionClock(
                    getThesisProjectForSession(record, searchParams.thesisSessionId)?.defenseSession
                      ?.startTime
                  )
                },
              },
              {
                title: "Điểm",
                width: 100,
                align: "center",
                dataIndex: "score",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.score !== undefined
                        ? editingValues[record?.id]?.score
                        : getThesisProjectForSession(record, searchParams.thesisSessionId)
                            ?.defenseRecord?.finalScore || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <InputNumber
                          className="w-full"
                          min={0}
                          max={10}
                          step={0.1}
                          placeholder="Nhập điểm"
                          value={currentValue}
                          onChange={(value) => handleEditChange(record?.id, "score", value)}
                        />
                      </div>
                    )
                  }
                  return (
                    getThesisProjectForSession(
                      record,
                      searchParams.thesisSessionId
                    )?.defenseRecord?.finalScore?.toString() || ""
                  )
                },
              },
              // {
              //   title: "Trạng thái",
              //   width: 100,
              //   fixed: "right",
              //   dataIndex: "status",
              //   render: (_, record) => {
              //     if (editingRowKeys.includes(record?.id)) {
              //       const currentValue =
              //         editingValues[record?.id]?.status !== undefined
              //           ? editingValues[record?.id]?.status
              //           : getThesisProjectForSession(record, searchParams.thesisSessionId)?.status || ""
              //       return (
              //         <div onClick={(e) => e.stopPropagation()}>
              //           <Select
              //             className="w-full"
              //             options={useThesisProjectStatusOptions()
              //               .ignoreProjectStatus([ThesisProjectStatus.ASSIGNED])
              //               .map((item) => ({
              //                 label: item.label,
              //                 value: item.value,
              //               }))}
              //             value={currentValue || ""}
              //             onChange={(value) => handleEditChange(record?.id, "status", value)}
              //           />
              //         </div>
              //       )
              //     }
              //     const label = getThesisProjectStatusLabel(
              //       getThesisProjectForSession(record, searchParams.thesisSessionId)?.status
              //     )
              //     const color = getThesisProjectStatusColor(
              //       getThesisProjectForSession(record, searchParams.thesisSessionId)?.status
              //     )
              //     return <Tag color={color}>{label}</Tag>
              //   },
              // },
              {
                title: "Thao tác",
                width: 100,
                fixed: "right",
                align: "center",
                render: (_, record) => {
                  if (record?.id) {
                    const status =
                      getThesisProjectForSession(record, searchParams.thesisSessionId)?.status || ""
                    return (
                      <Row className="justify-center gap-2">
                        {/** biome-ignore lint/a11y/noStaticElementInteractions: <React.Fragment> */}
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {status === ThesisProjectStatus.APPROVED_BY_DEPT ? (
                            <ApproveIcon
                              title="Phê duyệt"
                              className="text-lg font-bold text-green-700"
                              size={24}
                              onClick={async () => {
                                let status =
                                  getThesisProjectForSession(record, searchParams.thesisSessionId)
                                    ?.status || ""
                                switch (status) {
                                  case ThesisProjectStatus.APPROVED_BY_DEPT:
                                    status = ThesisProjectStatus.IN_PROGRESS
                                    break
                                }
                                const payload = {
                                  status: status,
                                }
                                await updateThesisProject({
                                  data: payload,
                                  where: {
                                    id: getThesisProjectForSession(
                                      record,
                                      searchParams.thesisSessionId
                                    )?.id,
                                  },
                                })
                              }}
                            />
                          ) : null}
                          {status === ThesisProjectStatus.IN_PROGRESS ? (
                            <ApproveIcon
                              title="Đủ điều kiện bảo vệ"
                              className="text-lg font-bold text-green-700"
                              size={24}
                              onClick={async () => {
                                const payload = {
                                  status: ThesisProjectStatus.DEFENSE_ELIGIBLE,
                                }
                                await updateThesisProject({
                                  data: payload,
                                  where: {
                                    id: getThesisProjectForSession(
                                      record,
                                      searchParams.thesisSessionId
                                    )?.id,
                                  },
                                })
                              }}
                            />
                          ) : null}
                          <SquarePen
                            size={24}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              openModalCauHinhLuanVan({
                                thesisProjectId: getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.id,
                                thesisSessionId: searchParams?.thesisSessionId || "",
                              })
                            }}
                          />
                          <DeleteIcon
                            title="Xóa luận văn/đề án"
                            size={24}
                            className="text-lg font-bold text-red-700"
                            popConfirm={{
                              title: "Xóa luận văn/đề án",
                              description: "Xóa luận văn/đề án . Thao tác không thể hoàn tác.",
                              onConfirm: () => handleDeleteStudentThesis(record),
                            }}
                          />
                        </div>
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            data={students || []}
            rowSelection={rowSelection}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: countStudent || 0,
              onChange: async (page, pageSize) => {
                setEditingRowKeys([])
                setEditingValues({})
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
DanhMucLuanVan.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
