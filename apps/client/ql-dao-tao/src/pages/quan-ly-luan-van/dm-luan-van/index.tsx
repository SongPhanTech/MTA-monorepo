/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <sử dụng onClick để ngăn chặn sự kiện click lồng nhau> */
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import type { ModalChuyenDotXetLuanVanInput } from "@components/modal/modal-chuyen-dot-xet-luan-van"
import type { ModalTaoDuLieuMauLuanVanInput } from "@components/modal/modal-tao-du-lieu-mau-luan-van"
import ApproveIcon from "@components/icons/approve"
import DeleteIcon from "@components/icons/delete"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { useThesisProjectStatusOptions } from "@hooks/thesisProjectStatus"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import { CouncilRole, ThesisProjectStatus, ThesisType } from "@workspace/db/client"
import { queryClient } from "@api/index"
import {
  useCountThesisProject,
  useFindManyDefenseSession,
  useFindManyDM_DonVi,
  useFindManyExpert,
  useFindManyFixedClass,
  useFindManyRoom,
  useFindManyStudent,
  useFindManyThesisProject,
  useFindManyThesisSession,
  useUpdateThesisProject,
  useUpdateThesisSession,
} from "@workspace/db/hooks"
import {
  batchUpdateThesisProjects,
  deleteStudentThesis,
  exportCouncilImportTemplate,
  exportThesisTemplate,
  importCouncilFromExcel,
} from "@workspace/libs/api/thesis"
import { whereOrganization } from "@workspace/libs/constants"
import { SearchOutlined, WalletOutlined } from "@ant-design/icons"
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
import { ArrowRightLeft, SquarePen } from "lucide-react"
import { saveAs } from "file-saver"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TreeSelect from "@/components/commons/tree-select"
import type { FilterProps } from "@constants/type"
import { flattenExpertForSelect, versionInAcademy, versionToPersonLike } from "@/utils/expert-select"
import type { ExpertProfileLike, PersonLike } from "@/utils/thesis-profile"

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

/** StudentRow: shape tối thiểu cần thiết cho các hàm helper trong trang này */
export type StudentRow = {
  id?: string
  code?: string | null
  userProfile?: {
    fullname?: string | null
    dateOfBirth?: string | Date | null
    [key: string]: unknown
  } | null
  fixedClass?: {
    name?: string | null
    [key: string]: unknown
  } | null
  thesisRegistrations?: Array<{
    deletedAt?: string | Date | null
    thesisProject?: {
      id?: string | null
      deletedAt?: string | Date | null
      thesisSessionId?: string | null
      thesisSession?: { id?: string | null } | null
      supervisor?: PersonLike | null
      supervisorName?: string | null
      primarySupervisor?: PersonLike | null
      coSupervisor?: PersonLike | null
      coSupervisorName?: string | null
      secondarySupervisor?: PersonLike | null
      thirdSupervisor?: PersonLike | null
      council?: {
        members?: Array<{
          role?: string | null
          expertId?: string | null
          expert?: PersonLike | null
          expertProfileVersion?: PersonLike | null
        }> | null
      } | null
      CHUTICH?: string | null
      THUKY?: string | null
      PHANBIEN1?: string | null
      PHANBIEN2?: string | null
      UYVIEN3?: string | null
      defenseDate?: string | Date | null
      defenseSession?: { id?: string | null; startTime?: string | Date | null } | null
      defenseRecord?: any
      room?: { id?: string | null; name?: string | null } | null
      title?: string | null
      researchTopicAssociated?: string | null
      language?: any
      type?: string | null
      status?: string | null
      organization?: { Id?: string | null; sMa?: string | null; sTen?: string | null } | null
      [key: string]: unknown
    } | null
    [key: string]: unknown
  }> | null
  [key: string]: unknown
}

export function getThesisRegistrationForSession(
  studentOrRecord?: StudentRow | null,
  thesisSessionId?: string
) {
  if (!studentOrRecord || !thesisSessionId) return undefined
  return studentOrRecord?.thesisRegistrations?.find((reg) => {
    if (reg?.deletedAt) return false
    const project = reg?.thesisProject
    if (!project || project.deletedAt) return false
    return (
      project.thesisSession?.id === thesisSessionId || project.thesisSessionId === thesisSessionId
    )
  })
}

export function getThesisProjectForSession(
  studentOrRecord?: StudentRow | null,
  thesisSessionId?: string
) {
  if (!studentOrRecord) return undefined
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

function getSupervisorExpertIdsFromRow(row: Record<string, unknown>): string[] {
  return [row.supervisor, row.coSupervisor]
    .map((id) => normalizeCouncilExpertId(id))
    .filter((id): id is string => id !== null)
}

function getCouncilExpertIdsFromRow(row: Record<string, unknown>): string[] {
  return THESIS_COUNCIL_EXPERT_FIELDS.map((field) => normalizeCouncilExpertId(row[field])).filter(
    (id): id is string => id !== null
  )
}

/** GVHD (chính/phụ) không được trùng bất kỳ thành viên hội đồng bảo vệ nào. */
export function hasSupervisorConflictWithCouncilRow(row: Record<string, unknown>): boolean {
  const supervisorIds = getSupervisorExpertIdsFromRow(row)
  if (!supervisorIds.length) return false
  const councilIds = new Set(getCouncilExpertIdsFromRow(row))
  return supervisorIds.some((id) => councilIds.has(id))
}

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

/** workplace ưu tiên; fallback organization (nhiều bản ngoài HV chỉ có organization). */
function resolveExpertWorkplace(
  person?: ExpertProfileLike | PersonLike | null,
  profile?: { workplace?: string | null } | null
): string {
  if (!person && !profile) return ""
  const organization =
    typeof person?.organization === "string" ? person.organization.trim() : ""
  return person?.workplace?.trim() || profile?.workplace?.trim() || organization || ""
}

/** Select gọn cho ExpertProfileVersion (hiển thị tên / đơn vị / trong-ngoài HV). */
const expertVersionSelect = {
  id: true,
  expertId: true,
  name: true,
  workplace: true,
  organization: true,
  inAcademy: true,
  academicRankType: { select: { sMa: true } },
  academicDegreeType: { select: { sMa: true } },
  expert: {
    select: {
      id: true,
      lecturerId: true,
      lecturer: {
        select: {
          organization: { select: { sMa: true, sTen: true } },
          userProfile: {
            select: {
              fullname: true,
              academicRankType: { select: { sMa: true } },
              academicDegreeType: { select: { sMa: true } },
            },
          },
        },
      },
    },
  },
} as const

/** Select bảng luận văn — chỉ field UI cần. */
const thesisProjectTableSelect = {
  id: true,
  title: true,
  researchTopicAssociated: true,
  language: true,
  type: true,
  status: true,
  thesisSessionId: true,
  thesisType: true,
  deletedAt: true,
  defenseDate: true,
  CHUTICH: true,
  THUKY: true,
  PHANBIEN1: true,
  PHANBIEN2: true,
  UYVIEN3: true,
  supervisorName: true,
  coSupervisorName: true,
  organization: { select: { Id: true, sMa: true, sTen: true } },
  thesisSession: { select: { id: true } },
  defenseSession: { select: { id: true, startTime: true } },
  defenseRecord: { select: { finalScore: true } },
  room: { select: { id: true, name: true } },
  supervisor: { select: expertVersionSelect },
  coSupervisor: { select: expertVersionSelect },
  thirdSupervisor: { select: expertVersionSelect },
  council: {
    select: {
      id: true,
      members: {
        select: {
          id: true,
          role: true,
          expertId: true,
          expertProfileVersion: { select: expertVersionSelect },
        },
      },
    },
  },
  registrations: {
    where: { deletedAt: null },
    take: 1,
    select: {
      deletedAt: true,
      student: {
        select: {
          id: true,
          code: true,
          userProfile: {
            select: { fullname: true, firstName: true, lastName: true, dateOfBirth: true },
          },
          fixedClass: {
            select: {
              id: true,
              name: true,
              code: true,
              trainingCourse: {
                select: {
                  id: true,
                  name: true,
                  trainingObjectType: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

/** Select xuất Excel — thêm payment / curriculum / session config. */
const thesisProjectExportSelect = {
  ...thesisProjectTableSelect,
  thesisSession: {
    select: {
      id: true,
      name: true,
      defenseDecisionDate: true,
      defenseDecisionNumber: true,
      configPayment: {
        select: {
          councilPayAmounts: true,
          supervisorPayAmounts: true,
        },
      },
      trainingCourses: {
        select: {
          id: true,
          name: true,
          trainingObjectType: { select: { id: true, name: true } },
        },
      },
    },
  },
  supervisorPayment: { select: { amount: true } },
  coSupervisorPayment: { select: { amount: true } },
  council: {
    select: {
      id: true,
      members: {
        select: {
          id: true,
          role: true,
          expertId: true,
          payment: { select: { amount: true } },
          expertProfileVersion: { select: expertVersionSelect },
        },
      },
    },
  },
  registrations: {
    where: { deletedAt: null },
    take: 1,
    select: {
      deletedAt: true,
      student: {
        select: {
          id: true,
          code: true,
          userProfile: {
            select: { fullname: true, firstName: true, lastName: true, dateOfBirth: true },
          },
          curriculumVersion: {
            select: {
              curriculum: {
                select: {
                  managementOrganization: { select: { Id: true, sMa: true, sTen: true } },
                  trainingMajor: {
                    select: {
                      name: true,
                      organization: { select: { Id: true, sMa: true, sTen: true } },
                      trainingField: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          fixedClass: {
            select: {
              id: true,
              name: true,
              code: true,
              trainingCourse: {
                select: {
                  id: true,
                  name: true,
                  trainingObjectType: { select: { id: true, name: true } },
                },
              },
              curriculumVersion: {
                select: {
                  curriculum: {
                    select: {
                      trainingMajor: {
                        select: {
                          name: true,
                          organization: { select: { Id: true, sMa: true, sTen: true } },
                          trainingField: { select: { name: true } },
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
    },
  },
} as const

function mapThesisProjectsToStudentRows(
  projects: Array<{
    registrations?: Array<{
      deletedAt?: string | Date | null
      student?: Record<string, unknown> | null
    }> | null
    [key: string]: unknown
  }>
): StudentRow[] {
  return projects
    .map((project) => {
      const registration = project.registrations?.[0]
      const student = registration?.student as StudentRow | undefined
      if (!student?.id) return null
      const { registrations: _regs, ...thesisProject } = project
      return {
        ...student,
        thesisRegistrations: [
          {
            deletedAt: registration?.deletedAt ?? null,
            thesisProject,
          },
        ],
      } as StudentRow
    })
    .filter((row): row is StudentRow => row != null)
}

export function formatPersonNameWithWorkplace(
  person: ExpertProfileLike | PersonLike | string | null | undefined,
  allExperts: ExpertProfileLike[] = []
): { textWithWorkplace: string; inAcademy: boolean } {
  if (!person) return { textWithWorkplace: "", inAcademy: true }

  const cleanTitle = (str: string) =>
    str
      .replace(/^(GS|PGS|TS|ThS|KS|CN|BS|Thạc sĩ|Tiến sĩ|Giáo sư|Phó giáo sư)\.?:?\s*/gi, "")
      .trim()
      .toLowerCase()

  if (typeof person === "string") {
    const trimmed = person.trim()
    if (!trimmed) return { textWithWorkplace: "", inAcademy: true }
    const cleanedTrimmed = cleanTitle(trimmed)

    const matched = allExperts.find((e) => {
      const p = e?.lecturer?.userProfile
      const rank = p?.academicRankType?.sMa || e?.academicRankType?.sMa || ""
      const degree = p?.academicDegreeType?.sMa || e?.academicDegreeType?.sMa || ""
      const title = [rank, degree].filter(Boolean).join(".")
      const fullname = e?.name || p?.fullname || ""
      const fullStr = [title, fullname].filter(Boolean).join(" ").trim()
      const cleanedFullname = cleanTitle(fullname)
      return (
        fullname.toLowerCase() === trimmed.toLowerCase() ||
        fullStr.toLowerCase() === trimmed.toLowerCase() ||
        (cleanedFullname && cleanedTrimmed === cleanedFullname) ||
        (fullname.length > 3 && trimmed.toLowerCase().includes(fullname.toLowerCase()))
      )
    })

    if (matched) {
      const inAcad = versionInAcademy(matched)
      const wp = resolveExpertWorkplace(matched)
      const textWithWp = [trimmed, wp].filter(Boolean).join(", ")
      return { textWithWorkplace: textWithWp, inAcademy: inAcad }
    }

    return { textWithWorkplace: trimmed, inAcademy: true }
  }

  const expertPerson = (versionToPersonLike(person as ExpertProfileLike) ??
    person) as ExpertProfileLike
  const profile =
    expertPerson?.lecturer?.userProfile ?? expertPerson?.expert?.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expertPerson?.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expertPerson?.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expertPerson?.name || profile?.fullname || ""
  // Ưu tiên inAcademy trên version đã gán / current; không suy từ lecturerId live
  const inAcademy = versionInAcademy(expertPerson)
  let workplace = resolveExpertWorkplace(expertPerson, profile)

  if (!inAcademy && !workplace && allExperts.length) {
    const cleanedFullname = cleanTitle(fullname)
    const matched = allExperts.find((e) => {
      if (e.id === expertPerson.expertId || e.id === expertPerson.id) return true
      const eName = e.name || e?.lecturer?.userProfile?.fullname || ""
      return eName === fullname || (cleanedFullname && cleanTitle(eName) === cleanedFullname)
    })
    const matchedWorkplace = resolveExpertWorkplace(matched)
    if (matchedWorkplace) workplace = matchedWorkplace
  }

  const text = [title, fullname].filter(Boolean).join(" ").trim() || fullname
  const textWithWorkplace = [text, workplace].filter(Boolean).join(", ")

  return { textWithWorkplace, inAcademy }
}

export function getCouncilMemberName(
  record: StudentRow | null | undefined,
  role?: CouncilRole,
  thesisSessionId?: string,
  rawText = false,
  searchKeyword = "",
  allExperts: ExpertProfileLike[] = []
) {
  const project = getThesisProjectForSession(record, thesisSessionId)
  const member = project?.council?.members?.find((m) => m.role === role)

  let personTarget: PersonLike | string | null = null
  if (member?.expertProfileVersion) {
    personTarget = versionToPersonLike(member.expertProfileVersion)
  } else if (member?.expert) {
    personTarget = member.expert
  } else if (project) {
    if (role === CouncilRole.CHAIRMAN) personTarget = project.CHUTICH ?? null
    else if (role === CouncilRole.SECRETARY) personTarget = project.THUKY ?? null
    else if (role === CouncilRole.REVIEWER_1) personTarget = project.PHANBIEN1 ?? null
    else if (role === CouncilRole.REVIEWER_2) personTarget = project.PHANBIEN2 ?? null
    else if (role === CouncilRole.MEMBER) personTarget = project.UYVIEN3 ?? null
  }

  if (!personTarget) return ""

  const { textWithWorkplace, inAcademy } = formatPersonNameWithWorkplace(personTarget, allExperts)

  if (!textWithWorkplace) return ""
  if (rawText) return textWithWorkplace

  const kw = searchKeyword ? searchKeyword.trim().toLowerCase() : ""
  const isMatched = kw ? textWithWorkplace.toLowerCase().includes(kw) : false

  return (
    <span
      title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
      className={
        isMatched
          ? "bg-yellow-200 border border-yellow-400 text-yellow-950 font-bold px-2 py-0.5 rounded shadow-sm inline-block"
          : undefined
      }
      style={!isMatched ? { color: inAcademy ? "#000000" : "#16a34a" } : undefined}
    >
      {textWithWorkplace}
    </span>
  )
}

export function getSupervisorName(
  record: ExpertProfileLike | PersonLike | null | undefined,
  htmlRender = false,
  showWorkplace = false,
  searchKeyword = "",
  allExperts: ExpertProfileLike[] = []
) {
  if (!record) return ""

  // Version đã gán / flatten catalog → PersonLike có inAcademy tường minh
  const person =
    versionToPersonLike(record as ExpertProfileLike) ?? (record as ExpertProfileLike)

  const { textWithWorkplace, inAcademy } = formatPersonNameWithWorkplace(person, allExperts)

  if (!textWithWorkplace) return ""

  // showWorkplace=false → chỉ tên + học hàm/học vị (bỏ đơn vị công tác)
  let displayText = textWithWorkplace
  if (!showWorkplace) {
    const rank =
      person.academicRankType?.sMa || person.lecturer?.userProfile?.academicRankType?.sMa || ""
    const degree =
      person.academicDegreeType?.sMa || person.lecturer?.userProfile?.academicDegreeType?.sMa || ""
    const title = [rank, degree].filter(Boolean).join(".")
    const fullname = person.name || person.lecturer?.userProfile?.fullname || ""
    displayText = [title, fullname].filter(Boolean).join(" ").trim() || fullname || textWithWorkplace
  }

  if (!htmlRender) return displayText

  const kw = searchKeyword ? searchKeyword.trim().toLowerCase() : ""
  const isMatched = kw ? displayText.toLowerCase().includes(kw) : false

  return (
    <span
      title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
      className={
        isMatched
          ? "bg-yellow-200 border border-yellow-400 text-yellow-950 font-bold px-2 py-0.5 rounded shadow-sm inline-block"
          : undefined
      }
      style={!isMatched ? { color: inAcademy ? "#000000" : "#16a34a" } : undefined}
    >
      {displayText}
    </span>
  )
}

/** Options Select chuyên gia: label giống chế độ xem (tên + đơn vị nếu ngoài HV). */
function buildExpertSelectOptions(
  experts: ExpertProfileLike[] | undefined,
  filterFn?: (item: ExpertProfileLike) => boolean,
  ensure?: {
    id?: string | null
    person?: ExpertProfileLike | PersonLike | null
  }
) {
  const catalog = experts ?? []
  const list = catalog.filter((item) => (filterFn ? filterFn(item) : true))
  const options = list.map((item) => {
    // Truyền catalog để backfill workplace giống getCouncilMemberName / chế độ xem
    const searchString = String(
      getSupervisorName(item, false, true, "", catalog) || item.name || ""
    )
    const inAcademy = versionInAcademy(item)
    return {
      value: String(item.id),
      searchString,
      label: (
        <span
          title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
          style={{ color: inAcademy ? "#000000" : "#16a34a" }}
        >
          {searchString || String(item.id)}
        </span>
      ),
    }
  })

  const ensureId = ensure?.id ? String(ensure.id) : ""
  if (ensureId && !options.some((o) => o.value === ensureId)) {
    const person = ensure?.person
    const searchString = person
      ? String(getSupervisorName(person as ExpertProfileLike, false, true, "", catalog) || "")
      : ""
    const inAcademy = person ? versionInAcademy(person as ExpertProfileLike) : false
    options.unshift({
      value: ensureId,
      searchString: searchString || ensureId,
      label: (
        <span
          title={inAcademy ? "Trong học viện" : "Ngoài học viện"}
          style={{ color: inAcademy ? "#000000" : "#16a34a" }}
        >
          {searchString || ensureId}
        </span>
      ),
    })
  }

  return options
}

export function getMatchedLecturerRoles(
  record: StudentRow | null | undefined,
  thesisSessionId: string | undefined,
  keyword: string
): string[] {
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.trim().toLowerCase()
  const project = getThesisProjectForSession(record, thesisSessionId)
  if (!project) return []

  const roles: string[] = []

  const isMatch = (str?: string | null) => {
    if (!str) return false
    return str.toLowerCase().includes(kw)
  }

  const isPersonMatch = (person?: PersonLike | null, fallbackName?: string | null) => {
    if (fallbackName && isMatch(fallbackName)) return true
    if (!person) return false
    if (isMatch(person.name)) return true
    const profile = person.lecturer?.userProfile || person.userProfile
    if (isMatch(profile?.fullname)) return true
    const combined = `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim()
    if (combined && isMatch(combined)) return true
    return false
  }

  if (
    isPersonMatch(versionToPersonLike(project.supervisor), project.supervisorName) ||
    isPersonMatch(project.primarySupervisor)
  ) {
    roles.push("GVHD 1")
  }

  if (
    isPersonMatch(versionToPersonLike(project.coSupervisor), project.coSupervisorName) ||
    isPersonMatch(project.secondarySupervisor)
  ) {
    roles.push("GVHD 2")
  }

  if (isPersonMatch(versionToPersonLike(project.thirdSupervisor))) {
    roles.push("CBHD khác")
  }

  if (project.council?.members?.length) {
    for (const m of project.council.members) {
      if (isPersonMatch(versionToPersonLike(m.expertProfileVersion) ?? m.expert)) {
        if (m.role === CouncilRole.CHAIRMAN) roles.push("Chủ tịch HĐ")
        else if (m.role === CouncilRole.SECRETARY) roles.push("Thư ký HĐ")
        else if (m.role === CouncilRole.REVIEWER_1) roles.push("Phản biện 1")
        else if (m.role === CouncilRole.REVIEWER_2) roles.push("Phản biện 2")
        else if (m.role === CouncilRole.MEMBER) roles.push("Ủy viên HĐ")
      }
    }
  }

  if (isMatch(project.CHUTICH) && !roles.includes("Chủ tịch HĐ")) roles.push("Chủ tịch HĐ")
  if (isMatch(project.THUKY) && !roles.includes("Thư ký HĐ")) roles.push("Thư ký HĐ")
  if (isMatch(project.PHANBIEN1) && !roles.includes("Phản biện 1")) roles.push("Phản biện 1")
  if (isMatch(project.PHANBIEN2) && !roles.includes("Phản biện 2")) roles.push("Phản biện 2")
  if (isMatch(project.UYVIEN3) && !roles.includes("Ủy viên HĐ")) roles.push("Ủy viên HĐ")

  return Array.from(new Set(roles))
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
  const councilImportInputRef = useRef<HTMLInputElement>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [trainingCourseIds, setTrainingCourseIds] = useState<string[]>([])
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
    allStudentsInClasses: StudentRow[]
  }>({
    tag: "ModalChuyenDiemLopMonHoc",
  })
  const { onOpen: openModalTaoDuLieuMau } = useDisclosure<ModalTaoDuLieuMauLuanVanInput>({
    tag: "ModalTaoDuLieuMauLuanVan",
  })
  const { onOpen: openModalChuyenDotXetLuanVan } = useDisclosure<ModalChuyenDotXetLuanVanInput>({
    tag: "ModalChuyenDotXetLuanVan",
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
        trainingCourseId: trainingCourseIds.length ? { in: trainingCourseIds } : undefined,
      },
    },
    {
      enabled: trainingCourseIds.length > 0,
    }
  )
  const { data: experts } = useFindManyExpert({
    where: { currentVersion: { thesisExpert: true } },
    include: {
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
      currentVersion: {
        include: {
          academicRankType: true,
          academicDegreeType: true,
        },
      },
    },
  })
  const expertProfileData = useMemo(() => (experts ?? []).map(flattenExpertForSelect), [experts])
  useEffect(() => {
    if (role !== "Khoa" || !orgId) return
    form.setFieldValue("organizationId", orgId)
    setSearchParams((prev) => ({
      ...prev,
      organizationId: orgId,
    }))
  }, [role, orgId, form])
  // biome-ignore lint/correctness/useExhaustiveDependencies: dùng cho searchParams
  const thesisProjectWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] as string[] } }

    const fixedClassIds =
      searchParams.fixedClassId && searchParams.fixedClassId.length > 0
        ? searchParams.fixedClassId
        : fixedClasses?.map((f) => f.id)

    const studentAnd: Record<string, unknown>[] = [
      { fixedClassId: { in: fixedClassIds ?? [] } },
    ]
    if (filters.code) {
      studentAnd.push({ code: { contains: filters.code, mode: "insensitive" } })
    }
    if (filters.name) {
      studentAnd.push({
        userProfile: { fullname: { contains: filters.name, mode: "insensitive" } },
      })
    }

    const andConditions: Record<string, unknown>[] = [
      { deletedAt: null },
      { thesisSessionId: searchParams.thesisSessionId },
      { thesisType: ThesisType.THESIS },
    ]
    if (searchParams.organizationId) {
      andConditions.push({ organizationId: searchParams.organizationId })
    }
    if (filters.title) {
      andConditions.push({ title: { contains: filters.title, mode: "insensitive" } })
    }
    if (filters.supervisor) {
      andConditions.push({
        supervisor: {
          OR: [
            { name: { contains: filters.supervisor, mode: "insensitive" } },
            {
              expert: {
                lecturer: {
                  userProfile: {
                    fullname: { contains: filters.supervisor, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
      })
    }
    if (filters.coSupervisor) {
      andConditions.push({
        coSupervisor: {
          OR: [
            { name: { contains: filters.coSupervisor, mode: "insensitive" } },
            {
              expert: {
                lecturer: {
                  userProfile: {
                    fullname: { contains: filters.coSupervisor, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
      })
    }

    andConditions.push({
      registrations: {
        some: {
          deletedAt: null,
          student: { AND: studentAnd },
        },
      },
    })

    if (debouncedNameKeyword) {
      const containsKw = { contains: debouncedNameKeyword, mode: "insensitive" }
      const expertKwFilter = {
        OR: [
          { name: containsKw },
          { expert: { lecturer: { userProfile: { fullname: containsKw } } } },
        ],
      }
      const lecturerKwFilter = {
        userProfile: { fullname: containsKw },
      }

      andConditions.push({
        OR: [
          { title: containsKw },
          { researchTopicAssociated: containsKw },
          { supervisorName: containsKw },
          { coSupervisorName: containsKw },
          { supervisor: expertKwFilter },
          { coSupervisor: expertKwFilter },
          { thirdSupervisor: expertKwFilter },
          { primarySupervisor: lecturerKwFilter },
          { secondarySupervisor: lecturerKwFilter },
          { CHUTICH: containsKw },
          { THUKY: containsKw },
          { PHANBIEN1: containsKw },
          { PHANBIEN2: containsKw },
          { UYVIEN3: containsKw },
          { language: containsKw },
          { type: containsKw },
          { room: { name: containsKw } },
          {
            council: {
              members: {
                some: { expertProfileVersion: expertKwFilter },
              },
            },
          },
          {
            registrations: {
              some: {
                deletedAt: null,
                student: {
                  OR: [
                    { userProfile: { fullname: containsKw } },
                    { code: containsKw },
                    { fixedClass: { name: containsKw } },
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
  const exportThesisProjectWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] as string[] } }

    const fixedClassIds =
      searchParams.fixedClassId && searchParams.fixedClassId.length > 0
        ? searchParams.fixedClassId
        : fixedClasses?.map((f) => f.id)

    const andConditions: Record<string, unknown>[] = [
      { deletedAt: null },
      { thesisSessionId: searchParams.thesisSessionId },
      { thesisType: ThesisType.THESIS },
      {
        registrations: {
          some: {
            deletedAt: null,
            student: { fixedClassId: { in: fixedClassIds ?? [] } },
          },
        },
      },
    ]
    if (searchParams.organizationId) {
      andConditions.push({ organizationId: searchParams.organizationId })
    }

    if (debouncedNameKeyword) {
      const containsKw = { contains: debouncedNameKeyword, mode: "insensitive" }
      const expertKwFilter = {
        OR: [
          { name: containsKw },
          { expert: { lecturer: { userProfile: { fullname: containsKw } } } },
        ],
      }
      const lecturerKwFilter = {
        userProfile: { fullname: containsKw },
      }
      andConditions.push({
        OR: [
          { title: containsKw },
          { researchTopicAssociated: containsKw },
          { supervisorName: containsKw },
          { coSupervisorName: containsKw },
          { supervisor: expertKwFilter },
          { coSupervisor: expertKwFilter },
          { thirdSupervisor: expertKwFilter },
          { primarySupervisor: lecturerKwFilter },
          { secondarySupervisor: lecturerKwFilter },
          { CHUTICH: containsKw },
          { THUKY: containsKw },
          { PHANBIEN1: containsKw },
          { PHANBIEN2: containsKw },
          { UYVIEN3: containsKw },
          { language: containsKw },
          { type: containsKw },
          { room: { name: containsKw } },
          {
            council: {
              members: {
                some: { expertProfileVersion: expertKwFilter },
              },
            },
          },
          {
            registrations: {
              some: {
                deletedAt: null,
                student: {
                  OR: [
                    { userProfile: { fullname: containsKw } },
                    { code: containsKw },
                    { fixedClass: { name: containsKw } },
                  ],
                },
              },
            },
          },
        ],
      })
    }

    return { AND: andConditions }
  }, [searchParams, fixedClasses, debouncedNameKeyword])

  const sampleStudentWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] as string[] } }
    return {
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
    }
  }, [searchParams.thesisSessionId, searchParams.fixedClassId, fixedClasses])

  const { data: thesisProjects = [], refetch: refetchThesisProjects } = useFindManyThesisProject(
    {
      where: thesisProjectWhere,
      select: thesisProjectTableSelect,
      orderBy: { id: "asc" },
      skip: (currentPage - 1) * numberOfPages,
      take: numberOfPages,
    },
    { enabled: !!searchParams.thesisSessionId }
  )

  const students = useMemo(
    () => mapThesisProjectsToStudentRows(thesisProjects as any[]),
    [thesisProjects]
  )

  type StudentRow = (typeof students)[number]

  /** Chỉ fetch khi gán điểm LMH — xuất mẫu in dùng API server. */
  const { refetch: refetchExportThesisProjects } = useFindManyThesisProject(
    {
      where: exportThesisProjectWhere,
      select: thesisProjectExportSelect,
    },
    { enabled: false }
  )

  const getExportStudentRows = useCallback(async (): Promise<StudentRow[]> => {
    if (!searchParams.thesisSessionId) return []
    const result = await refetchExportThesisProjects()
    return mapThesisProjectsToStudentRows((result.data ?? []) as any[])
  }, [refetchExportThesisProjects, searchParams.thesisSessionId])

  const { data: sampleStudents = [] } = useFindManyStudent(
    {
      where: sampleStudentWhere,
      select: {
        id: true,
        code: true,
        userProfile: { select: { fullname: true, dateOfBirth: true } },
        fixedClass: { select: { name: true } },
        thesisRegistrations: {
          where: {
            deletedAt: null,
            thesisProject: {
              deletedAt: null,
              thesisType: ThesisType.THESIS,
              thesisSessionId: searchParams.thesisSessionId || undefined,
            },
          },
          select: {
            deletedAt: true,
            thesisProject: {
              select: {
                deletedAt: true,
                thesisType: true,
                thesisSessionId: true,
                title: true,
              },
            },
          },
        },
      },
    },
    { enabled: !!searchParams.thesisSessionId && role === "P7" }
  )

  const { data: countStudent, refetch: refetchCount } = useCountThesisProject(
    {
      where: thesisProjectWhere,
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
      trainingCourses: true,
      configPayment: {
        include: {
          councilPayAmounts: true,
          supervisorPayAmounts: true,
        },
      },
    },
  })
  const selectedThesisSession = useMemo(
    () => thesisSessionData?.find((s) => s.id === searchParams.thesisSessionId),
    [thesisSessionData, searchParams.thesisSessionId]
  )
  const thesisConfigPaymentSessionId = selectedThesisSession?.configPaymentSessionId ?? null

  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()
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
    if (field === "supervisor" || field === "coSupervisor") {
      setEditingValues((prev) => {
        const row = prev[rowId] || {}
        const nextSupervisor = field === "supervisor" ? value : row.supervisor
        const nextCoSupervisor = field === "coSupervisor" ? value : row.coSupervisor
        if (hasDuplicateThesisSupervisors(nextSupervisor, nextCoSupervisor)) {
          message.error("GVHD 1 và GVHD 2 không được trùng nhau")
          return prev
        }
        const nextRow = { ...row, [field]: value }
        if (hasSupervisorConflictWithCouncilRow(nextRow)) {
          message.error("Giáo viên hướng dẫn không được trùng với các thành viên hội đồng bảo vệ")
          return prev
        }
        return {
          ...prev,
          [rowId]: nextRow,
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
        if (hasSupervisorConflictWithCouncilRow(nextRow)) {
          message.error("Giáo viên hướng dẫn không được trùng với các thành viên hội đồng bảo vệ")
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
    await Promise.all([refetchThesisProjects(), refetchCount()])
  }, [refetchThesisProjects, refetchCount])

  const handleDeleteStudentThesis = async (record: StudentRow) => {
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi xóa.")
      return
    }
    const studentId = record.id
    if (!studentId) {
      message.warning("Không tìm thấy mã học viên.")
      return
    }

    try {
      showSpinner()
      const response = await deleteStudentThesis({
        thesisSessionId,
        studentId,
      })
      if (response.status !== 200 || !("deleted" in response.data)) {
        message.error(
          "message" in response.data
            ? response.data.message
            : "Đã xảy ra lỗi, vui lòng kiểm tra lại"
        )
        return
      }

      setEditingRowKeys((prev) => prev.filter((k) => k !== studentId))
      setEditingValues((prev) => {
        const next = { ...prev }
        delete next[studentId]
        return next
      })
      setSelectedRowKeys((prev) => prev.filter((k) => k !== studentId))

      await refetchThesisTableData()
      message.success("Xóa luận văn thành công")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleExportCouncilImportTemplate = async () => {
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi xuất mẫu nhập hội đồng.")
      return
    }

    try {
      showSpinner()
      const response = await exportCouncilImportTemplate({ thesisSessionId })
      if (response.status !== 200 || !(response.data instanceof Blob)) {
        message.error(
          response.data && typeof response.data === "object" && "message" in response.data
            ? String(response.data.message)
            : "Xuất mẫu nhập hội đồng thất bại."
        )
        return
      }

      const disposition = response.headers.get("Content-Disposition") || ""
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
      const fileName = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : plainMatch?.[1] || "MauNhapHoiDong.xlsx"

      const url = URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success("Xuất mẫu nhập hội đồng thành công")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi khi xuất mẫu nhập hội đồng")
    } finally {
      hideSpinner()
    }
  }

  const handleImportCouncilFromExcel = async (file: File) => {
    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi import hội đồng.")
      return
    }

    try {
      showSpinner()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("thesisSessionId", thesisSessionId)
      const response = await importCouncilFromExcel(formData)
      if (response.status !== 200 || !("updatedCount" in response.data)) {
        message.error(
          "message" in response.data ? response.data.message : "Import hội đồng thất bại."
        )
        return
      }
      message.success(`Import thành công ${response.data.updatedCount} đề tài.`)
      setEditingRowKeys([])
      setEditingValues({})
      setSelectedRowKeys([])
      await refetchThesisTableData()
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi khi import hội đồng")
    } finally {
      hideSpinner()
      if (councilImportInputRef.current) {
        councilImportInputRef.current.value = ""
      }
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

    const thesisSessionId = searchParams.thesisSessionId?.trim()
    if (!thesisSessionId) {
      message.warning("Vui lòng chọn đợt luận văn trước khi lưu.")
      return
    }

    const allowSupervisorEdit = role === "Khoa" || role === "P7"
    const items = []

    for (const studentId of selectedRowKeys) {
      const rowData = editingValues[studentId.toString()]
      if (!rowData) continue
      const studentRecord = students?.find((s) => s.id === studentId)
      const thesisProjectId = getThesisProjectForSession(studentRecord, thesisSessionId)?.id
      if (!thesisProjectId) continue

      if (hasDuplicateCouncilExperts(rowData)) {
        message.error(
          `Các cán bộ hội đồng bảo vệ không được trùng nhau (mã học viên: ${studentRecord?.code || studentId}).`
        )
        return
      }
      if (hasSupervisorConflictWithCouncilRow(rowData)) {
        message.error(
          `Giáo viên hướng dẫn không được trùng với các thành viên hội đồng bảo vệ (mã học viên: ${studentRecord?.code || studentId}).`
        )
        return
      }
      if (allowSupervisorEdit) {
        if (hasDuplicateThesisSupervisors(rowData.supervisor, rowData.coSupervisor)) {
          message.error(
            `GVHD 1 và GVHD 2 không được trùng nhau (mã học viên: ${studentRecord?.code || studentId}).`
          )
          return
        }
        const orig = getThesisProjectForSession(studentRecord, thesisSessionId)
        if (orig) {
          const newSup = rowData.supervisor ?? ""
          const newCo = rowData.coSupervisor ?? ""
          const oldSup = orig.supervisor?.expertId ?? ""
          const oldCo = orig.coSupervisor?.expertId ?? ""
          if ((newSup !== oldSup || newCo !== oldCo) && !isWithinGvhdSupervisorEditWindow()) {
            message.error(
              "Đã quá hạn nhập GVHD. Chỉ được thay đổi giáo viên hướng dẫn khi còn trong hạn (theo ngày hạn nhập đề tài của đợt xét)."
            )
            return
          }
        }
      }

      items.push({
        thesisProjectId,
        studentCode: typeof studentRecord?.code === "string" ? studentRecord.code : null,
        title: rowData.title ?? "",
        type: rowData.type ?? "",
        language: rowData.language ?? "",
        status: rowData.status ?? "",
        defenseDate: rowData.defenseDate ? new Date(rowData.defenseDate).toISOString() : null,
        researchTopicAssociated: rowData.researchTopicAssociated || "",
        organizationId: rowData.organization || null,
        supervisorId: rowData.supervisor || null,
        coSupervisorId: rowData.coSupervisor || null,
        roomId: rowData.room || null,
        defenseSessionId: rowData.defenseSession || null,
        score: rowData.score ?? null,
        councilChairman: rowData.councilChairman || null,
        councilSecretary: rowData.councilSecretary || null,
        reviewer1: rowData.reviewer1 || null,
        reviewer2: rowData.reviewer2 || null,
        councilMember: rowData.councilMember || null,
      })
    }

    if (items.length === 0) {
      message.info("Không có đề tài hợp lệ để lưu.")
      return
    }

    try {
      showSpinner()
      const response = await batchUpdateThesisProjects({
        thesisSessionId,
        allowSupervisorEdit,
        items,
      })
      if (response.status !== 200 || !("updatedCount" in response.data)) {
        message.error(
          "message" in response.data
            ? response.data.message
            : "Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại"
        )
        return
      }
      message.success(`Lưu thành công ${response.data.updatedCount} đề tài đã chỉnh sửa.`)
      setSelectedRowKeys([])
      setEditingRowKeys([])
      setEditingValues({})
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
      await refetchThesisTableData()
    }
  }
  const handleActivateEdit = () => {
    if (!students || students.length === 0) {
      message.info("Không có dữ liệu sinh viên để chỉnh sửa.")
      return
    }

    const newEditingRowKeys = students.map((s) => s.id).filter((id): id is string => Boolean(id))
    const initialEditingValues: Record<string, Record<string, any>> = {}

    students.forEach((record) => {
      const studentId = record.id
      if (!studentId) return
      const thesisProject = getThesisProjectForSession(record, searchParams.thesisSessionId)
      if (thesisProject) {
        initialEditingValues[studentId] = {
          title: thesisProject.title || "",
          supervisor: thesisProject.supervisor?.expertId || "",
          coSupervisor: thesisProject.coSupervisor?.expertId || "",
          language: thesisProject.language || "",
          type: thesisProject.type || "",
          status: thesisProject.status || "",
          defenseDate: thesisProject.defenseDate || "",
          defenseSession: thesisProject.defenseSession?.id || "",
          room: thesisProject.room?.id || "",
          councilChairman:
            thesisProject.council?.members?.find(
              (member: { role?: string | null }) => member.role === CouncilRole.CHAIRMAN
            )?.expertId || "",
          councilSecretary:
            thesisProject.council?.members?.find(
              (member: { role?: string | null }) => member.role === CouncilRole.SECRETARY
            )?.expertId || "",
          reviewer1:
            thesisProject.council?.members?.find(
              (member: { role?: string | null }) => member.role === CouncilRole.REVIEWER_1
            )?.expertId || "",
          reviewer2:
            thesisProject.council?.members?.find(
              (member: { role?: string | null }) => member.role === CouncilRole.REVIEWER_2
            )?.expertId || "",
          councilMember:
            thesisProject.council?.members?.find(
              (member: { role?: string | null }) => member.role === CouncilRole.MEMBER
            )?.expertId || "",
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

  const warnMissingThesisPaymentConfig = useCallback(() => {
    if (thesisConfigPaymentSessionId) return true
    message.warning(
      "Đợt xét chưa gán định mức thanh toán. Vui lòng cấu hình tại Cấu hình thanh toán luận văn hoặc khi tạo đợt xét."
    )
    return false
  }, [thesisConfigPaymentSessionId, message])

  const askRecreatePayments = (): Promise<boolean | null> =>
    new Promise((resolve) => {
      let settled = false
      const settle = (value: boolean | null) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      const modal = Modal.confirm({
        width: 600,
        centered: true,
        closable: true,
        maskClosable: false,
        icon: null,
        title: (
          <Flex align="center" gap={12}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg text-blue-500">
              <WalletOutlined />
            </span>
            <span className="text-base font-semibold text-gray-900">Tạo lại thanh toán?</span>
          </Flex>
        ),
        content: (
          <p className="mb-0 mt-1 pl-[52px] text-sm text-gray-500">
            Cập nhật theo định mức hiện tại cho mọi bản ghi.
          </p>
        ),
        styles: {
          content: { padding: "20px 24px 12px" },
          footer: { padding: "12px 24px 20px", marginTop: 0 },
        },
        footer: (
          <Flex justify="flex-end" gap={8}>
            <Button
              onClick={() => {
                modal.destroy()
                settle(false)
              }}
            >
              Không
            </Button>
            <Button
              type="primary"
              onClick={() => {
                modal.destroy()
                settle(true)
              }}
            >
              Có
            </Button>
          </Flex>
        ),
        onCancel: () => {
          modal.destroy()
          settle(null)
        },
      })
    })

  type SignerPayload = {
    signerName: string
    isChief: boolean
    signingDate?: Date
    moneyAmount?: number
  }

  const getThesisExportFilters = useCallback(
    (payload?: SignerPayload & { recreateAllPayments?: boolean }) => {
      const fixedClassIds =
        searchParams.fixedClassId && searchParams.fixedClassId.length > 0
          ? searchParams.fixedClassId
          : fixedClasses?.map((f) => f.id).filter(Boolean)

      return {
        thesisSessionId: searchParams.thesisSessionId || "",
        fixedClassIds,
        trainingCourseIds: trainingCourseIds.length ? trainingCourseIds : undefined,
        organizationId: searchParams.organizationId || undefined,
        signerName: payload?.signerName,
        isChief: payload?.isChief,
        signingDate: payload?.signingDate ? dayjs(payload.signingDate).toISOString() : undefined,
        moneyAmount: payload?.moneyAmount,
        recreateAllPayments: payload?.recreateAllPayments,
      }
    },
    [
      fixedClasses,
      searchParams.fixedClassId,
      searchParams.organizationId,
      searchParams.thesisSessionId,
      trainingCourseIds,
    ]
  )

  const getExportFileName = (headers: Headers, fallback: string) => {
    const disposition = headers.get("Content-Disposition") || ""
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
    return utf8Match?.[1]
      ? decodeURIComponent(utf8Match[1])
      : plainMatch?.[1]
        ? plainMatch[1]
        : fallback
  }

  const runThesisExport = useCallback(
    async (kind: string, fallbackFileName: string, payload?: SignerPayload & { recreateAllPayments?: boolean }) => {
      const filters = getThesisExportFilters(payload)
      if (!filters.thesisSessionId) {
        message.warning("Vui lòng chọn đợt xét luận văn trước khi xuất.")
        return
      }

      try {
        showSpinner()
        const response = await exportThesisTemplate(kind, filters)
        if (response.status !== 200 || !(response.data instanceof Blob)) {
          message.error(
            response.data && typeof response.data === "object" && "message" in response.data
              ? String(response.data.message)
              : "Xuất file thất bại."
          )
          return
        }
        saveAs(response.data, getExportFileName(response.headers, fallbackFileName))
        message.success("Xuất file thành công")
      } catch (error) {
        console.error(error)
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      } finally {
        hideSpinner()
      }
    },
    [getThesisExportFilters, hideSpinner, showSpinner]
  )

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
      onClick: async () => {
        return runThesisExport("phu-luc-ds-luan-van", "PhuLucDsLuanVan.xlsx")
      },
    },
    {
      id: 2,
      label: "Sao quyết định hướng dẫn luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("sao-qd-huong-dan", "BanSaoQDHuongDanLuanVan.docx", signer)
      },
    },
    {
      id: 3,
      label: "Giấy mời hướng dẫn luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("giay-moi-hdlv", "GiayMoiHDLV.docx", signer)
      },
    },
    {
      id: 5,
      label: "Giấy mời chấm luận văn phản biện",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("giay-moi-cham-pb", "GiayMoiChamLuanVan.docx", signer)
      },
    },
    {
      id: 6,
      label: "Phụ lục quyết định hội đồng bảo vệ",
      onClick: async () => {
        return runThesisExport("phu-luc-qd-hd", "PhuLucQdhd.docx")
      },
    },
    {
      id: 6.1,
      label: "Bản sao hội đồng đánh giá luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("ban-sao-hddglv", "BanSaoHoiDongDanhGiaLuanVan.docx", signer)
      },
    },
    {
      id: 8,
      label: "Hồ sơ bảo vệ luận văn",
      needModal: true,
      needSign: true,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("ho-so-bao-ve", "Hosobvlv.docx", signer)
      },
    },
    {
      id: 9,
      label: "Danh sách bảo vệ",
      onClick: async () => {
        return runThesisExport("danh-sach-bao-ve", "DanhSachBaoVe.xlsx")
      },
    },
    {
      id: 10,
      label: "Danh sách bảo vệ(Dán PBV)",
      onClick: async () => {
        return runThesisExport("ds-bao-ve-dan-phong", "DanhSachBaoVeDanPhong.xlsx")
      },
    },
    {
      id: 11,
      label: "Thanh toán hội đồng bảo vệ",
      onClick: async () => {
        if (!warnMissingThesisPaymentConfig()) return
        const recreateChoice = await askRecreatePayments()
        if (recreateChoice === null) return
        return runThesisExport("thanh-toan-hoi-dong", "ThanhToanHoiDongBaoVe.xlsx", {
          recreateAllPayments: recreateChoice,
        } as SignerPayload & { recreateAllPayments: boolean })
      },
    },
    {
      id: 12,
      label: "Danh sách chuyên gia",
      needModal: true,
      needMoney: true,
      needSign: false,
      onClick: async (signer?: SignerPayload) => {
        return runThesisExport("danh-sach-chuyen-gia", "DsChuyenGia.xlsx", signer)
      },
    },

    {
      id: 13,
      label: "Thanh toán hướng dẫn",
      onClick: async () => {
        if (!warnMissingThesisPaymentConfig()) return
        const recreateChoice = await askRecreatePayments()
        if (recreateChoice === null) return
        return runThesisExport("thanh-toan-huong-dan", "ThanhToanHuongDan.xlsx", {
          recreateAllPayments: recreateChoice,
        } as SignerPayload & { recreateAllPayments: boolean })
      },
    },
    {
      id: 14,
      label: "Thống kê chuyên gia hướng dẫn luận văn",
      onClick: async () => {
        return runThesisExport("thong-ke-gvhd", "ThongKeCanBoHuongDan.xlsx")
      },
    },
    {
      id: 15,
      label: "Thống kê cán bộ tham gia hội đồng bảo vệ",
      onClick: async () => {
        return runThesisExport("thong-ke-hd", "ThongKeCbThamGiaHd.xlsx")
      },
    },
    {
      id: 15.1,
      label: "Thống kê cơ quan đơn vị cán bộ (ngoài học viên)",
      onClick: async () => {
        return runThesisExport("thong-ke-don-vi-ngoai", "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx")
      },
    },
    {
      id: 16,
      label: "Thống kê kết quả bảo vệ luận văn",
      onClick: async () => {
        return runThesisExport("ket-qua-bao-ve", "KetQuaBaoVeLuanVan.xlsx")
      },
    },
    {
      id: 19,
      label: "Danh sách nộp luận văn thư viện",
      onClick: async () => {
        return runThesisExport("nop-thu-vien", "DanhSachNopLuanVanThuVien.xlsx")
      },
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
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó trưởng phòng"} sau đại học trong đợt xét.`
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
                Phó trưởng phòng sau đại học: <strong>{deputyDisplay}</strong>
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
                          fixedClassId: [],
                        })
                        form.setFieldsValue({ fixedClassId: [] })
                        setTrainingCourseIds(
                          thesisSessionData
                            ?.find((x) => x.id === value)
                            ?.trainingCourses?.map((c) => c.id) ?? []
                        )
                        setCurrentPage(1)
                        setEditingRowKeys([])
                      }}
                      placeholder="Chọn đợt xét"
                    />
                  </Form.Item>
                  <Form.Item label="Khóa học" required>
                    <Select
                      mode="multiple"
                      className="w-64"
                      maxTagCount="responsive"
                      maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                      disabled={!searchParams.thesisSessionId}
                      options={selectedThesisSession?.trainingCourses?.map((c) => ({
                        label: c.name,
                        value: c.id,
                      }))}
                      value={trainingCourseIds}
                      placeholder="Chọn khóa học"
                      onChange={(value) => {
                        setTrainingCourseIds(value as string[])
                        form.setFieldsValue({ fixedClassId: [] })
                        setSearchParams({
                          ...searchParams,
                          fixedClassId: [],
                        })
                        setCurrentPage(1)
                        setEditingRowKeys([])
                      }}
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
                            students: sampleStudents,
                            onSuccess: refetchThesisTableData,
                          })
                        }}
                      >
                        Tạo dữ liệu mẫu
                      </Button>
                    )}
                    <Button
                      type="default"
                      className="ml-2"
                      onClick={handleExportCouncilImportTemplate}
                      disabled={!searchParams.thesisSessionId}
                    >
                      Xuất mẫu nhập HĐ
                    </Button>
                    <Button
                      type="default"
                      className="ml-2"
                      onClick={() => councilImportInputRef.current?.click()}
                      disabled={!searchParams.thesisSessionId}
                    >
                      Import hội đồng
                    </Button>
                    <input
                      ref={councilImportInputRef}
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleImportCouncilFromExcel(file)
                      }}
                    />
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
                      onClick={async () =>
                        openModalChuyenDiemLopMonHoc({
                          allStudentsInClasses: await getExportStudentRows(),
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
                        await runThesisExport("de-xuat-hd", "DeNghiHDDanhGiaLuanVan.xlsx")
                      }}
                    >
                      Đề xuất hội đồng
                    </Button>
                  )}
                  {role === "Khoa" && (
                    <Button
                      type="primary"
                      onClick={async () => {
                        await runThesisExport("kiem-tra-tien-do", "KiemTraTienDo.xlsx")
                      }}
                    >
                      Kiểm tra tiến độ
                    </Button>
                  )}
                  <Form.Item className="mb-0" style={{ marginBottom: 0 }}>
                    <Input
                      className="w-64"
                      allowClear
                      prefix={<SearchOutlined className="text-gray-400" />}
                      value={nameKeyword}
                      placeholder="Tìm kiếm..."
                      onChange={(e) => setNameKeyword(e.target.value)}
                    />
                  </Form.Item>
                </Space>
              </Col>
            </Row>
          </Form>
        </Col>

        <Col span={24}>
          <Table<StudentRow>
            bordered
            scroll={{ x: "max-content" }}
            className={"mt-2"}
            rowKey="id"
            filters={filters}
            setFilters={(value: FilterProps) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "Khoa quản lí",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.organization
                      ?.sMa || ""
                  ).localeCompare(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)?.organization
                      ?.sMa || ""
                  ),
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
                sorter: (a: StudentRow, b: StudentRow) =>
                  (a?.code || "").localeCompare(b?.code || ""),
                width: 120,
                fixed: "left",
                dataIndex: "code",
                render: (_, record) => {
                  return record?.code
                },
              },
              {
                title: "Họ tên học viên",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (a?.userProfile?.fullname || "").localeCompare(b?.userProfile?.fullname || ""),
                width: 180,
                fixed: "left",
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.fullname
                },
              },
              {
                title: "Ngày sinh",
                sorter: (a: StudentRow, b: StudentRow) => {
                  const dateA = a?.userProfile?.dateOfBirth
                    ? new Date(a.userProfile.dateOfBirth).getTime()
                    : 0
                  const dateB = b?.userProfile?.dateOfBirth
                    ? new Date(b.userProfile.dateOfBirth).getTime()
                    : 0
                  return dateA - dateB
                },
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
                sorter: (a: StudentRow, b: StudentRow) =>
                  (a?.fixedClass?.name || "").localeCompare(b?.fixedClass?.name || ""),
                width: 250,
                dataIndex: "fixedClass",
                // align: "center",
                render: (_, record) => {
                  return record?.fixedClass?.name || ""
                },
              },
              {
                title: "Đề tài",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.title || ""
                  ).localeCompare(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)?.title || ""
                  ),
                width: 350,
                // fixed: "left",
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
                sorter: (a: StudentRow, b: StudentRow) => {
                  const valA = getSupervisorName(
                    versionToPersonLike(
                      getThesisProjectForSession(a, searchParams.thesisSessionId)?.supervisor
                    ),
                    false,
                    false
                  )
                  const valB = getSupervisorName(
                    versionToPersonLike(
                      getThesisProjectForSession(b, searchParams.thesisSessionId)?.supervisor
                    ),
                    false,
                    false
                  )
                  return String(valA || "").localeCompare(String(valB || ""))
                },
                width: 200,
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
                          ?.expertId || ""
                    const coSupervisorPeerId = hasEditedCoSupervisor
                      ? editingValues[record?.id]?.coSupervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)
                          ?.coSupervisor?.expertId
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) =>
                              !coSupervisorPeerId || item.id !== String(coSupervisorPeerId),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(record, searchParams.thesisSessionId)
                                  ?.supervisor
                              ),
                            }
                          )}
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

                  return getSupervisorName(
                    versionToPersonLike(supervisor),
                    true,
                    true,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "GVHD 2",
                sorter: (a: StudentRow, b: StudentRow) => {
                  const valA = getSupervisorName(
                    versionToPersonLike(
                      getThesisProjectForSession(a, searchParams.thesisSessionId)?.coSupervisor
                    ),
                    false,
                    false
                  )
                  const valB = getSupervisorName(
                    versionToPersonLike(
                      getThesisProjectForSession(b, searchParams.thesisSessionId)?.coSupervisor
                    ),
                    false,
                    false
                  )
                  return String(valA || "").localeCompare(String(valB || ""))
                },
                width: 200,
                // fixed: "left",
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
                          ?.coSupervisor?.expertId || ""
                    const supervisorPeerId = hasEditedSupervisor
                      ? editingValues[record?.id]?.supervisor
                      : getThesisProjectForSession(record, searchParams.thesisSessionId)?.supervisor
                          ?.expertId

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          allowClear
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: 200 }}
                          className="w-full"
                          disabled={!isWithinGvhdSupervisorEditWindow()}
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) => !supervisorPeerId || item.id !== String(supervisorPeerId),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(record, searchParams.thesisSessionId)
                                  ?.coSupervisor
                              ),
                            }
                          )}
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
                  return getSupervisorName(
                    versionToPersonLike(coSupervisor),
                    true,
                    true,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Gán với đề tài nghiên cứu",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (
                    getThesisProjectForSession(a, searchParams.thesisSessionId)
                      ?.researchTopicAssociated || ""
                  ).localeCompare(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)
                      ?.researchTopicAssociated || ""
                  ),
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
                sorter: (a: StudentRow, b: StudentRow) => {
                  const valA = getThesisProjectForSession(a, searchParams.thesisSessionId)?.language
                  const valB = getThesisProjectForSession(b, searchParams.thesisSessionId)?.language
                  const strA =
                    typeof valA === "object" ? (valA as Record<string, unknown>)?.language : valA
                  const strB =
                    typeof valB === "object" ? (valB as Record<string, unknown>)?.language : valB
                  return String(strA || "").localeCompare(String(strB || ""))
                },
                width: 100,
                dataIndex: "language",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const rawLang = getThesisProjectForSession(
                      record,
                      searchParams.thesisSessionId
                    )?.language
                    const langStr = typeof rawLang === "object" ? rawLang?.language : rawLang
                    const currentValue =
                      editingValues[record?.id]?.language !== undefined
                        ? editingValues[record?.id]?.language
                        : langStr || ""
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={String(currentValue || "")}
                          onChange={(e) => handleEditChange(record?.id, "language", e.target.value)}
                        />
                      </div>
                    )
                  }
                  const rawLang = getThesisProjectForSession(
                    record,
                    searchParams.thesisSessionId
                  )?.language
                  const langStr = typeof rawLang === "object" ? rawLang?.language : rawLang
                  return String(langStr || "")
                },
              },
              {
                title: "Luận văn/Đề án",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.type || ""
                  ).localeCompare(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)?.type || ""
                  ),
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
                title: "Chủ tịch",
                sorter: (a: StudentRow, b: StudentRow) =>
                  String(
                    getCouncilMemberName(
                      a,
                      CouncilRole.CHAIRMAN,
                      searchParams.thesisSessionId,
                      true
                    )
                  ).localeCompare(
                    String(
                      getCouncilMemberName(
                        b,
                        CouncilRole.CHAIRMAN,
                        searchParams.thesisSessionId,
                        true
                      )
                    )
                  ),
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
                          (member: { role?: string | null }) => member.role === CouncilRole.CHAIRMAN
                        )?.expertId || ""
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
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) =>
                              item.eligiblePresident === true &&
                              !!item.id &&
                              !excludedCouncilIds.has(item.id),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.council?.members?.find(
                                  (member: { role?: string | null }) =>
                                    member.role === CouncilRole.CHAIRMAN
                                )?.expertProfileVersion
                              ),
                            }
                          )}
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
                    searchParams.thesisSessionId,
                    false,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Thư ký",
                sorter: (a: StudentRow, b: StudentRow) =>
                  String(
                    getCouncilMemberName(
                      a,
                      CouncilRole.SECRETARY,
                      searchParams.thesisSessionId,
                      true
                    )
                  ).localeCompare(
                    String(
                      getCouncilMemberName(
                        b,
                        CouncilRole.SECRETARY,
                        searchParams.thesisSessionId,
                        true
                      )
                    )
                  ),
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
                          (member: { role?: string | null }) =>
                            member.role === CouncilRole.SECRETARY
                        )?.expertId || ""
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
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) =>
                              item.eligibleSecretary === true &&
                              !!item.id &&
                              !excludedCouncilIds.has(item.id),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.council?.members?.find(
                                  (member: { role?: string | null }) =>
                                    member.role === CouncilRole.SECRETARY
                                )?.expertProfileVersion
                              ),
                            }
                          )}
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
                    searchParams.thesisSessionId,
                    false,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Phản biện 1",
                sorter: (a: StudentRow, b: StudentRow) =>
                  String(
                    getCouncilMemberName(
                      a,
                      CouncilRole.REVIEWER_1,
                      searchParams.thesisSessionId,
                      true
                    )
                  ).localeCompare(
                    String(
                      getCouncilMemberName(
                        b,
                        CouncilRole.REVIEWER_1,
                        searchParams.thesisSessionId,
                        true
                      )
                    )
                  ),
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
                          (member: { role?: string | null }) =>
                            member.role === CouncilRole.REVIEWER_1
                        )?.expertId || ""
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
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) => !!item.id && !excludedCouncilIds.has(item.id),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.council?.members?.find(
                                  (member: { role?: string | null }) =>
                                    member.role === CouncilRole.REVIEWER_1
                                )?.expertProfileVersion
                              ),
                            }
                          )}
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
                    searchParams.thesisSessionId,
                    false,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Phản biện 2",
                sorter: (a: StudentRow, b: StudentRow) =>
                  String(
                    getCouncilMemberName(
                      a,
                      CouncilRole.REVIEWER_2,
                      searchParams.thesisSessionId,
                      true
                    )
                  ).localeCompare(
                    String(
                      getCouncilMemberName(
                        b,
                        CouncilRole.REVIEWER_2,
                        searchParams.thesisSessionId,
                        true
                      )
                    )
                  ),
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
                          (member: { role?: string | null }) =>
                            member.role === CouncilRole.REVIEWER_2
                        )?.expertId || ""
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
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) => !!item.id && !excludedCouncilIds.has(item.id),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.council?.members?.find(
                                  (member: { role?: string | null }) =>
                                    member.role === CouncilRole.REVIEWER_2
                                )?.expertProfileVersion
                              ),
                            }
                          )}
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
                    searchParams.thesisSessionId,
                    false,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Ủy viên",
                sorter: (a: StudentRow, b: StudentRow) =>
                  String(
                    getCouncilMemberName(a, CouncilRole.MEMBER, searchParams.thesisSessionId, true)
                  ).localeCompare(
                    String(
                      getCouncilMemberName(
                        b,
                        CouncilRole.MEMBER,
                        searchParams.thesisSessionId,
                        true
                      )
                    )
                  ),
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
                          (member: { role?: string | null }) => member.role === CouncilRole.MEMBER
                        )?.expertId || ""
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
                          options={buildExpertSelectOptions(
                            expertProfileData,
                            (item) => !!item.id && !excludedCouncilIds.has(item.id),
                            {
                              id: currentValue,
                              person: versionToPersonLike(
                                getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.council?.members?.find(
                                  (member: { role?: string | null }) =>
                                    member.role === CouncilRole.MEMBER
                                )?.expertProfileVersion
                              ),
                            }
                          )}
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
                    searchParams.thesisSessionId,
                    false,
                    debouncedNameKeyword,
                    expertProfileData
                  )
                },
              },
              {
                title: "Phòng bảo vệ",
                sorter: (a: StudentRow, b: StudentRow) =>
                  (
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.room?.name || ""
                  ).localeCompare(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)?.room?.name || ""
                  ),
                width: 150,
                dataIndex: "room",
                render: (_, record) => {
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
                sorter: (a: StudentRow, b: StudentRow) => {
                  const projA = getThesisProjectForSession(a, searchParams.thesisSessionId)
                  const projB = getThesisProjectForSession(b, searchParams.thesisSessionId)
                  const dateA = projA?.defenseDate
                    ? new Date(projA.defenseDate as string | Date).getTime()
                    : 0
                  const dateB = projB?.defenseDate
                    ? new Date(projB.defenseDate as string | Date).getTime()
                    : 0
                  return dateA - dateB
                },
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
                sorter: (a: StudentRow, b: StudentRow) =>
                  formatDefenseSessionClock(
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.defenseSession
                      ?.startTime
                  ).localeCompare(
                    formatDefenseSessionClock(
                      getThesisProjectForSession(b, searchParams.thesisSessionId)?.defenseSession
                        ?.startTime
                    )
                  ),
                width: 150,
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
                sorter: (a: StudentRow, b: StudentRow) =>
                  (Number(
                    getThesisProjectForSession(a, searchParams.thesisSessionId)?.defenseRecord
                      ?.finalScore
                  ) || 0) -
                  (Number(
                    getThesisProjectForSession(b, searchParams.thesisSessionId)?.defenseRecord
                      ?.finalScore
                  ) || 0),
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
                  const finalScore = getThesisProjectForSession(
                    record,
                    searchParams.thesisSessionId
                  )?.defenseRecord?.finalScore
                  return (finalScore as any)?.toString() || ""
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
                width: 130,
                fixed: "right",
                align: "center",
                render: (_, record) => {
                  if (record?.id) {
                    const status =
                      getThesisProjectForSession(record, searchParams.thesisSessionId)?.status || ""
                    const hasThesisProject = !!getThesisProjectForSession(
                      record,
                      searchParams.thesisSessionId
                    )?.id
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
                                let newStatus: ThesisProjectStatus = ThesisProjectStatus.IN_PROGRESS
                                const currentStatus = getThesisProjectForSession(
                                  record,
                                  searchParams.thesisSessionId
                                )?.status
                                if (currentStatus === ThesisProjectStatus.APPROVED_BY_DEPT) {
                                  newStatus = ThesisProjectStatus.IN_PROGRESS
                                }
                                await updateThesisProject({
                                  data: { status: newStatus },
                                  where: {
                                    id:
                                      getThesisProjectForSession(
                                        record,
                                        searchParams.thesisSessionId
                                      )?.id || "",
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
                                await updateThesisProject({
                                  data: { status: ThesisProjectStatus.DEFENSE_ELIGIBLE },
                                  where: {
                                    id:
                                      getThesisProjectForSession(
                                        record,
                                        searchParams.thesisSessionId
                                      )?.id || "",
                                  },
                                })
                              }}
                            />
                          ) : null}
                          {role === "P7" && hasThesisProject ? (
                            <span title="Chuyển đợt xét">
                              <ArrowRightLeft
                                size={24}
                                className="cursor-pointer text-blue-600"
                                onClick={() => {
                                  const thesisProject = getThesisProjectForSession(
                                    record,
                                    searchParams.thesisSessionId
                                  )
                                  if (!thesisProject?.id) {
                                    message.warning(
                                      "Không tìm thấy luận văn/đề án để chuyển đợt xét."
                                    )
                                    return
                                  }
                                  openModalChuyenDotXetLuanVan({
                                    thesisProjectId: String(thesisProject.id),
                                    thesisSessionId: searchParams.thesisSessionId || "",
                                    onSuccess: refetchThesisTableData,
                                  })
                                }}
                              />
                            </span>
                          ) : null}
                          <SquarePen
                            size={24}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              openModalCauHinhLuanVan({
                                thesisProjectId: String(
                                  getThesisProjectForSession(record, searchParams.thesisSessionId)
                                    ?.id || ""
                                ),
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
                              onConfirm: () => handleDeleteStudentThesis(record as StudentRow),
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
