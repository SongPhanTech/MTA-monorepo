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

const STUDENT_TYPES = [
  "MILITARY_STUDENT",
  "CIVILIAN_STUDENT",
  "MILITARY_GRADUATE_STUDENT",
  "CIVILIAN_GRADUATE_STUDENT",
]
const LECTURER_TYPES = ["LECTURER", "STAFF"]

export type SurveyAudienceScope = "student" | "lecturer" | "all"

/** Bộ lọc thêm từ query của admin (tab "Danh sách người làm khảo sát"). */
export type SurveyAudienceQueryFilters = {
  studentCode?: string
  lecturerCode?: string
  staffCode?: string
  organizationId?: string[]
  fixedClassIds?: string[]
  trainingCourseIds?: string[]
  isStudent?: SurveyAudienceScope
}

function getObjectTypeIsStudentFilter(
  objectType: SurveyObjectTypeWithRelations
): SurveyAudienceScope {
  const hasStudent = objectType.type.some((t) => STUDENT_TYPES.includes(t))
  const hasLecturer = objectType.type.some((t) => LECTURER_TYPES.includes(t))
  if (hasLecturer && !hasStudent) return "lecturer"
  if (hasStudent && !hasLecturer) return "student"
  return "all"
}

/**
 * Giao phạm vi đối tượng thật của đợt KS với bộ lọc hiển thị trên UI.
 * `null` = hai bên không giao nhau -> không khớp ai.
 */
function intersectScope(
  objectTypeScope: SurveyAudienceScope,
  queryScope: SurveyAudienceScope | undefined
): SurveyAudienceScope | null {
  if (!queryScope || queryScope === "all") return objectTypeScope
  if (objectTypeScope === "all") return queryScope
  return objectTypeScope === queryScope ? objectTypeScope : null
}

/**
 * Filter ngành/lĩnh vực trên FixedClass.
 * - Đã chọn lớp QL → bỏ qua (lớp là scope cụ thể; nhiều CTĐT thiếu trainingMajorId).
 * - Có khóa/lớp HP mà CTĐT chưa gắn ngành → vẫn nhận (OR trainingMajorId null).
 */
export function buildStudentMajorFieldFixedClassFilter(
  objectType: SurveyObjectTypeWithRelations,
  q: Pick<SurveyAudienceQueryFilters, "fixedClassIds" | "trainingCourseIds"> = {}
): Prisma.FixedClassWhereInput {
  const hasFixedClassScope =
    objectType.fixedClasses.length > 0 || (q.fixedClassIds?.length ?? 0) > 0
  const hasMajorFieldConfig =
    objectType.trainingMajors.length > 0 || objectType.trainingFields.length > 0

  if (!hasMajorFieldConfig || hasFixedClassScope) {
    return {}
  }

  const matchingMajor: Prisma.TrainingMajorWhereInput = {
    ...(objectType.trainingMajors.length
      ? { id: { in: objectType.trainingMajors.map((tm) => tm.id) } }
      : {}),
    ...(objectType.trainingFields.length
      ? { trainingFieldId: { in: objectType.trainingFields.map((tf) => tf.id) } }
      : {}),
  }

  const hasOtherStudentScope =
    objectType.trainingCourses.length > 0 ||
    (q.trainingCourseIds?.length ?? 0) > 0 ||
    objectType.subjectClasses.length > 0

  return {
    curriculumVersion: {
      curriculum: {
        OR: [
          { trainingMajor: matchingMajor },
          ...(hasOtherStudentScope ? [{ trainingMajorId: null }] : []),
        ],
      },
    },
  }
}

/**
 * Nguồn duy nhất dựng điều kiện "profile này thuộc đối tượng khảo sát".
 * Dùng chung cho tab danh sách của admin (survey.ts) và luồng nhập mã công khai (survey-public.ts).
 * Mảng rỗng nghĩa là không khớp ai — nơi gọi phải xử lý đúng, không được coi là không lọc.
 */
export function buildSurveyObjectTypeProfileOrClauses(
  objectType: SurveyObjectTypeWithRelations,
  q: SurveyAudienceQueryFilters = {}
): Prisma.UserProfileWhereInput[] {
  const scope = intersectScope(getObjectTypeIsStudentFilter(objectType), q.isStudent)
  if (scope === null) return []

  const clauses: Prisma.UserProfileWhereInput[] = []

  if (scope !== "student") {
    const organizationIds = q.organizationId?.length
      ? q.organizationId
      : objectType.organizations.map((org) => org.Id)

    clauses.push({
      lecturer: {
        ...(q.lecturerCode ? { code: { contains: q.lecturerCode, mode: "insensitive" } } : {}),
        organizationId: { in: organizationIds },
      },
    })
    clauses.push({
      staffs: {
        ...(q.staffCode ? { code: { contains: q.staffCode, mode: "insensitive" } } : {}),
        organizationId: { in: organizationIds },
      },
    })
  }

  if (scope !== "lecturer") {
    const fixedClassFilter: Prisma.FixedClassWhereInput = {
      ...(objectType.fixedClasses.length
        ? { id: { in: objectType.fixedClasses.map((fc) => fc.id) } }
        : {}),
      ...(q.fixedClassIds?.length ? { id: { in: q.fixedClassIds } } : {}),
      ...(objectType.trainingCourses.length
        ? { trainingCourseId: { in: objectType.trainingCourses.map((tc) => tc.id) } }
        : {}),
      ...(q.trainingCourseIds?.length ? { trainingCourseId: { in: q.trainingCourseIds } } : {}),
      ...buildStudentMajorFieldFixedClassFilter(objectType, q),
    }

    clauses.push({
      educationAndTraining: {
        some: {
          ...(q.studentCode ? { code: { contains: q.studentCode, mode: "insensitive" } } : {}),
          // Chỉ ràng buộc quan hệ khi thật sự có điều kiện lọc: `fixedClass: {}` bị Prisma
          // dịch thành EXISTS(...) nên sẽ loại hết HV chưa được gán lớp quản lý.
          ...(Object.keys(fixedClassFilter).length ? { fixedClass: fixedClassFilter } : {}),
          ...(objectType.subjectClasses.length
            ? {
                subjectClassStudent: {
                  some: {
                    subjectClassId: { in: objectType.subjectClasses.map((sc) => sc.id) },
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
    const orClauses = buildSurveyObjectTypeProfileOrClauses(objectType)
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
