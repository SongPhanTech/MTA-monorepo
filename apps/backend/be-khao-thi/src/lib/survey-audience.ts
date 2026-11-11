import type { Prisma, PrismaClient } from "@workspace/db"

export const SURVEY_OBJECT_TYPE_INCLUDE = {
  organizations: { select: { Id: true } },
  trainingFields: { select: { id: true } },
  trainingMajors: { select: { id: true } },
  trainingCourses: { select: { id: true } },
  fixedClasses: { select: { id: true } },
  subjectClasses: { select: { id: true } },
}

/** Include dùng cho báo cáo: lấy đơn vị từ chuyên ngành (hoặc chuyên ngành của lớp QL). */
export const SURVEY_OBJECT_TYPE_REPORT_INCLUDE = {
  ...SURVEY_OBJECT_TYPE_INCLUDE,
  trainingMajors: {
    select: {
      id: true,
      name: true,
      organization: { select: { sTen: true } },
      trainingField: { select: { name: true } },
    },
  },
  fixedClasses: {
    select: {
      id: true,
      curriculumVersion: {
        select: {
          curriculum: {
            select: {
              trainingMajor: {
                select: {
                  id: true,
                  name: true,
                  organization: { select: { sTen: true } },
                  trainingField: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  },
}

type SurveyObjectMajorForOrg = {
  name: string
  organization?: { sTen: string | null } | null
  trainingField?: { name: string } | null
}

/**
 * Map tên chuyên ngành/ngành → đơn vị quản lý từ thiết lập đối tượng KS.
 * - Có chọn chuyên ngành → lấy đơn vị của chuyên ngành đó
 * - Không chọn chuyên ngành → lấy chuyên ngành từ lớp quản lý (lớp niên chế) rồi lấy đơn vị
 */
export function resolveMajorOrgFromSurveyObjectTypes(
  objectTypes: Array<{
    trainingMajors: SurveyObjectMajorForOrg[]
    fixedClasses: Array<{
      curriculumVersion?: {
        curriculum?: {
          trainingMajor?: SurveyObjectMajorForOrg | null
        } | null
      } | null
    }>
  }>
): Map<string, string> {
  const byName = new Map<string, string>()

  const addMajor = (m?: SurveyObjectMajorForOrg | null) => {
    if (!m?.organization?.sTen) return
    byName.set(m.name, m.organization.sTen)
    if (m.trainingField?.name) {
      byName.set(m.trainingField.name, m.organization.sTen)
    }
  }

  for (const ot of objectTypes) {
    if (ot.trainingMajors.length > 0) {
      for (const m of ot.trainingMajors) addMajor(m)
    } else {
      for (const fc of ot.fixedClasses) {
        addMajor(fc.curriculumVersion?.curriculum?.trainingMajor)
      }
    }
  }

  return byName
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

export const STUDENT_TYPES = [
  "MILITARY_STUDENT",
  "CIVILIAN_STUDENT",
  "MILITARY_GRADUATE_STUDENT",
  "CIVILIAN_GRADUATE_STUDENT",
]
export const LECTURER_TYPES = ["LECTURER", "STAFF"]

export type SurveyAudienceScope = "student" | "lecturer" | "all"

/** Bộ lọc thêm từ query của admin (tab "Danh sách người làm khảo sát"). */
export type SurveyAudienceQueryFilters = {
  studentCode?: string
  lecturerCode?: string
  staffCode?: string
  /** UUID đơn vị (tree select) */
  organizationId?: string[]
  /** Mã/tên đơn vị (ô filter text ĐVQL) */
  organizationCode?: string
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

  const organizationCodeFilter: Prisma.UserProfileWhereInput = q.organizationCode
    ? {
        donVi: {
          OR: [
            { sMa: { contains: q.organizationCode, mode: "insensitive" } },
            { sTen: { contains: q.organizationCode, mode: "insensitive" } },
          ],
        },
      }
    : {}

  if (scope !== "student") {
    const organizationIds = q.organizationId?.length
      ? q.organizationId
      : objectType.organizations.map((org) => org.Id)
    const hasOrgIds = organizationIds.length > 0

    const hasLecturerType = objectType.type.includes("LECTURER")
    const hasStaffType = objectType.type.includes("STAFF")

    if (hasLecturerType) {
      clauses.push({
        ...(hasOrgIds ? { sDM_DonViId: { in: organizationIds } } : {}),
        ...organizationCodeFilter,
        lecturer: { isNot: null },
        ...(q.lecturerCode ? { code: { contains: q.lecturerCode, mode: "insensitive" } } : {}),
      })
    }
    if (hasStaffType) {
      const staffWhere: Prisma.StaffWhereInput = {
        ...(hasOrgIds ? { organizationId: { in: organizationIds } } : {}),
        ...(q.organizationCode
          ? {
              organization: {
                OR: [
                  { sMa: { contains: q.organizationCode, mode: "insensitive" } },
                  { sTen: { contains: q.organizationCode, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      }
      clauses.push({
        staffs: Object.keys(staffWhere).length > 0 ? { is: staffWhere } : { isNot: null },
        ...(q.staffCode ? { code: { contains: q.staffCode, mode: "insensitive" } } : {}),
      })
    }
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
      ...(q.studentCode ? { code: { contains: q.studentCode, mode: "insensitive" } } : {}),
      ...organizationCodeFilter,
      educationAndTraining: {
        some: {
          // Chỉ ràng buộc quan hệ khi thật sự có điều kiện lọc: `fixedClass: {}` bị Prisma
          // dịch thành EXISTS(...) nên sẽ loại hết HV chưa được gán lớp quản lý.
          ...(Object.keys(fixedClassFilter).length ? { fixedClass: fixedClassFilter } : {}),
          ...(objectType.subjectClasses.length
            ? {
                subjectClassStudent: {
                  some: {
                    deletedAt: null,
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

export const USER_PROFILE_AUDIENCE_INCLUDE = {
  lecturer: true,
  staffs: true,
  educationAndTraining: {
    where: { deletedAt: null },
    include: {
      fixedClass: {
        include: {
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: true,
                },
              },
            },
          },
        },
      },
      subjectClassStudent: {
        select: { subjectClassId: true },
        where: { subjectClassId: { not: null }, deletedAt: null },
      },
    },
  },
} as const

export type UserProfileAudienceData = Prisma.UserProfileGetPayload<{
  include: typeof USER_PROFILE_AUDIENCE_INCLUDE
}>

/**
 * Nguồn duy nhất dựng mệnh đề where của Survey để tìm các khảo sát dành cho một profile.
 * Dùng chung cho:
 * 1. Trang danh sách khảo sát của người dùng (`getSurveysByProfile` trong survey.ts)
 * 2. Kiểm tra quyền truy cập / làm bài (`isProfileInSurveyAudience`)
 */
export function buildSurveyAudienceWhereForProfile(profile: UserProfileAudienceData): {
  audienceMatch: Prisma.SurveyWhereInput
  enrollmentFilter: Prisma.SurveyWhereInput
} {
  const audienceMatch: Prisma.SurveyWhereInput = { OR: [] }

  // 1. Khảo sát chung không gắn lớp học phần và không có cấu hình đối tượng riêng/chùm -> mở cho tất cả người dùng đăng nhập
  audienceMatch.OR?.push({
    subjectClassId: null,
    surveyObjectType: { none: {} },
    OR: [{ clusterSurveyId: null }, { clusterSurvey: { surveyObjectType: { none: {} } } }],
  })

  // 2. Khảo sát theo lớp môn học không có cấu hình đối tượng riêng chỉ dành cho
  // sinh viên đã ghi danh đúng lớp học phần đó.
  const enrolledSubjectClassIds = [
    ...new Set(
      profile.educationAndTraining.flatMap((et) =>
        et.subjectClassStudent
          .map((enrollment) => enrollment.subjectClassId)
          .filter((subjectClassId): subjectClassId is string => Boolean(subjectClassId))
      )
    ),
  ]
  if (enrolledSubjectClassIds.length > 0) {
    audienceMatch.OR?.push({
      subjectClassId: { in: enrolledSubjectClassIds },
      surveyObjectType: { none: {} },
      OR: [{ clusterSurveyId: null }, { clusterSurvey: { surveyObjectType: { none: {} } } }],
    })
  }

  // 3. Khảo sát theo tiêu chí sinh viên (theo từng bản ghi educationAndTraining)
  const studentWhereClauses: Prisma.SurveyWhereInput[] = profile.educationAndTraining.map((et) => {
    const studentCriteria: Prisma.SurveyObjectTypeWhereInput[] = [
      { type: { hasSome: STUDENT_TYPES } },
    ]

    if (et.fixedClassId) {
      studentCriteria.push({
        OR: [{ fixedClasses: { none: {} } }, { fixedClasses: { some: { id: et.fixedClassId } } }],
      })
    } else {
      studentCriteria.push({ fixedClasses: { none: {} } })
    }

    if (et.fixedClass?.trainingCourseId) {
      studentCriteria.push({
        OR: [
          { trainingCourses: { none: {} } },
          { trainingCourses: { some: { id: et.fixedClass.trainingCourseId } } },
        ],
      })
    } else {
      studentCriteria.push({ trainingCourses: { none: {} } })
    }

    const majorId = et.fixedClass?.curriculumVersion?.curriculum?.trainingMajorId
    const fieldId = et.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingFieldId

    const subjectClassIds = et.subjectClassStudent
      ?.map((scs) => scs.subjectClassId)
      .filter(Boolean) as string[]
    if (subjectClassIds?.length) {
      studentCriteria.push({
        OR: [
          { subjectClasses: { none: {} } },
          { subjectClasses: { some: { id: { in: subjectClassIds } } } },
        ],
      })
    } else {
      studentCriteria.push({ subjectClasses: { none: {} } })
    }

    // Tiêu chí ngành/lĩnh vực: đồng bộ với buildStudentMajorFieldFixedClassFilter
    // - Đã chọn lớp QL -> bỏ qua tiêu chí ngành/lĩnh vực
    // - Không cấu hình ngành/lĩnh vực -> nhận tất cả
    // - Có cấu hình ngành/lĩnh vực:
    //   + HV có ngành/lĩnh vực -> khớp theo ngành/lĩnh vực
    //   + HV chưa gắn ngành trong CTĐT -> vẫn nhận nếu có phạm vi khóa/lớp HP
    const majorFieldMatchOr: Prisma.SurveyObjectTypeWhereInput[] = []

    if (et.fixedClassId) {
      majorFieldMatchOr.push({
        fixedClasses: { some: { id: et.fixedClassId } },
      })
    }

    majorFieldMatchOr.push({
      trainingMajors: { none: {} },
      trainingFields: { none: {} },
    })

    if (majorId || fieldId) {
      const matchConditions: Prisma.SurveyObjectTypeWhereInput[] = []
      if (majorId) {
        matchConditions.push({
          OR: [{ trainingMajors: { none: {} } }, { trainingMajors: { some: { id: majorId } } }],
        })
      } else {
        matchConditions.push({ trainingMajors: { none: {} } })
      }

      if (fieldId) {
        matchConditions.push({
          OR: [{ trainingFields: { none: {} } }, { trainingFields: { some: { id: fieldId } } }],
        })
      } else {
        matchConditions.push({ trainingFields: { none: {} } })
      }

      majorFieldMatchOr.push({ AND: matchConditions })
    }

    if (!majorId) {
      const otherScopeConditions: Prisma.SurveyObjectTypeWhereInput[] = []
      if (et.fixedClass?.trainingCourseId) {
        otherScopeConditions.push({
          trainingCourses: { some: { id: et.fixedClass.trainingCourseId } },
        })
      }
      if (subjectClassIds?.length) {
        otherScopeConditions.push({
          subjectClasses: { some: { id: { in: subjectClassIds } } },
        })
      }
      if (otherScopeConditions.length > 0) {
        majorFieldMatchOr.push({ OR: otherScopeConditions })
      }
    }

    studentCriteria.push({ OR: majorFieldMatchOr })

    return {
      OR: [
        { surveyObjectType: { some: { AND: studentCriteria } } },
        {
          surveyObjectType: { none: {} },
          clusterSurvey: { surveyObjectType: { some: { AND: studentCriteria } } },
        },
      ],
    }
  })

  if (studentWhereClauses.length > 0) {
    audienceMatch.OR?.push(...studentWhereClauses)
  }

  // 4. Khảo sát theo tiêu chí Giảng viên
  if (profile.lecturer) {
    const lecturerCriteria: Prisma.SurveyObjectTypeWhereInput[] = [{ type: { has: "LECTURER" } }]
    if (profile.sDM_DonViId) {
      lecturerCriteria.push({
        OR: [
          { organizations: { none: {} } },
          { organizations: { some: { Id: profile.sDM_DonViId } } },
        ],
      })
    } else {
      lecturerCriteria.push({ organizations: { none: {} } })
    }

    audienceMatch.OR?.push(
      { surveyObjectType: { some: { AND: lecturerCriteria } } },
      {
        surveyObjectType: { none: {} },
        clusterSurvey: { surveyObjectType: { some: { AND: lecturerCriteria } } },
      }
    )
  }

  // 5. Khảo sát theo tiêu chí Cán bộ / Nhân viên
  if (profile.staffs) {
    const staffCriteria: Prisma.SurveyObjectTypeWhereInput[] = [{ type: { has: "STAFF" } }]
    if (profile.staffs.organizationId) {
      staffCriteria.push({
        OR: [
          { organizations: { none: {} } },
          { organizations: { some: { Id: profile.staffs.organizationId } } },
        ],
      })
    } else {
      staffCriteria.push({ organizations: { none: {} } })
    }

    audienceMatch.OR?.push(
      { surveyObjectType: { some: { AND: staffCriteria } } },
      {
        surveyObjectType: { none: {} },
        clusterSurvey: { surveyObjectType: { some: { AND: staffCriteria } } },
      }
    )
  }

  // 6. Điều kiện ghi danh lớp môn học (khi khảo sát chỉ định targetEnrollStudentOnly)
  const enrollmentFilter: Prisma.SurveyWhereInput = {
    OR: [
      { subjectClassId: null },
      { targetEnrollStudentOnly: false },
      {
        subjectClass: {
          subjectClassStudent: {
            some: {
              deletedAt: null,
              student: {
                deletedAt: null,
                userProfile: { id: profile.id },
              },
            },
          },
        },
      },
    ],
  }

  return { audienceMatch, enrollmentFilter }
}

export async function isProfileInSurveyAudience(
  prisma: PrismaClient,
  profileId: string,
  surveyId: string
): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: profileId },
    include: USER_PROFILE_AUDIENCE_INCLUDE,
  })

  if (!profile || profile.deletedAt || !profile.active) {
    return false
  }

  const { audienceMatch, enrollmentFilter } = buildSurveyAudienceWhereForProfile(profile)

  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      deletedAt: null,
      AND: [audienceMatch, enrollmentFilter],
    },
    select: { id: true },
  })

  return Boolean(survey)
}

export type ResolvedSurveyUser = {
  profileId: string
  studentId?: string
}

export async function resolveSurveyUserByCode(
  prisma: PrismaClient,
  code: string
): Promise<ResolvedSurveyUser | null> {
  const student = await prisma.student.findFirst({
    where: { userProfile: { code }, deletedAt: null },
    select: { id: true, userProfileId: true },
  })
  if (student) {
    return { profileId: student.userProfileId, studentId: student.id }
  }

  const lecturer = await prisma.lecturer.findFirst({
    where: { userProfile: { code }, deletedAt: null },
    select: { userProfileId: true },
  })
  if (lecturer) {
    return { profileId: lecturer.userProfileId }
  }

  const staff = await prisma.staff.findFirst({
    where: { userProfile: { code }, deletedAt: null },
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
