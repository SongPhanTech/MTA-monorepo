import { CouncilRole } from "@workspace/db/client"
import dayjs from "dayjs"

export interface PersonLike {
  name?: string | null
  workplace?: string | null
  academicRankType?: { sMa?: string | null; [key: string]: unknown } | null
  academicDegreeType?: { sMa?: string | null; [key: string]: unknown } | null
  lecturer?: {
    userProfile?: {
      fullname?: string | null
      lastName?: string | null
      firstName?: string | null
      workplace?: string | null
      academicRankType?: { sMa?: string | null; [key: string]: unknown } | null
      academicDegreeType?: { sMa?: string | null; [key: string]: unknown } | null
      [key: string]: unknown
    } | null
    [key: string]: unknown
  } | null
  userProfile?: {
    fullname?: string | null
    lastName?: string | null
    firstName?: string | null
    workplace?: string | null
    academicRankType?: { sMa?: string | null; [key: string]: unknown } | null
    academicDegreeType?: { sMa?: string | null; [key: string]: unknown } | null
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

export interface ExpertProfileLike extends PersonLike {
  id?: string | null
  lecturerId?: string | null
}

export interface CouncilMemberLike {
  role?: CouncilRole | string | null
  expert?: PersonLike | null
  [key: string]: unknown
}

export interface CouncilLike {
  members?: CouncilMemberLike[] | null
  [key: string]: unknown
}

export interface ThesisProjectLike {
  title?: string | null
  titleEN?: string | null
  type?: string | null
  thesisType?: string | null
  primarySupervisor?: PersonLike | null
  secondarySupervisor?: PersonLike | null
  supervisor?: PersonLike | null
  supervisorName?: string | null
  coSupervisor?: PersonLike | null
  coSupervisorName?: string | null
  thirdSupervisor?: PersonLike | null
  thesisSession?: { name?: string | null; [key: string]: unknown } | null
  defenseDate?: string | Date | null
  defenseSession?: { startTime?: string | Date | null; [key: string]: unknown } | null
  room?: { name?: string | null; [key: string]: unknown } | null
  council?: CouncilLike | null
  CHUTICH?: string | null
  THUKY?: string | null
  PHANBIEN1?: string | null
  PHANBIEN2?: string | null
  UYVIEN3?: string | null
  [key: string]: unknown
}

export interface StudentThesisRegistrationLike {
  id?: string | null
  code?: string | null
  description?: string | null
  status?: string | null
  thesisProject?: ThesisProjectLike | null
  council?: CouncilLike | null
  [key: string]: unknown
}

export interface FormattedSupervisor {
  role: string
  name: string
  workplace?: string
  fullText: string
}

export interface FormattedCouncilMember {
  roleKey: string
  roleLabel: string
  name: string
  titleDegree?: string
  workplace?: string
  fullText: string
}

export const COUNCIL_ROLE_LABELS: Record<string, string> = {
  [CouncilRole.CHAIRMAN]: "Chủ tịch",
  [CouncilRole.SECRETARY]: "Thư ký",
  [CouncilRole.REVIEWER_1]: "Phản biện 1",
  [CouncilRole.REVIEWER_2]: "Phản biện 2",
  [CouncilRole.MEMBER]: "Ủy viên",
}

export function formatPersonName(
  person?: PersonLike | null,
  fallbackName?: string | null
): {
  name: string
  titleDegree: string
  workplace: string
  fullText: string
} {
  if (!person && !fallbackName) {
    return { name: "", titleDegree: "", workplace: "", fullText: "" }
  }

  if (!person) {
    return {
      name: fallbackName || "",
      titleDegree: "",
      workplace: "",
      fullText: fallbackName || "",
    }
  }

  const profile = person.lecturer?.userProfile || person.userProfile
  const rank = profile?.academicRankType?.sMa || person.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || person.academicDegreeType?.sMa || ""
  const titleDegree = [rank, degree].filter(Boolean).join(".")

  let fullname = person.name || profile?.fullname || ""
  if (!fullname && (profile?.lastName || profile?.firstName)) {
    fullname = `${profile.lastName || ""} ${profile.firstName || ""}`.trim()
  }

  const workplace = person.workplace || profile?.workplace || ""
  const textWithTitle = [titleDegree, fullname].filter(Boolean).join(" ").trim()
  const fullText = [textWithTitle, workplace].filter(Boolean).join(" - ")

  return {
    name: fullname,
    titleDegree,
    workplace,
    fullText,
  }
}

export function getThesisTitle(project?: ThesisProjectLike | null): {
  title: string
  titleEN?: string
  type?: string
} {
  if (!project) return { title: "" }
  return {
    title: project.title || "",
    titleEN: project.titleEN || "",
    type: project.type || project.thesisType || "",
  }
}

export function getSupervisorsFormatted(project?: ThesisProjectLike | null): FormattedSupervisor[] {
  if (!project) return []
  const result: FormattedSupervisor[] = []

  if (project.primarySupervisor) {
    const info = formatPersonName(project.primarySupervisor)
    if (info.fullText) {
      result.push({
        role: "GVHD chính",
        name: info.name,
        workplace: info.workplace,
        fullText: info.fullText,
      })
    }
  }

  if (project.supervisor || project.supervisorName) {
    const info = formatPersonName(project.supervisor, project.supervisorName)
    if (info.fullText) {
      const existingRole = result.find((r) => r.role === "GVHD chính")
      const roleLabel = existingRole ? "CBHD" : "GVHD chính"
      result.push({
        role: roleLabel,
        name: info.name,
        workplace: info.workplace,
        fullText: info.fullText,
      })
    }
  }

  if (project.secondarySupervisor) {
    const info = formatPersonName(project.secondarySupervisor)
    if (info.fullText) {
      result.push({
        role: "GVHD phụ",
        name: info.name,
        workplace: info.workplace,
        fullText: info.fullText,
      })
    }
  }

  if (project.coSupervisor || project.coSupervisorName) {
    const info = formatPersonName(project.coSupervisor, project.coSupervisorName)
    if (info.fullText) {
      result.push({
        role: "CBHD phụ",
        name: info.name,
        workplace: info.workplace,
        fullText: info.fullText,
      })
    }
  }

  if (project.thirdSupervisor) {
    const info = formatPersonName(project.thirdSupervisor)
    if (info.fullText) {
      result.push({
        role: "CBHD khác",
        name: info.name,
        workplace: info.workplace,
        fullText: info.fullText,
      })
    }
  }

  return result
}

export function getSupervisorsText(project?: ThesisProjectLike | null): string {
  const supervisors = getSupervisorsFormatted(project)
  if (!supervisors.length) return ""
  return supervisors.map((s) => `${s.role}: ${s.fullText}`).join("; ")
}

export function getDefenseSessionInfo(project?: ThesisProjectLike | null): {
  sessionName: string
  defenseDate: string
  defenseTime: string
  roomName: string
  fullText: string
} {
  if (!project) {
    return { sessionName: "", defenseDate: "", defenseTime: "", roomName: "", fullText: "" }
  }

  const sessionName = project.thesisSession?.name || ""
  const defenseDate = project.defenseDate
    ? dayjs(project.defenseDate).format("DD/MM/YYYY")
    : ""

  let defenseTime = ""
  if (project.defenseSession?.startTime) {
    const d = new Date(project.defenseSession.startTime)
    if (!Number.isNaN(d.getTime())) {
      defenseTime = `${String(d.getUTCHours()).padStart(2, "0")}:${String(
        d.getUTCMinutes()
      ).padStart(2, "0")}`
    }
  }

  const roomName = project.room?.name || ""

  const parts = [
    sessionName,
    defenseDate ? `Ngày BV: ${defenseDate}` : "",
    defenseTime ? `Giờ: ${defenseTime}` : "",
    roomName ? `Phòng: ${roomName}` : "",
  ].filter(Boolean)

  return {
    sessionName,
    defenseDate,
    defenseTime,
    roomName,
    fullText: parts.join(" - "),
  }
}

export function getCouncilMembersFormatted(
  councilData?: CouncilLike | null,
  project?: ThesisProjectLike | null
): FormattedCouncilMember[] {
  const result: FormattedCouncilMember[] = []
  const council = councilData || project?.council

  if (council?.members?.length) {
    const rolesOrder = [
      CouncilRole.CHAIRMAN,
      CouncilRole.SECRETARY,
      CouncilRole.REVIEWER_1,
      CouncilRole.REVIEWER_2,
      CouncilRole.MEMBER,
    ]

    const sortedMembers = [...council.members].sort((a, b) => {
      const indexA = rolesOrder.indexOf(a.role as CouncilRole)
      const indexB = rolesOrder.indexOf(b.role as CouncilRole)
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })

    for (const member of sortedMembers) {
      const info = formatPersonName(member.expert)
      const roleKey = member.role || ""
      const roleLabel = COUNCIL_ROLE_LABELS[roleKey] || roleKey || "Ủy viên"
      result.push({
        roleKey,
        roleLabel,
        name: info.name,
        titleDegree: info.titleDegree,
        workplace: info.workplace,
        fullText: info.fullText || info.name,
      })
    }
  }

  if (!result.length && project) {
    const fallbacks = [
      { roleKey: CouncilRole.CHAIRMAN, roleLabel: "Chủ tịch", val: project.CHUTICH },
      { roleKey: CouncilRole.SECRETARY, roleLabel: "Thư ký", val: project.THUKY },
      { roleKey: CouncilRole.REVIEWER_1, roleLabel: "Phản biện 1", val: project.PHANBIEN1 },
      { roleKey: CouncilRole.REVIEWER_2, roleLabel: "Phản biện 2", val: project.PHANBIEN2 },
      { roleKey: CouncilRole.MEMBER, roleLabel: "Ủy viên", val: project.UYVIEN3 },
    ]

    for (const fb of fallbacks) {
      if (fb.val) {
        result.push({
          roleKey: fb.roleKey,
          roleLabel: fb.roleLabel,
          name: fb.val,
          fullText: fb.val,
        })
      }
    }
  }

  return result
}

export function getCouncilMembersText(
  councilData?: CouncilLike | null,
  project?: ThesisProjectLike | null
): string {
  const members = getCouncilMembersFormatted(councilData, project)
  if (!members.length) return ""
  return members.map((m) => `${m.roleLabel}: ${m.fullText}`).join("; ")
}
