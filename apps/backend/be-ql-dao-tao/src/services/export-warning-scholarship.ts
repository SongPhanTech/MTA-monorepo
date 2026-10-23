import { prisma } from ".."

type JoinRow = { A: string; B: string }

const notDeleted = { deletedAt: null } as const

async function queryJoinTable(table: string): Promise<JoinRow[]> {
  try {
    return await prisma.$queryRawUnsafe<JoinRow[]>(`SELECT "A", "B" FROM "ql-dao-tao"."${table}"`)
  } catch {
    return []
  }
}

export type WarningScholarshipExport = {
  AcademicWarningRule: unknown[]
  AcademicWarning: unknown[]
  _AcademicWarningToAcademicWarningRule: JoinRow[]
  DisciplinaryWarningReason: unknown[]
  DisciplinaryWarning: unknown[]
  _DisciplinaryWarningToDisciplinaryWarningReason: JoinRow[]
  Scholarship: unknown[]
  ScholarshipCriteria: unknown[]
  ScholarshipAward: unknown[]
}

/**
 * Tải cảnh báo học tập / học đường / học bổng để đóng gói export Nội bộ → Internet.
 * - full: toàn bộ bản ghi chưa xóa
 * - theo đợt: lọc theo khóa + sinh viên của đợt
 */
export async function loadWarningAndScholarshipData(params: {
  studentIds: string[]
  trainingCourseIds: string[]
  scoped: boolean
}): Promise<WarningScholarshipExport> {
  const { studentIds, trainingCourseIds, scoped } = params

  const emptyIfScopedNoStudents = scoped && studentIds.length === 0
  const emptyIfScopedNoCourses = scoped && trainingCourseIds.length === 0

  const [
    academicWarningRules,
    disciplinaryWarningReasons,
    scholarships,
    academicWarnings,
    disciplinaryWarnings,
    scholarshipAwards,
    academicWarningRuleJoins,
    disciplinaryWarningReasonJoins,
  ] = await Promise.all([
    emptyIfScopedNoCourses
      ? Promise.resolve([])
      : prisma.academicWarningRule.findMany({
          where: {
            ...notDeleted,
            ...(scoped ? { trainingCourseId: { in: trainingCourseIds } } : {}),
          },
        }),
    prisma.disciplinaryWarningReason.findMany({ where: notDeleted }),
    emptyIfScopedNoCourses
      ? Promise.resolve([])
      : prisma.scholarship.findMany({
          where: {
            ...notDeleted,
            ...(scoped ? { trainingCourseId: { in: trainingCourseIds } } : {}),
          },
        }),
    emptyIfScopedNoStudents
      ? Promise.resolve([])
      : prisma.academicWarning.findMany({
          where: {
            ...notDeleted,
            ...(scoped ? { studentId: { in: studentIds } } : {}),
          },
        }),
    emptyIfScopedNoStudents
      ? Promise.resolve([])
      : prisma.disciplinaryWarning.findMany({
          where: {
            ...notDeleted,
            ...(scoped ? { studentId: { in: studentIds } } : {}),
          },
        }),
    emptyIfScopedNoStudents
      ? Promise.resolve([])
      : prisma.scholarshipAward.findMany({
          where: {
            ...notDeleted,
            ...(scoped ? { studentId: { in: studentIds } } : {}),
          },
        }),
    queryJoinTable("_AcademicWarningToAcademicWarningRule"),
    queryJoinTable("_DisciplinaryWarningToDisciplinaryWarningReason"),
  ])

  const scholarshipIds = scholarships.map((s) => s.id)
  const scholarshipCriteria =
    scholarshipIds.length === 0
      ? []
      : await prisma.scholarshipCriteria.findMany({
          where: { scholarshipId: { in: scholarshipIds }, deletedAt: null },
        })

  const academicWarningIds = new Set(academicWarnings.map((w) => w.id))
  const academicRuleIds = new Set(academicWarningRules.map((r) => r.id))
  const disciplinaryWarningIds = new Set(disciplinaryWarnings.map((w) => w.id))
  const disciplinaryReasonIds = new Set(disciplinaryWarningReasons.map((r) => r.id))

  return {
    AcademicWarningRule: academicWarningRules,
    AcademicWarning: academicWarnings,
    _AcademicWarningToAcademicWarningRule: academicWarningRuleJoins.filter(
      (r) => academicWarningIds.has(r.A) && academicRuleIds.has(r.B)
    ),
    DisciplinaryWarningReason: disciplinaryWarningReasons,
    DisciplinaryWarning: disciplinaryWarnings,
    _DisciplinaryWarningToDisciplinaryWarningReason: disciplinaryWarningReasonJoins.filter(
      (r) => disciplinaryWarningIds.has(r.A) && disciplinaryReasonIds.has(r.B)
    ),
    Scholarship: scholarships,
    ScholarshipCriteria: scholarshipCriteria,
    ScholarshipAward: scholarshipAwards,
  }
}
