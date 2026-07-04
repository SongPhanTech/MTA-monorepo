import {
  CouncilProposalStatus,
  CouncilRole,
  ThesisProjectStatus,
  ThesisType,
} from "@workspace/db/client"
import { prisma } from ".."

export type BatchUpdateThesisItem = {
  thesisProjectId: string
  studentCode?: string | null
  title?: string | null
  type?: string | null
  language?: string | null
  status?: string | null
  defenseDate?: string | Date | null
  researchTopicAssociated?: string | null
  organizationId?: string | null
  supervisorId?: string | null
  coSupervisorId?: string | null
  roomId?: string | null
  defenseSessionId?: string | null
  score?: string | number | null
  councilChairman?: string | null
  councilSecretary?: string | null
  reviewer1?: string | null
  reviewer2?: string | null
  councilMember?: string | null
}

export type BatchUpdateThesisProjectsParams = {
  thesisSessionId: string
  allowSupervisorEdit?: boolean
  items: BatchUpdateThesisItem[]
}

export type BatchUpdateThesisProjectsResult = {
  updatedCount: number
}

const COUNCIL_EXPERT_FIELDS = [
  "councilChairman",
  "councilSecretary",
  "reviewer1",
  "reviewer2",
  "councilMember",
] as const

const THESIS_PROJECT_STATUSES = new Set<string>(Object.values(ThesisProjectStatus))

function normalizeId(value: unknown): string | null {
  if (value === "" || value === undefined || value === null) return null
  return String(value)
}

function studentLabel(item: BatchUpdateThesisItem) {
  return item.studentCode || item.thesisProjectId
}

function hasDuplicateThesisSupervisors(supervisorId: string | null, coSupervisorId: string | null) {
  return supervisorId !== null && coSupervisorId !== null && supervisorId === coSupervisorId
}

function getCouncilExpertIds(item: BatchUpdateThesisItem): string[] {
  return COUNCIL_EXPERT_FIELDS.map((field) => normalizeId(item[field])).filter(
    (id): id is string => id !== null
  )
}

function hasDuplicateCouncilExperts(item: BatchUpdateThesisItem) {
  const ids = getCouncilExpertIds(item)
  return new Set(ids).size !== ids.length
}

function hasSupervisorConflictWithCouncil(item: BatchUpdateThesisItem) {
  const supervisorIds = [item.supervisorId, item.coSupervisorId]
    .map((id) => normalizeId(id))
    .filter((id): id is string => id !== null)
  if (!supervisorIds.length) return false
  const councilIds = new Set(getCouncilExpertIds(item))
  return supervisorIds.some((id) => councilIds.has(id))
}

function buildCouncilMembers(item: BatchUpdateThesisItem) {
  return [
    { role: CouncilRole.CHAIRMAN, expertId: normalizeId(item.councilChairman) },
    { role: CouncilRole.SECRETARY, expertId: normalizeId(item.councilSecretary) },
    { role: CouncilRole.REVIEWER_1, expertId: normalizeId(item.reviewer1) },
    { role: CouncilRole.REVIEWER_2, expertId: normalizeId(item.reviewer2) },
    { role: CouncilRole.MEMBER, expertId: normalizeId(item.councilMember) },
  ].filter((member): member is { role: CouncilRole; expertId: string } => member.expertId !== null)
}

function parseFinalScore(score: BatchUpdateThesisItem["score"]) {
  if (score === "" || score === null || score === undefined) return null
  const parsed = Number.parseFloat(String(score))
  return Number.isFinite(parsed) ? parsed : null
}

function parseDefenseDate(value: BatchUpdateThesisItem["defenseDate"]) {
  if (value === "" || value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWithinGvhdSupervisorEditWindow(topicEntryDeadline: Date | null | undefined) {
  if (!topicEntryDeadline) return true
  const endOfDay = new Date(topicEntryDeadline)
  endOfDay.setHours(23, 59, 59, 999)
  return Date.now() <= endOfDay.getTime()
}

export async function batchUpdateThesisProjects(
  params: BatchUpdateThesisProjectsParams
): Promise<BatchUpdateThesisProjectsResult> {
  const { thesisSessionId, allowSupervisorEdit = false, items } = params

  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }
  if (!items.length) {
    throw new Error("Vui lòng chọn ít nhất một sinh viên để lưu.")
  }

  const session = await prisma.thesisSession.findFirst({
    where: { id: thesisSessionId, deletedAt: null },
    select: { id: true, topicEntryDeadline: true },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt luận văn.")
  }

  for (const item of items) {
    if (!item.thesisProjectId) {
      throw new Error("Thiếu thông tin đề tài cần cập nhật.")
    }
    if (hasDuplicateCouncilExperts(item)) {
      throw new Error(
        `Các cán bộ hội đồng bảo vệ không được trùng nhau (mã học viên: ${studentLabel(item)}).`
      )
    }
    if (hasSupervisorConflictWithCouncil(item)) {
      throw new Error(
        `Giáo viên hướng dẫn không được trùng với các thành viên hội đồng bảo vệ (mã học viên: ${studentLabel(item)}).`
      )
    }
    if (allowSupervisorEdit) {
      const supervisorId = normalizeId(item.supervisorId)
      const coSupervisorId = normalizeId(item.coSupervisorId)
      if (hasDuplicateThesisSupervisors(supervisorId, coSupervisorId)) {
        throw new Error(
          `GVHD 1 và GVHD 2 không được trùng nhau (mã học viên: ${studentLabel(item)}).`
        )
      }
    }
  }

  const projectIds = items.map((item) => item.thesisProjectId)
  const projects = await prisma.thesisProject.findMany({
    where: {
      id: { in: projectIds },
      deletedAt: null,
      thesisSessionId,
      thesisType: ThesisType.THESIS,
    },
    select: {
      id: true,
      councilId: true,
      supervisorId: true,
      coSupervisorId: true,
      defenseRecord: { select: { id: true } },
    },
  })
  const projectById = new Map(projects.map((project) => [project.id, project]))

  if (projects.length !== new Set(projectIds).size) {
    throw new Error("Một số đề tài không tồn tại trong đợt xét đã chọn.")
  }

  if (allowSupervisorEdit) {
    for (const item of items) {
      const project = projectById.get(item.thesisProjectId)
      if (!project) continue
      const newSupervisorId = normalizeId(item.supervisorId)
      const newCoSupervisorId = normalizeId(item.coSupervisorId)
      const oldSupervisorId = project.supervisorId ?? null
      const oldCoSupervisorId = project.coSupervisorId ?? null
      if (
        (newSupervisorId !== oldSupervisorId || newCoSupervisorId !== oldCoSupervisorId) &&
        !isWithinGvhdSupervisorEditWindow(session.topicEntryDeadline)
      ) {
        throw new Error(
          "Đã quá hạn nhập GVHD. Chỉ được thay đổi giáo viên hướng dẫn khi còn trong hạn (theo ngày hạn nhập đề tài của đợt xét)."
        )
      }
    }
  }

  const updatedCount = await prisma.$transaction(async (tx) => {
    let count = 0

    for (const item of items) {
      const project = projectById.get(item.thesisProjectId)
      if (!project) continue

      let councilId = project.councilId
      if (!councilId) {
        const council = await tx.council.create({
          data: {
            proposedDate: new Date(),
            status: CouncilProposalStatus.PENDING,
          },
        })
        councilId = council.id
      } else {
        await tx.paymentRecord.deleteMany({
          where: { councilMember: { councilId } },
        })
        await tx.invitation.deleteMany({
          where: { councilMember: { councilId } },
        })
        await tx.councilMember.deleteMany({
          where: { councilId },
        })
      }

      const members = buildCouncilMembers(item)
      if (members.length > 0) {
        await tx.councilMember.createMany({
          data: members.map((member) => ({
            councilId: councilId!,
            role: member.role,
            expertId: member.expertId,
          })),
        })
      }

      const finalScore = parseFinalScore(item.score)
      if (project.defenseRecord) {
        await tx.defenseRecord.update({
          where: { thesisId: project.id },
          data: { finalScore },
        })
      } else {
        await tx.defenseRecord.create({
          data: {
            thesisId: project.id,
            finalScore,
            isProfileComplete: false,
          },
        })
      }

      const language = item.language ?? ""
      const type = item.type ?? ""
      const status =
        item.status && THESIS_PROJECT_STATUSES.has(item.status)
          ? (item.status as ThesisProjectStatus)
          : undefined

      await tx.thesisProject.update({
        where: { id: project.id },
        data: {
          title: item.title ?? "",
          description: `Ngôn ngữ: ${language} - Luận án/Đề án: ${type}`,
          ...(status ? { status } : {}),
          type,
          language,
          defenseDate: parseDefenseDate(item.defenseDate),
          researchTopicAssociated: item.researchTopicAssociated || "",
          organizationId: normalizeId(item.organizationId),
          councilId,
          roomId: normalizeId(item.roomId),
          defenseSessionId: normalizeId(item.defenseSessionId),
          ...(allowSupervisorEdit
            ? {
                supervisorId: normalizeId(item.supervisorId),
                coSupervisorId: normalizeId(item.coSupervisorId),
              }
            : {}),
        },
      })

      count += 1
    }

    return count
  })

  return { updatedCount }
}
