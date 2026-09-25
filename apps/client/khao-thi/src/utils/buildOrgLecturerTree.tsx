import { FolderOpenOutlined, UserOutlined } from "@ant-design/icons"
import type { ProgressRow } from "@components/sub-pages/khao-sat/survey-progress-table"
import type { Prisma } from "@workspace/db/client"
import { lecturerDonViId } from "@workspace/libs"
import type { DataNode } from "antd/es/tree"

export const ORG_SELECT = {
  Id: true,
  sMa: true,
  sTen: true,
  bActive: true,
  iCapDonVi: true,
  iDictionaryKey: true,
  iLoaiDonVi: true,
  iNhomDonVi: true,
  sParentId: true,
} as const

export const CLUSTER_LECTURER_SURVEY_INCLUDE = {
  surveySessions: {
    select: {
      id: true,
      completedAt: true,
      isCompleted: true,
    },
  },
  subjectClass: {
    select: {
      id: true,
      subjectClassStudent: {
        select: { id: true },
      },
    },
  },
} as const

export const CLUSTER_LECTURER_INCLUDE = {
  userProfile: { include: { donVi: true } },
  survey: {
    include: CLUSTER_LECTURER_SURVEY_INCLUDE,
  },
} as const

export type Org = Prisma.DM_DonViGetPayload<{ select: typeof ORG_SELECT }>
export type ClusterLecturer = Prisma.LecturerGetPayload<{
  include: typeof CLUSTER_LECTURER_INCLUDE
}>

export type OrgTreeNode = DataNode & {
  kind: "org"
  org: Org
  parentOrg?: Org
  children: ReportTreeNode[]
}

export type LecturerTreeNode = DataNode & {
  kind: "lecturer"
  lecturer: ClusterLecturer
}

export type ReportTreeNode = OrgTreeNode | LecturerTreeNode

export function isOrgNode(node: ReportTreeNode): node is OrgTreeNode {
  return node.kind === "org"
}

export function isLecturerNode(node: ReportTreeNode): node is LecturerTreeNode {
  return node.kind === "lecturer"
}

export function orgTitle(org: Org): string {
  return [org.sMa, org.sTen].filter(Boolean).join(" - ") || "Đơn vị không tên"
}

export function lecturerTitle(lecturer: ClusterLecturer): string {
  const fromParts =
    `${lecturer.userProfile?.lastName ?? ""} ${lecturer.userProfile?.firstName ?? ""}`.trim()
  return fromParts || lecturer.userProfile?.fullname || "Giảng viên không tên"
}

function lecturerTreeTitle(lecturer: ClusterLecturer) {
  const name = lecturerTitle(lecturer)
  const hasResponse = getLecturerSurveyStats(lecturer).completed > 0
  return <span style={{ color: hasResponse ? "#111827" : "#ff4d4f" }}>{name}</span>
}

export function mergeOrgs(base: Org[], lecturers: ClusterLecturer[]): Org[] {
  const byId = new Map(base.map((org) => [org.Id, org]))
  for (const lecturer of lecturers) {
    const orgId = lecturerDonViId(lecturer)
    const org = orgId ? byId.get(orgId) : undefined
    if (org && !byId.has(org.Id)) {
      byId.set(org.Id, org)
    }
  }
  return [...byId.values()]
}

export function buildOrgLecturerTree(orgs: Org[], lecturers: ClusterLecturer[]): ReportTreeNode[] {
  const byId = new Map<string, OrgTreeNode>()
  const attachedLecturerIds = new Set<string>()

  for (const org of orgs) {
    const children: ReportTreeNode[] = lecturers
      .filter((lecturer) => lecturerDonViId(lecturer) === org.Id)
      .map((lecturer) => {
        attachedLecturerIds.add(lecturer.id)
        return {
          kind: "lecturer" as const,
          key: lecturer.id,
          title: lecturerTreeTitle(lecturer),
          icon: <UserOutlined />,
          lecturer,
        }
      })

    byId.set(org.Id, {
      kind: "org",
      key: org.Id,
      title: orgTitle(org),
      icon: <FolderOpenOutlined />,
      selectable: true,
      org,
      children,
    })
  }

  const roots: ReportTreeNode[] = []
  for (const org of orgs) {
    const node = byId.get(org.Id)
    if (!node) continue
    const parent = org.sParentId ? byId.get(org.sParentId) : undefined
    if (parent) {
      node.parentOrg = parent.org
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const lecturer of lecturers) {
    if (attachedLecturerIds.has(lecturer.id)) continue
    roots.push({
      kind: "lecturer",
      key: lecturer.id,
      title: lecturerTreeTitle(lecturer),
      icon: <UserOutlined />,
      lecturer,
    })
  }

  return roots
}

export function getLecturerSurveyStats(lecturer: ClusterLecturer) {
  const surveys = lecturer.survey ?? []
  return {
    total: surveys.reduce(
      (sum, survey) => sum + (survey.subjectClass?.subjectClassStudent.length ?? 0),
      0
    ),
    completed: surveys.reduce(
      (sum, survey) =>
        sum +
        survey.surveySessions.filter((session) => session.completedAt || session.isCompleted)
          .length,
      0
    ),
  }
}

function descendantOrgIds(orgs: Org[], orgId: string): string[] {
  const children = orgs.filter((org) => org.sParentId === orgId)
  return children.flatMap((org) => [org.Id, ...descendantOrgIds(orgs, org.Id)])
}

export function buildProgressRows(orgs: Org[], lecturers: ClusterLecturer[]): ProgressRow[] {
  const stats = Object.fromEntries(
    lecturers.map((lecturer) => [lecturer.id, getLecturerSurveyStats(lecturer)])
  )

  const countByOrg = (orgId: string, field: "total" | "completed") => {
    const orgIds = [orgId, ...descendantOrgIds(orgs, orgId)]
    return lecturers
      .filter((lecturer) => {
        const orgId = lecturerDonViId(lecturer)
        return orgId && orgIds.includes(orgId)
      })
      .reduce((sum, lecturer) => sum + (stats[lecturer.id]?.[field] ?? 0), 0)
  }

  const facultyRows: ProgressRow[] = orgs
    .filter((org) => org.iLoaiDonVi === 5 || org.iLoaiDonVi === 6)
    .map((org) => ({
      key: `faculty-${org.Id}`,
      type: "faculty" as const,
      name: orgTitle(org),
      completed: countByOrg(org.Id, "completed"),
      total: countByOrg(org.Id, "total"),
    }))

  const departmentRows: ProgressRow[] = orgs
    .filter((org) => org.iLoaiDonVi === 7)
    .map((org) => ({
      key: `department-${org.Id}`,
      parentKey: `faculty-${org.sParentId}`,
      type: "department" as const,
      name: orgTitle(org),
      completed: countByOrg(org.Id, "completed"),
      total: countByOrg(org.Id, "total"),
    }))

  const lecturerRows: ProgressRow[] = lecturers
    .filter((lecturer) => lecturerDonViId(lecturer))
    .map((lecturer) => {
      const donViId = lecturerDonViId(lecturer)
      const organization = orgs.find((org) => org.Id === donViId)
      const code = lecturer.userProfile?.code?.trim() || ""
      const name = [code, lecturerTitle(lecturer)].filter(Boolean).join(" - ")

      return {
        key: `lecturer-${lecturer.id}`,
        parentKey:
          organization?.iLoaiDonVi === 7 ? `department-${donViId}` : `faculty-${donViId}`,
        type: "lecturer" as const,
        name,
        completed: stats[lecturer.id]?.completed ?? 0,
        total: stats[lecturer.id]?.total ?? 0,
      }
    })

  const totalCompleted = lecturers.reduce(
    (sum, lecturer) => sum + (stats[lecturer.id]?.completed ?? 0),
    0
  )
  const totalStudents = lecturers.reduce(
    (sum, lecturer) => sum + (stats[lecturer.id]?.total ?? 0),
    0
  )

  return [
    ...facultyRows,
    ...departmentRows,
    ...lecturerRows,
    {
      key: "total",
      type: "total",
      name: "Tổng số",
      completed: totalCompleted,
      total: totalStudents,
    },
  ]
}
