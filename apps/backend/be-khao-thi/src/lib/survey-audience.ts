import type { Prisma, PrismaClient } from "@workspace/db"
import { prisma } from ".."

export const SURVEY_OBJECT_TYPE_INCLUDE = {
  organizations: { select: { Id: true } },
  trainingFields: { select: { id: true } },
  trainingMajors: { select: { id: true } },
  trainingCourses: { select: { id: true } },
  fixedClasses: { select: { id: true } },
  subjectClasses: { select: { id: true } },
}

type SurveyObjectTypeWithRelations = {
  type: string[]
  organizations: { Id: string }[]
  trainingFields: { id: string }[]
  trainingMajors: { id: string }[]
  trainingCourses: { id: string }[]
  fixedClasses: { id: string }[]
  subjectClasses: { id: string }[]
}

const STUDENT_TYPES = ["MILITARY_STUDENT", "CIVILIAN_STUDENT"]
const LECTURER_TYPES = ["LECTURER", "STAFF"]

function getObjectTypeIsStudentFilter(
  objectType: SurveyObjectTypeWithRelations
): "student" | "lecturer" | "all" {
  const hasStudent = objectType.type.some((t) => STUDENT_TYPES.includes(t))
  const hasLecturer = objectType.type.some((t) => LECTURER_TYPES.includes(t))
  if (hasLecturer && !hasStudent) return "lecturer"
  if (hasStudent && !hasLecturer) return "student"
  return "all"
}

/** Cùng logic với getSurveyObjects trong survey.ts */
export function buildSurveyObjectTypeProfileOrClauses(
  objectType: SurveyObjectTypeWithRelations,
  isStudent: "student" | "lecturer" | "all" = "all"
): Prisma.UserProfileWhereInput[] {
  const clauses: Prisma.UserProfileWhereInput[] = []

  if (isStudent !== "student") {
    clauses.push({
      lecturer: {
        organizationId: {
          in: objectType.organizations.map((org) => org.Id),
        },
      },
    })
    clauses.push({
      staffs: {
        organizationId: {
          in: objectType.organizations.map((org) => org.Id),
        },
      },
    })
  }

  if (isStudent !== "lecturer") {
    clauses.push({
      educationAndTraining: {
        some: {
          fixedClass: {
            ...(objectType.fixedClasses.length
              ? {
                  id: {
                    in: objectType.fixedClasses.map((fc) => fc.id),
                  },
                }
              : {}),
            ...(objectType.trainingCourses.length
              ? {
                  trainingCourseId: {
                    in: objectType.trainingCourses.map((tc) => tc.id),
                  },
                }
              : {}),
            ...(objectType.trainingMajors.length || objectType.trainingFields.length
              ? {
                  curriculumVersion: {
                    curriculum: {
                      trainingMajor: {
                        ...(objectType.trainingMajors.length
                          ? {
                              id: {
                                in: objectType.trainingMajors.map((tm) => tm.id),
                              },
                            }
                          : {}),
                        ...(objectType.trainingFields.length
                          ? {
                              trainingFieldId: {
                                in: objectType.trainingFields.map((tf) => tf.id),
                              },
                            }
                          : {}),
                      },
                    },
                  },
                }
              : {}),
          },
          ...(objectType.subjectClasses.length
            ? {
                subjectClassStudent: {
                  some: {
                    subjectClassId: {
                      in: objectType.subjectClasses.map((sc) => sc.id),
                    },
                  },
                },
              }
            : {}),
        },
      },
    })
  }

  return clauses
}

export async function isProfileInSurveyAudience(
  prisma: PrismaClient,
  profileId: string,
  surveyId: string
): Promise<boolean> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      surveyObjectType: {
        include: SURVEY_OBJECT_TYPE_INCLUDE,
      },
    },
  })

  if (!survey) return false
  if (survey.surveyObjectType.length === 0) return true

  for (const objectType of survey.surveyObjectType) {
    const isStudent = getObjectTypeIsStudentFilter(objectType)
    const orClauses = buildSurveyObjectTypeProfileOrClauses(objectType, isStudent)
    if (orClauses.length === 0) continue

    const profile = await prisma.userProfile.findFirst({
      select: { id: true },
      where: {
        id: profileId,
        deletedAt: null,
        active: true,
        OR: orClauses,
      },
    })
    if (profile) return true
  }

  return false
}

export type ResolvedSurveyUser = {
  profileId: string
  studentId?: string
}

export async function resolveSurveyUserByCode(code: string): Promise<ResolvedSurveyUser | null> {
  const student = await prisma.student.findFirst({
    where: { code, deletedAt: null },
    select: { id: true, userProfileId: true },
  })
  if (student) {
    return { profileId: student.userProfileId, studentId: student.id }
  }

  const lecturer = await prisma.lecturer.findFirst({
    where: { code, deletedAt: null },
    select: { userProfileId: true },
  })
  if (lecturer) {
    return { profileId: lecturer.userProfileId }
  }

  const staff = await prisma.staff.findFirst({
    where: { code, deletedAt: null },
    select: { userProfileId: true },
  })
  if (staff) {
    return { profileId: staff.userProfileId }
  }

  return null
}

export async function findExistingSurveySession(
  prisma: PrismaClient,
  surveyId: string,
  user: ResolvedSurveyUser
) {
  return prisma.surveySession.findFirst({
    where: {
      surveyId,
      OR: [
        { profileId: user.profileId },
        ...(user.studentId ? [{ studentId: user.studentId }] : []),
      ],
    },
  })
}

export async function findPendingSurveysUnderCluster(
  prisma: PrismaClient,
  clusterSurveyId: string,
  user: ResolvedSurveyUser
) {
  const surveys = await prisma.survey.findMany({
    where: { clusterSurveyId, deletedAt: null, active: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })

  const pendingSurveyIds: string[] = []
  for (const survey of surveys) {
    const inAudience = await isProfileInSurveyAudience(prisma, user.profileId, survey.id)
    if (!inAudience) continue

    const existingSession = await findExistingSurveySession(prisma, survey.id, user)
    if (!existingSession) {
      pendingSurveyIds.push(survey.id)
    }
  }

  return pendingSurveyIds
}

export async function resolveSurveyIdFromSurveyOrCluster(
  prisma: PrismaClient,
  id: string,
  user?: ResolvedSurveyUser
) {
  const survey = await prisma.survey.findFirst({
    where: { id, deletedAt: null, active: true },
    select: { id: true },
  })
  if (survey) return survey.id

  const cluster = await prisma.clusterSurvey.findFirst({
    where: { id, deletedAt: null, active: true },
    select: { id: true },
  })
  if (!cluster) return null

  if (!user) return null

  const pendingSurveyIds = await findPendingSurveysUnderCluster(prisma, cluster.id, user)
  return pendingSurveyIds[0] ?? null
}
