/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <sử dụng onClick để ngăn chặn sự kiện click lồng nhau> */
import Select from "@components/commons/select"
import Table from "@components/commons/table"
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
  FixedClassType,
  ThesisProjectStatus,
  ThesisType,
} from "@workspace/db/client"
import { queryClient } from "@api/index"
import {
  useCountStudent,
  useCreateStudentThesisRegistration,
  useCreateThesisProject,
  useFindManyDefenseSession,
  useFindManyDM_DonVi,
  useFindManyExpertProfile,
  useFindManyFixedClass,
  useFindManyRoom,
  useFindManyStudent,
  useFindManyThesisSession,
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
import { SquarePen } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
export function getCouncilMemberName(record: any, role: CouncilRole) {
  const member = record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
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
  const text = [title, fullname].filter(Boolean).join(" ").trim()
  return (
    <span
      title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
      className={inAcademy ? "text-green-600" : "text-red-600"}
      style={{ color: inAcademy ? "#16a34a" : "#dc2626" }}
    >
      {text}
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
      className={inAcademy ? "text-green-600" : "text-red-600"}
      style={{ color: inAcademy ? "#16a34a" : "#dc2626" }}
    >
      {textWithWorkplace}
    </span>
  ) : (
    textWithWorkplace
  )
}
const { TextArea } = Input

export default function DanhMucLuanVan({ role = "P7" }: DanhMucLuanVanProps) {
  const orgId = window.contextData?.organizationId
  const [form] = Form.useForm<ThesisProjectForm>()
  const [searchParams, setSearchParams] = useState<Partial<ThesisProjectForm>>({})
  const { showSpinner, hideSpinner } = useSpinner()
  const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
  const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [trainingCourseId, setTrainingCourseId] = useState<string | null>(null)
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
  const { data: sDm_Donvi = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const { data: roomData } = useFindManyRoom()
  const { data: defenseSessionData } = useFindManyDefenseSession()

  const treeOrgData = buildOrgTree(sDm_Donvi ?? [], "0")
  const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
    useThesisProjectStatusOptions()

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

    return {
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
      thesisRegistrations: {
        some: {
          thesisProject: {
            thesisSessionId: searchParams.thesisSessionId,
            thesisType: ThesisType.THESIS,
            organizationId: searchParams.organizationId || undefined,
          },
        },
      },
    }
  }, [searchParams, fixedClasses])

  // biome-ignore lint/correctness/useExhaustiveDependencies: dùng cho searchParams
  const allStudentWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] } }
    const filter = {
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
    }

    return filter
  }, [searchParams, fixedClasses])

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
              include: { managementOrganization: true },
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
              include: {
                defenseSession: true,
                thesisSession: {
                  include: {
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
  /** Hạn nhập GVHD: dùng topicEntryDeadline của đợt xét (ThesisSession) */

  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()
  const { mutateAsync: createThesisProject } = useCreateThesisProject()
  const { mutateAsync: createStudentThesisRegistration } = useCreateStudentThesisRegistration()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
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
    setEditingValues((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value,
      },
    }))
  }
  const defaultButtonClick = () => {
    message.info("Tính năng đang trong quá trình phát triển")
  }

  const taodulieumau = async () => {
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi tạo dữ liệu mẫu.")
      return
    }
    showSpinner()
    const createPromises = allStudentsInClasses?.map(async (student) => {
      const fixedClassType = student.fixedClass?.classType
      const organizationId = student.curriculumVersion?.curriculum?.managementOrganizationId
      const typeLabel = fixedClassType === FixedClassType.APPLICATION ? "Đề án" : "Luận văn"
      const hasThesisRegistration = student.thesisRegistrations?.some(
        (registration) =>
          registration.thesisProject?.thesisType === ThesisType.THESIS &&
          registration.thesisProject?.thesisSessionId === thesisSessionId
      )
      if (hasThesisRegistration) {
        return null
      }
      const payload = {
        title: "",
        summary: "",
        titleEN: "",
        maxStudents: 1,
        language: "Tiếng Việt",
        type: typeLabel,
        organization: organizationId
          ? {
              connect: {
                Id: organizationId,
              },
            }
          : { disconnect: true },
        thesisSession: thesisSessionId
          ? {
              connect: {
                id: thesisSessionId,
              },
            }
          : { disconnect: true },
        thesisType: ThesisType.THESIS,
        librarySubmission: {
          create: {
            isHardcopy: false,
            isSoftcopy: false,
            librarianNote: "",
          },
        },
        council: {
          create: {
            proposedDate: new Date(),
            status: CouncilProposalStatus.PENDING,
          },
        },
        defenseRecord: {
          create: {
            isProfileComplete: false,
          },
        },
      }
      const response = await createThesisProject({
        data: {
          ...payload,
        },
      })
      const payloadRegistration = {
        thesisProjectId: response?.id ?? "",
        studentId: student.id,
      }
      const responseRegistration = await createStudentThesisRegistration({
        data: payloadRegistration,
      })
      return { response, responseRegistration }
    })
    try {
      const results = await Promise.all(createPromises || [])
      const skippedCount = results.filter((r) => r === null).length
      if (skippedCount > 0) {
        message.success(
          `Tạo dữ liệu mẫu thành công. Đã bỏ qua ${skippedCount} sinh viên đã có luận văn/đề án.`
        )
      } else {
        message.success("Tạo dữ liệu mẫu thành công")
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu")
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
    if (role === "Khoa") {
      for (const studentId of selectedRowKeys) {
        const rowData = editingValues[studentId.toString()]
        if (!rowData) continue
        const studentRecord = students?.find((s) => s.id === studentId)
        const orig = studentRecord?.thesisRegistrations?.[0]?.thesisProject
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
        const thesisProjectId = studentRecord?.thesisRegistrations?.[0]?.thesisProject?.id

        if (!thesisProjectId || !rowData) return

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
          room: rowData.room ? { connect: { id: rowData.room } } : { disconnect: true },
          defenseSession: rowData.defenseSession
            ? { connect: { id: rowData.defenseSession } }
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

        if (role === "P7") {
          payload.supervisor = rowData.supervisor
            ? { connect: { id: rowData.supervisor } }
            : { disconnect: true }
          payload.coSupervisor = rowData.coSupervisor
            ? { connect: { id: rowData.coSupervisor } }
            : { disconnect: true }
        }

        return await updateThesisProject({
          data: payload,
          where: { id: thesisProjectId },
        })
      })

      await Promise.all(updatePromises.filter((p) => p !== undefined))

      message.success(`Lưu thành công ${selectedRowKeys.length} đề tài đã chỉnh sửa.`)
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại")
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
      const thesisProject = record?.thesisRegistrations?.[0]?.thesisProject
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
            thesisProject.council?.members.find((member) => member.role === CouncilRole.CHAIRMAN)
              ?.expert?.id || "",
          councilSecretary:
            thesisProject.council?.members.find((member) => member.role === CouncilRole.SECRETARY)
              ?.expert?.id || "",
          reviewer1:
            thesisProject.council?.members.find((member) => member.role === CouncilRole.REVIEWER_1)
              ?.expert?.id || "",
          reviewer2:
            thesisProject.council?.members.find((member) => member.role === CouncilRole.REVIEWER_2)
              ?.expert?.id || "",
          councilMember:
            thesisProject.council?.members.find((member) => member.role === CouncilRole.MEMBER)
              ?.expert?.id || "",
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

  type SignerPayload = { signerName: string; isChief: boolean }

  const buttonList: Array<{
    id: number
    label: string
    needSign?: boolean
    disabled?: boolean
    onClick: (signer?: SignerPayload) => Promise<unknown>
  }> = [
    {
      id: 1,
      label: "Phụ lục ds luận văn",
      needSign: true,
      onClick: async () =>
        await exportPhuLucDsLuanVan({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 2,
      label: "Sao QĐ HDLV",
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportSaoQDHDLV({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
        }),
    },
    {
      id: 3,
      label: "Giấy mời HDLV",
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportGiayMoiHdlv({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          isChief: signer?.isChief,
          signerName: signer?.signerName,
        }),
    },
    {
      id: 4,
      label: "Kiếm tra tiến độ",
      onClick: async () =>
        await exportKiemTraTienDo({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 5,
      label: "Giấy mời chấm LV PB",
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportGiayMoiChamLvPb({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
        }),
    },
    {
      id: 6,
      // disabled: true,
      label: "Phụ lục QĐHĐ",
      onClick: async () =>
        await exportPhuLucQdhdd({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 6.1,
      label: "Bản sao HDDGLV",
      needSign: true,
      onClick: async (signer?: SignerPayload) =>
        await exportBanSaoHDDGLV({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          signerName: signer?.signerName,
          isChief: signer?.isChief,
        }),
    },
    // {
    //   id: 7,
    //   label: "Đề xuất hội đồng",
    //   disabled: true,
    //   onClick: async () =>
    //     await exportHDDanhGiaLuanVan({
    //       allStudentsInClasses,
    //       showSpinner,
    //       hideSpinner,
    //       message,
    //     }),
    // },
    {
      id: 8,
      label: "Hồ sơ BV LV",
      onClick: async () =>
        await exportHosobvlv({ allStudentsInClasses, showSpinner, hideSpinner, message }),
    },
    {
      id: 9,
      label: "Danh sách bảo vệ",
      onClick: async () =>
        await exportDanhSachBaoVe({
          allStudentsInClasses,
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
          showSpinner,
          hideSpinner,
          message,
        })
      },
    },
    {
      id: 12,
      label: "Danh sách chuyên gia",
      onClick: async () =>
        await exportDsChuyenGia({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },

    {
      id: 13,
      label: "Thanh toán hướng dẫn",
      onClick: async () =>
        await exportThanhToanHuongDanTrongHv({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          inAcademy: true,
        }),
    },
    {
      id: 13.1,
      label: "Thanh toán hướng dẫn - Ngoài HV",
      onClick: async () =>
        await exportThanhToanHuongDanTrongHv({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
          inAcademy: false,
        }),
    },
    {
      id: 14,
      label: "Thống kê CBHD LV",
      onClick: async () =>
        await exportThongKeCbHdlv({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 15,
      label: "Thống kê cán bộ tham gia HĐ",
      onClick: async () =>
        await exportThongKeCbThamGiaHd({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 15.1,
      label: "Thống kê cơ quan đơn vị cán bộ (ngoài HV)",
      onClick: async () =>
        await exportThongKeCoQuanDonViCanBoNgoaiHv({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 16,
      label: "Thống kê KQ BV LV",
      onClick: async () =>
        await exportKetQuaBaoVeLuanVan({
          allStudentsInClasses,
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
          showSpinner,
          hideSpinner,
          message,
        }),
    },
    {
      id: 11,
      label: "Thanh toán hội đồng bảo vệ",
      onClick: async () =>
        await exportThanhToanHoiDongBaoVe({
          allStudentsInClasses,
          showSpinner,
          hideSpinner,
          message,
        }),
    },
  ]

  const handleExportExcelFromTemplate = async () => {
    if (!selectedPrintTemplateId) {
      message.warning("Vui lòng chọn mẫu in trước khi xuất excel.")
      return
    }

    const selected = buttonList.find((i) => String(i.id) === selectedPrintTemplateId)
    if (!selected || selected.disabled) {
      message.warning("Mẫu in hiện không khả dụng.")
      return
    }

    if (selected.needSign) {
      const thesisSessionId = searchParams.thesisSessionId?.trim()
      if (!thesisSessionId) {
        message.warning("Vui lòng chọn đợt xét trước khi xuất Excel.")
        return
      }
      const session = thesisSessionData?.find((s) => s.id === thesisSessionId)
      if (!session) {
        message.warning("Không tìm thấy thông tin đợt xét.")
        return
      }
      setSignRole(session.chief?.trim() ? "chief" : "deputy")
      setPendingSignExportTemplateId(selectedPrintTemplateId)
      setSignModalOpen(true)
      return
    }

    await selected.onClick()
  }

  const handleConfirmSignExport = async () => {
    if (!pendingSignExportTemplateId) return
    const session = selectedThesisSession
    if (!session) {
      message.warning("Không tìm thấy thông tin đợt xét.")
      return
    }
    const chiefName = (session.chief ?? "").trim()
    const deputyName = (session.deputy ?? "").trim()
    const signerName = signRole === "chief" ? chiefName : deputyName
    const isChief = signRole === "chief" ? true : false
    if (!signerName) {
      message.warning(
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó phòng"} sau đại học trong đợt xét.`
      )
      return
    }
    const selected = buttonList.find((i) => String(i.id) === pendingSignExportTemplateId)
    if (!selected?.onClick) return
    setSignModalOpen(false)
    setPendingSignExportTemplateId(null)
    await selected.onClick({ signerName, isChief })
  }

  const handleCancelSignModal = () => {
    setSignModalOpen(false)
    setPendingSignExportTemplateId(null)
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

  return (
    <div>
      <Modal
        title="Chọn người ký"
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
                      //allowClear={role !== "Khoa"}
                      //disabled={role === "Khoa"}
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

                  <Form.Item className="flex justify-end gap-3">
                    {role === "P7" && (
                      <Popconfirm
                        placement="rightTop"
                        title="Xác nhận thêm dữ liệu"
                        description="Bạn có chắc chắn muốn thêm?"
                        onConfirm={async () => {
                          setEditingRowKeys([])
                          await taodulieumau()
                        }}
                      >
                        <Button type="primary" className="ml-2">
                          Thêm
                        </Button>
                      </Popconfirm>
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
                        //disabled={!students?.length}
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                    {/* <Button
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
                    </Button> */}
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
                      Xuất Excel
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
                          showSpinner,
                          hideSpinner,
                          message,
                        })
                      }}
                    >
                      Đề xuất hội đồng
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
            columns={[
              {
                title: "Khoa quản lí",
                dataIndex: "organization",
                width: 100,
                fixed: "left",
                align: "center",
                render: (_, record) => {
                  const status = record?.thesisRegistrations?.[0]?.thesisProject?.status || ""
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
                            record?.thesisRegistrations?.[0]?.thesisProject?.organization?.Id || ""
                          }
                          onChange={(value) => handleEditChange(record?.id, "organization", value)}
                        />
                      </div>
                    )
                  }
                  if (record?.thesisRegistrations?.[0]?.thesisProject?.organization) {
                    return (
                      `${
                        record?.thesisRegistrations?.[0]?.thesisProject?.organization?.sMa || ""
                      } ` || "N/A "
                    )
                  }
                  return ""
                },
              },
              {
                title: "Mã sinh viên",
                width: 100,
                fixed: "left",
                render: (_, record) => {
                  return record?.code
                },
              },
              {
                title: "Họ tên",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.fullname
                },
              },
              {
                title: "Ngày sinh",
                width: 100,
                dataIndex: "name",
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
                dataIndex: "title",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.title !== undefined
                        ? editingValues[record?.id]?.title
                        : record?.thesisRegistrations?.[0]?.thesisProject?.title || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextArea
                          rows={3}
                          // disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
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
                      {record?.thesisRegistrations?.[0]?.thesisProject?.title || ""}
                    </p>
                  )
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
                        : record?.thesisRegistrations?.[0]?.thesisProject
                            ?.researchTopicAssociated || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextArea
                          rows={2}
                          // disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
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
                      {record?.thesisRegistrations?.[0]?.thesisProject?.researchTopicAssociated ||
                        ""}
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
                        : record?.thesisRegistrations?.[0]?.thesisProject?.language?.language || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={currentValue || ""}
                          onChange={(e) => handleEditChange(record?.id, "language", e.target.value)}
                        />
                      </div>
                    )
                  }
                  return record?.thesisRegistrations?.[0]?.thesisProject?.language || ""
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
                        : record?.thesisRegistrations?.[0]?.thesisProject?.type || ""
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
                  return record?.thesisRegistrations?.[0]?.thesisProject?.type || ""
                },
              },
              {
                title: "GVHD 1",
                width: 150,
                dataIndex: "supervisor",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.supervisor !== undefined
                        ? editingValues[record?.id]?.supervisor
                        : record?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          // disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
                          options={expertProfileData?.map((item) => {
                            const text = getSupervisorName(item, true)
                            const hasLecturer = item.lecturer != null
                            return {
                              label: (
                                <span
                                  title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                  className={hasLecturer ? "text-green-600" : "text-red-600"}
                                  style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                >
                                  {text}
                                </span>
                              ),
                              value: item.id,
                            }
                          })}
                          value={currentValue || undefined}
                          onChange={(value) => handleEditChange(record?.id, "supervisor", value)}
                        />
                      </div>
                    )
                  }
                  const supervisor = record?.thesisRegistrations?.[0]?.thesisProject?.supervisor

                  return getSupervisorName(supervisor, true)
                },
              },
              {
                title: "GVHD 2",
                width: 150,
                dataIndex: "coSupervisor",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.coSupervisor !== undefined
                        ? editingValues[record?.id]?.coSupervisor
                        : record?.thesisRegistrations?.[0]?.thesisProject?.coSupervisor?.id || ""

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          className="w-full"
                          //  disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
                          options={expertProfileData?.map((item) => {
                            const text = getSupervisorName(item, true)
                            const hasLecturer = item.lecturer != null
                            return {
                              label: (
                                <span
                                  title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                  className={hasLecturer ? "text-green-600" : "text-red-600"}
                                  style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                >
                                  {text}
                                </span>
                              ),
                              value: item.id,
                            }
                          })}
                          value={currentValue || undefined}
                          onChange={(value) => handleEditChange(record?.id, "coSupervisor", value)}
                        />
                      </div>
                    )
                  }
                  const coSupervisor = record?.thesisRegistrations?.[0]?.thesisProject?.coSupervisor
                  return getSupervisorName(coSupervisor, true)
                },
              },
              {
                title: "Chủ tịch ",
                width: 150,
                dataIndex: "councilChairman",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilChairman !== undefined
                        ? editingValues[record?.id]?.councilChairman
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member: CouncilMember) => member.role === CouncilRole.CHAIRMAN
                          )?.expert?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          className="w-full"
                          // disabled={role !== "Khoa" || !isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter((item) => item.eligiblePresident === true)
                            .map((item) => {
                              const text = getSupervisorName(item, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    className={hasLecturer ? "text-green-600" : "text-red-600"}
                                    style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "councilChairman", value)
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(record, CouncilRole.CHAIRMAN)
                },
              },
              {
                title: "Thư ký",
                width: 150,
                dataIndex: "councilSecretary",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilSecretary !== undefined
                        ? editingValues[record?.id]?.councilSecretary
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member: CouncilMember) => member.role === CouncilRole.SECRETARY
                          )?.expert?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          //  disabled={role !== "Khoa" || !isWithinCouncilEditWindow()}
                          options={expertProfileData
                            ?.filter((item) => item.eligibleSecretary === true)
                            .map((item) => {
                              const text = getSupervisorName(item, true)
                              const hasLecturer = item.lecturer != null
                              return {
                                label: (
                                  <span
                                    title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                    className={hasLecturer ? "text-green-600" : "text-red-600"}
                                    style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                  >
                                    {text}
                                  </span>
                                ),
                                value: item.id,
                              }
                            })}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "councilSecretary", value)
                          }
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(record, CouncilRole.SECRETARY)
                },
              },
              {
                title: "Phản biện 1",
                width: 150,
                dataIndex: "reviewer1",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.reviewer1 !== undefined
                        ? editingValues[record?.id]?.reviewer1
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member: CouncilMember) => member.role === CouncilRole.REVIEWER_1
                          )?.expert?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          //  disabled={role !== "Khoa" || !isWithinCouncilEditWindow()}
                          options={expertProfileData?.map((item) => {
                            const text = getSupervisorName(item, true)
                            const hasLecturer = item.lecturer != null
                            return {
                              label: (
                                <span
                                  title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                  className={hasLecturer ? "text-green-600" : "text-red-600"}
                                  style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                >
                                  {text}
                                </span>
                              ),
                              value: item.id,
                            }
                          })}
                          value={currentValue || ""}
                          onChange={(value) => handleEditChange(record?.id, "reviewer1", value)}
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(record, CouncilRole.REVIEWER_1)
                },
              },
              {
                title: "Phản biện 2",
                width: 150,
                dataIndex: "reviewer2",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.reviewer2 !== undefined
                        ? editingValues[record?.id]?.reviewer2
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member: any) => member.role === CouncilRole.REVIEWER_2
                          )?.expert?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          //  disabled={role !== "Khoa" || !isWithinCouncilEditWindow()}
                          options={expertProfileData?.map((item) => {
                            const text = getSupervisorName(item, true)
                            const hasLecturer = item.lecturer != null
                            return {
                              label: (
                                <span
                                  title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                  className={hasLecturer ? "text-green-600" : "text-red-600"}
                                  style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                >
                                  {text}
                                </span>
                              ),
                              value: item.id,
                            }
                          })}
                          value={currentValue || ""}
                          onChange={(value) => handleEditChange(record?.id, "reviewer2", value)}
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(record, CouncilRole.REVIEWER_2)
                },
              },
              {
                title: "Ủy viên",
                width: 150,
                dataIndex: "councilMember",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilMember !== undefined
                        ? editingValues[record?.id]?.councilMember
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member: any) => member.role === CouncilRole.MEMBER
                          )?.expert?.id || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          // disabled={role !== "Khoa" || !isWithinCouncilEditWindow()}
                          options={expertProfileData?.map((item) => {
                            const text = getSupervisorName(item, true)
                            const hasLecturer = item.lecturer != null
                            return {
                              label: (
                                <span
                                  title={hasLecturer ? "Trong học viện" : "Ngoài học viện"}
                                  className={hasLecturer ? "text-green-600" : "text-red-600"}
                                  style={{ color: hasLecturer ? "#16a34a" : "#dc2626" }}
                                >
                                  {text}
                                </span>
                              ),
                              value: item.id,
                            }
                          })}
                          value={currentValue || ""}
                          onChange={(value) => handleEditChange(record?.id, "councilMember", value)}
                        />
                      </div>
                    )
                  }
                  return getCouncilMemberName(record, CouncilRole.MEMBER)
                },
              },
              {
                title: "Phòng bảo vệ",
                width: 150,
                dataIndex: "room",
                render: (text: string, record: any) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.room !== undefined
                        ? editingValues[record?.id]?.room
                        : record?.thesisRegistrations?.[0]?.thesisProject?.room?.name || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          // disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
                          className="w-full"
                          value={currentValue || ""}
                          options={roomData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          onChange={(value) => handleEditChange(record?.id, "room", value)}
                        />
                      </div>
                    )
                  }

                  return record?.thesisRegistrations?.[0]?.thesisProject?.room?.name || ""
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
                        : record?.thesisRegistrations?.[0]?.thesisProject?.defenseDate || ""
                    const dayjsValue = currentValue ? dayjs(currentValue) : null
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DatePicker
                          className="w-full"
                          disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
                          placeholder="Chọn ngày bảo vệ"
                          value={dayjsValue || undefined}
                          onChange={(value) => handleEditChange(record?.id, "defenseDate", value)}
                        />
                      </div>
                    )
                  }
                  return record?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                    ? dayjs(record?.thesisRegistrations?.[0]?.thesisProject?.defenseDate).format(
                        "DD/MM/YYYY"
                      )
                    : ""
                },
              },

              {
                title: "Thời gian bảo vệ",
                width: 120,
                dataIndex: "defenseSession",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.defenseSession !== undefined
                        ? editingValues[record?.id]?.defenseSession
                        : record?.thesisRegistrations?.[0]?.thesisProject?.defenseSession
                            ?.startTime || ""
                    const dayjsValue = currentValue

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 100 }}
                          value={dayjsValue || undefined}
                          // disabled={role !== "Khoa" || !isWithinGvhdSupervisorEditWindow()}
                          placeholder="Chọn thời gian bảo vệ"
                          options={defenseSessionData?.map((item) => ({
                            label: item.startTime ? dayjs(item.startTime).format("HH:mm") : "",
                            value: item.id,
                          }))}
                          onChange={(value) =>
                            handleEditChange(record?.id, "defenseSession", value)
                          }
                        />
                      </div>
                    )
                  }
                  return record?.thesisRegistrations?.[0]?.thesisProject?.defenseSession?.startTime
                    ? dayjs(
                        record?.thesisRegistrations?.[0]?.thesisProject?.defenseSession?.startTime
                      ).format("HH:mm")
                    : ""
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
                        : record?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord
                            ?.finalScore || ""

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
                    record?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore?.toString() ||
                    ""
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
              //           : record?.thesisRegistrations?.[0]?.thesisProject?.status || ""
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
              //       record?.thesisRegistrations?.[0]?.thesisProject?.status
              //     )
              //     const color = getThesisProjectStatusColor(
              //       record?.thesisRegistrations?.[0]?.thesisProject?.status
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
                    const status = record?.thesisRegistrations?.[0]?.thesisProject?.status || ""
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
                                  record?.thesisRegistrations?.[0]?.thesisProject?.status || ""
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
                                    id: record?.thesisRegistrations?.[0]?.thesisProject?.id,
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
                                    id: record?.thesisRegistrations?.[0]?.thesisProject?.id,
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
                                thesisProjectId:
                                  record?.thesisRegistrations?.[0]?.thesisProject?.id,
                                thesisSessionId: searchParams?.thesisSessionId || "",
                              })
                            }}
                          />
                          <DeleteIcon
                            title="Xóa"
                            size={24}
                            className="text-lg font-bold text-red-700"
                            popConfirm={{
                              onConfirm: async () => {
                                const payload = {
                                  deletedAt: new Date(),
                                }
                                try {
                                  showSpinner()
                                  await updateThesisProject({
                                    data: payload,
                                    where: {
                                      id: record?.thesisRegistrations?.[0]?.thesisProject?.id || "",
                                    },
                                  })
                                  message.success("Xóa thành công")
                                } catch (error) {
                                  message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
                                } finally {
                                  hideSpinner()
                                }
                              },
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
