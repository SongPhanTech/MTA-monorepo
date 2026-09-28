import { ThesisType } from "@workspace/db/client"
import { prisma } from ".."
import type { ThesisExportFilter } from "../dto/thesis-export.dto"
import { expertVersionInclude } from "./expert-version"

const expertVersionSelect = {
  id: true,
  expertId: true,
  name: true,
  workplace: true,
  organization: true,
  position: true,
  inAcademy: true,
  bankAccountNumber: true,
  bankName: true,
  academicRankType: { select: { sMa: true } },
  academicDegreeType: { select: { sMa: true } },
  expert: {
    select: {
      id: true,
      lecturerId: true,
      lecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true,
              bankAccountNumber: true,
              bankName: true,
              academicRankType: { select: { sMa: true } },
              academicDegreeType: { select: { sMa: true } },
              rank: { select: { sMa: true, sTen: true } },
              position: { select: { sTen: true } },
              donVi: {
                select: { Id: true, sMa: true, sTen: true, sParentId: true, iCapDonVi: true, iLoaiDonVi: true },
              },
            },
          },
        },
      },
    },
  },
} as const

/** Select đủ field cho các mẫu in luận văn (tương đương thesisProjectExportSelect phía FE). */
export const thesisProjectExportSelect = {
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
  description: true,
  firstCheckProgress: true,
  secondCheckProgress: true,
  CHUTICH: true,
  THUKY: true,
  PHANBIEN1: true,
  PHANBIEN2: true,
  UYVIEN3: true,
  supervisorName: true,
  coSupervisorName: true,
  organizationId: true,
  organization: { select: { Id: true, sMa: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true } },
  thesisSession: {
    select: {
      id: true,
      name: true,
      proposalReport: true,
      councilReport: true,
      decisionNumber: true,
      decisionMaker: true,
      decisionDate: true,
      defenseDecisionDate: true,
      defenseDecisionNumber: true,
      defenseDecisionMaker: true,
      chief: true,
      deputy: true,
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
          academicYear: true,
          regulation: true,
          trainingObjectType: { select: { id: true, name: true, type: true } },
        },
      },
    },
  },
  defenseSession: { select: { id: true, startTime: true } },
  defenseRecord: { select: { finalScore: true } },
  room: { select: { id: true, name: true } },
  supervisor: { select: expertVersionSelect },
  coSupervisor: { select: expertVersionSelect },
  thirdSupervisor: { select: expertVersionSelect },
  supervisorPaymentId: true,
  coSupervisorPaymentId: true,
  singleSupervisorPaymentId: true,
  supervisorPayment: { select: { amount: true } },
  coSupervisorPayment: { select: { amount: true } },
  singleSupervisorPayment: { select: { amount: true } },
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
          expert: {
            select: {
              id: true,
              currentVersion: { select: expertVersionSelect },
            },
          },
        },
      },
    },
  },
  registrations: {
    where: { deletedAt: null },
    take: 1,
    select: {
      deletedAt: true,
      studentId: true,
      student: {
        select: {
          id: true,
          userProfile: {
            select: {
              code: true,
              fullname: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              phoneNumber: true,
            },
          },
          curriculumVersion: {
            select: {
              curriculum: {
                select: {
                  managementOrganization: {
                    select: { Id: true, sMa: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true },
                  },
                  trainingField: { select: { name: true } },
                  trainingMajor: {
                    select: {
                      name: true,
                      organization: { select: { Id: true, sMa: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true } },
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
                  academicYear: true,
                  regulation: true,
                  trainingObjectType: { select: { id: true, name: true, type: true } },
                },
              },
              curriculumVersion: {
                select: {
                  curriculum: {
                    select: {
                      managementOrganization: {
                        select: { Id: true, sMa: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true },
                      },
                      trainingField: { select: { name: true } },
                      trainingMajor: {
                        select: {
                          name: true,
                          organization: { select: { Id: true, sMa: true, sTen: true, sParentId: true, iLoaiDonVi: true, iCapDonVi: true } },
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

export type ThesisExportStudentRow = {
  id: string
  code?: string | null
  userProfile?: Record<string, unknown> | null
  fixedClass?: Record<string, unknown> | null
  curriculumVersion?: Record<string, unknown> | null
  thesisRegistrations: Array<{
    deletedAt?: Date | string | null
    thesisProject: Record<string, unknown>
  }>
}

async function resolveFixedClassIds(filters: ThesisExportFilter): Promise<string[]> {
  if (filters.fixedClassIds?.length) return filters.fixedClassIds
  if (!filters.trainingCourseIds?.length) return []
  const classes = await prisma.fixedClass.findMany({
    where: { trainingCourseId: { in: filters.trainingCourseIds } },
    select: { id: true },
  })
  return classes.map((c) => c.id)
}

export function mapThesisProjectsToStudentRows(
  projects: Array<{
    registrations?: Array<{
      deletedAt?: Date | string | null
      student?: Record<string, unknown> | null
    }> | null
    [key: string]: unknown
  }>
): ThesisExportStudentRow[] {
  return projects
    .map((project) => {
      const registration = project.registrations?.[0]
      const student = registration?.student as ThesisExportStudentRow | undefined
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
      } as ThesisExportStudentRow
    })
    .filter((row): row is ThesisExportStudentRow => row != null)
}

export async function findThesisProjectsForExport(filters: ThesisExportFilter) {
  const fixedClassIds = await resolveFixedClassIds(filters)
  if (!fixedClassIds.length && (filters.fixedClassIds || filters.trainingCourseIds)) {
    return []
  }

  const andConditions: Record<string, unknown>[] = [
    { deletedAt: null },
    { thesisSessionId: filters.thesisSessionId },
    { thesisType: ThesisType.THESIS },
  ]

  if (fixedClassIds.length) {
    andConditions.push({
      registrations: {
        some: {
          deletedAt: null,
          student: { fixedClassId: { in: fixedClassIds } },
        },
      },
    })
  } else {
    andConditions.push({
      registrations: { some: { deletedAt: null } },
    })
  }

  if (filters.organizationIds?.length) {
    andConditions.push({ organizationId: { in: filters.organizationIds } })
  } else if (filters.organizationId) {
    andConditions.push({ organizationId: filters.organizationId })
  }

  return prisma.thesisProject.findMany({
    where: { AND: andConditions },
    select: thesisProjectExportSelect,
    orderBy: { id: "asc" },
  })
}

export async function findThesisExportStudentRows(
  filters: ThesisExportFilter
): Promise<ThesisExportStudentRow[]> {
  const projects = await findThesisProjectsForExport(filters)
  return mapThesisProjectsToStudentRows(projects as any[])
}

export async function findThesisExportStudentIds(filters: ThesisExportFilter): Promise<string[]> {
  const rows = await findThesisExportStudentRows(filters)
  return rows.map((r) => r.id).filter(Boolean)
}

/** Soft include for payment sync paths that need expertVersionInclude-shaped graphs. */
export { expertVersionInclude }
