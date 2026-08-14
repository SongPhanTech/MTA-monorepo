import type { Prisma } from "@workspace/db"
import { Prisma as PrismaNamespace } from "@workspace/db"
import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"

/** Bump khi thay đổi cấu trúc gói JSON — portal phải hỗ trợ version này */
export const EXPORT_TRAINING_DATA_VERSION = "1.3.3"

export type ExportTrainingDataParams = {
  classRegisterSessionId: string
}

type JoinRow = {
  A: string
  B: string
}

function uniqueIds(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))]
}

function serializeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serializeForJson)
  if (typeof value === "object") {
    const maybeDecimal = value as { toJSON?: () => unknown }
    if (typeof maybeDecimal.toJSON === "function") {
      return maybeDecimal.toJSON()
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeForJson(nested)])
    )
  }
  return value
}

async function queryFixedClassToSubjectClass(subjectClassIds: string[]) {
  if (subjectClassIds.length === 0) return []

  return prisma.$queryRaw<JoinRow[]>`
    SELECT "A", "B"
    FROM "ql-dao-tao"."_FixedClassToSubjectClass"
    WHERE "B" IN (${PrismaNamespace.join(subjectClassIds)})
  `
}

async function querySessionToTrainingCourse(sessionId: string) {
  return prisma.$queryRaw<JoinRow[]>`
    SELECT "A", "B"
    FROM "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"
    WHERE "A" = ${sessionId}
  `
}

async function querySubjectVersionJoins(
  table: "_PrerequisiteSubject" | "_CoRequisiteSubject",
  subjectVersionIds: string[]
) {
  if (subjectVersionIds.length === 0) return [] as JoinRow[]
  return prisma.$queryRawUnsafe<JoinRow[]>(
    `SELECT "A", "B" FROM "ql-dao-tao"."${table}" WHERE "A" = ANY($1::text[]) OR "B" = ANY($1::text[])`,
    subjectVersionIds
  )
}

async function loadStudents(params: {
  fixedClassIds: string[]
  trainingCourseIds: string[]
  fixedClasses: {
    classMonitorId: string | null
    unionLeaderId: string | null
    deputyUnionSecretaryId: string | null
    unionSecretaryId: string | null
  }[]
}) {
  const { fixedClassIds, trainingCourseIds, fixedClasses } = params

  const roleStudentIds = uniqueIds([
    ...fixedClasses.map((fc) => fc.classMonitorId),
    ...fixedClasses.map((fc) => fc.unionLeaderId),
    ...fixedClasses.map((fc) => fc.deputyUnionSecretaryId),
    ...fixedClasses.map((fc) => fc.unionSecretaryId),
  ])

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    OR: [
      ...(fixedClassIds.length > 0 ? [{ fixedClassId: { in: fixedClassIds } }] : []),
      ...(trainingCourseIds.length > 0
        ? [{ fixedClass: { trainingCourseId: { in: trainingCourseIds } } }]
        : []),
      ...(roleStudentIds.length > 0 ? [{ id: { in: roleStudentIds } }] : []),
    ],
  }

  if (!where.OR || where.OR.length === 0) return []

  return prisma.student.findMany({ where })
}

export async function exportTrainingData(params: ExportTrainingDataParams) {
  const { classRegisterSessionId } = params

  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
    include: {
      trainingCourses: true,
      creditLimit: { where: { deletedAt: null } },
      semester: { include: { schoolYear: true } },
    },
  })

  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học")
  }

  const semesterId = session.semesterId
  const trainingCourses = session.trainingCourses.filter((tc) => !tc.deletedAt)
  const trainingCourseIds = uniqueIds(trainingCourses.map((tc) => tc.id))
  const trainingObjectTypeIds = uniqueIds(trainingCourses.map((tc) => tc.trainingObjectTypeId))

  if (trainingCourseIds.length === 0) {
    throw new Error("Đợt đăng ký chưa gắn khóa học")
  }

  const sessionToTrainingCourse = await querySessionToTrainingCourse(classRegisterSessionId)

  // Lớp mở đăng ký: HK của đợt, chính thức, theo đối tượng đào tạo của khóa
  const subjectClassWhere: Prisma.SubjectClassWhereInput = {
    semesterId,
    deletedAt: null,
    cancelled: false,
    status: "OFFICIAL",
    active: true,
    ...(trainingObjectTypeIds.length > 0
      ? { trainingObjectTypeId: { in: trainingObjectTypeIds } }
      : {}),
    OR: [
      { fixedClasses: { some: { trainingCourseId: { in: trainingCourseIds } } } },
      { fixedClasses: { none: {} } },
    ],
  }

  const subjectClasses = await prisma.subjectClass.findMany({
    where: subjectClassWhere,
    select: {
      id: true,
      subjectId: true,
      lecturerId: true,
      extraLecturerId: true,
      enterGradeLecturerId: true,
      roomId: true,
      trainingLocationId: true,
      examId: true,
    },
  })

  const subjectClassIds = subjectClasses.map((sc) => sc.id)
  const subjectVersionIds = uniqueIds(subjectClasses.map((sc) => sc.subjectId))

  const fixedClassToSubjectClass = await queryFixedClassToSubjectClass(subjectClassIds)

  const fixedClasses = await prisma.fixedClass.findMany({
    where: {
      deletedAt: null,
      trainingCourseId: { in: trainingCourseIds },
    },
  })
  const fixedClassIds = uniqueIds(fixedClasses.map((fc) => fc.id))

  // SV thuộc khóa / lớp quản lý trước — rồi mới lấy điểm lịch sử theo studentId
  const students = await loadStudents({
    fixedClassIds,
    trainingCourseIds,
    fixedClasses,
  })
  const studentIds = uniqueIds(students.map((s) => s.id))

  const [
    subjectClassTimes,
    classSchedules,
    subjectVersions,
    schoolYear,
    semesterRecord,
    trainingObjectTypes,
    trainingCourseRegulations,
    studentSubjectScoresRaw,
    studentSemesterResultsResolved,
  ] = await Promise.all([
    subjectClassIds.length > 0
      ? prisma.subjectClassTime.findMany({
          where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    subjectClassIds.length > 0
      ? prisma.classSchedule.findMany({
          where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    subjectVersionIds.length > 0
      ? prisma.subjectVersion.findMany({
          where: { id: { in: subjectVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    prisma.schoolYear.findUniqueOrThrow({ where: { id: session.semester.schoolYearId } }),
    prisma.semester.findUniqueOrThrow({ where: { id: semesterId } }),
    trainingObjectTypeIds.length > 0
      ? prisma.trainingObjectType.findMany({
          where: { id: { in: trainingObjectTypeIds } },
        })
      : Promise.resolve([]),
    prisma.trainingCourseRegulation.findMany({
      where: { trainingCourseId: { in: trainingCourseIds }, deletedAt: null },
    }),
    // Điểm lịch sử toàn khóa (tiên quyết trên cổng) — không chỉ HK đang đăng ký
    studentIds.length > 0
      ? prisma.studentSubjectScore.findMany({
          where: { deletedAt: null, studentId: { in: studentIds } },
        })
      : Promise.resolve([]),
    studentIds.length > 0
      ? prisma.studentSemesterResult.findMany({
          where: { studentId: { in: studentIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  // Giữ nguyên subjectClassId trên điểm lịch sử; bổ sung lớp HP được SSS tham chiếu
  const studentSubjectScores = studentSubjectScoresRaw
  const scoreSubjectClassIds = uniqueIds(studentSubjectScoresRaw.map((s) => s.subjectClassId))
  const allSubjectClassIdsForExport = uniqueIds([...subjectClassIds, ...scoreSubjectClassIds])

  const subjectIds = uniqueIds(subjectVersions.map((sv) => sv.subjectId))

  // Bổ sung SubjectVersion / Subject từ điểm lịch sử + tiên quyết
  const scoreSubjectVersionIds = uniqueIds([
    ...subjectVersionIds,
    ...studentSubjectScores.map((s) => s.subjectVersionId),
  ])

  const [prerequisiteJoins, coRequisiteJoins] = await Promise.all([
    querySubjectVersionJoins("_PrerequisiteSubject", scoreSubjectVersionIds),
    querySubjectVersionJoins("_CoRequisiteSubject", scoreSubjectVersionIds),
  ])

  const relatedFromJoins = uniqueIds([
    ...prerequisiteJoins.flatMap((j) => [j.A, j.B]),
    ...coRequisiteJoins.flatMap((j) => [j.A, j.B]),
  ])

  const allNeededSubjectVersionIds = uniqueIds([...scoreSubjectVersionIds, ...relatedFromJoins])
  const missingSubjectVersionIds = allNeededSubjectVersionIds.filter(
    (id) => !subjectVersionIds.includes(id)
  )

  const extraSubjectVersions =
    missingSubjectVersionIds.length > 0
      ? await prisma.subjectVersion.findMany({
          where: { id: { in: missingSubjectVersionIds }, deletedAt: null },
        })
      : []

  const allSubjectVersions = [...subjectVersions, ...extraSubjectVersions]
  const allSubjectIds = uniqueIds([
    ...subjectIds,
    ...extraSubjectVersions.map((sv) => sv.subjectId),
  ])

  // Equivalency groups gắn với các SubjectVersion trong gói
  const subjectInGroups = await prisma.subjectInGroup.findMany({
    where: {
      deletedAt: null,
      OR: [
        { subjectId: { in: allNeededSubjectVersionIds } },
        {
          equivalencyGroup: {
            subjects: { some: { subjectId: { in: allNeededSubjectVersionIds }, deletedAt: null } },
          },
        },
      ],
    },
  })
  const equivalencyGroupIds = uniqueIds(subjectInGroups.map((g) => g.equivalencyGroupId))
  const equivalencyGroups =
    equivalencyGroupIds.length > 0
      ? await prisma.equivalencyGroup.findMany({
          where: { id: { in: equivalencyGroupIds }, deletedAt: null },
        })
      : []

  // SubjectVersion trong nhóm tương đương (có thể ngoài allNeeded)
  const equivalencySubjectVersionIds = uniqueIds(subjectInGroups.map((g) => g.subjectId))
  const missingFromEquivalency = equivalencySubjectVersionIds.filter(
    (id) => !allNeededSubjectVersionIds.includes(id)
  )
  const equivalencyExtraVersions =
    missingFromEquivalency.length > 0
      ? await prisma.subjectVersion.findMany({
          where: { id: { in: missingFromEquivalency }, deletedAt: null },
        })
      : []

  const finalSubjectVersions = [...allSubjectVersions, ...equivalencyExtraVersions]
  const finalSubjectIds = uniqueIds([
    ...allSubjectIds,
    ...equivalencyExtraVersions.map((sv) => sv.subjectId),
  ])

  const [subjectClassRecords, exams] = await Promise.all([
    allSubjectClassIdsForExport.length > 0
      ? prisma.subjectClass.findMany({ where: { id: { in: allSubjectClassIdsForExport } } })
      : Promise.resolve([]),
    subjectClassIds.length > 0 || subjectVersionIds.length > 0
      ? prisma.exam.findMany({
          where: {
            semesterId,
            deletedAt: null,
            OR: [
              ...(subjectClassIds.length > 0
                ? [{ subjectClass: { some: { id: { in: subjectClassIds } } } }]
                : []),
              ...(subjectVersionIds.length > 0
                ? [{ subjectVersionId: { in: subjectVersionIds } }]
                : []),
            ],
          },
        })
      : Promise.resolve([]),
  ])

  // Normalize SubjectClass cho cổng: enrolledCount/version theo DB hiện tại;
  // null các FK tùy chọn dễ thiếu trên internet
  const subjectClassRecordsNormalized = subjectClassRecords.map((sc) => ({
    ...sc,
    scoreLinkSubjectVersionId: null,
  }))

  const lecturerIds = uniqueIds([
    ...subjectClassRecords.map((sc) => sc.lecturerId),
    ...subjectClassRecords.map((sc) => sc.extraLecturerId),
    ...subjectClassRecords.map((sc) => sc.enterGradeLecturerId),
    ...fixedClasses.map((fc) => fc.lecturerManagementId),
    ...classSchedules.map((cs) => cs.lecturerId),
    ...classSchedules.map((cs) => cs.extraLecturerId),
  ])

  const staffIds = uniqueIds(fixedClasses.map((fc) => fc.staffManagementId))

  const roomIds = uniqueIds([
    ...subjectClassRecords.map((sc) => sc.roomId),
    ...classSchedules.map((cs) => cs.roomId),
  ])

  const trainingLocationIds = uniqueIds([
    ...subjectClassRecords.map((sc) => sc.trainingLocationId),
    ...students.map((s) => s.trainingLocationId),
  ])

  const curriculumVersionIds = uniqueIds([
    ...fixedClasses.map((fc) => fc.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionParallelId),
  ])

  // Khối CTĐT — cần cho listing byCurriculum trên cổng
  const trainingBlockOnCvs =
    curriculumVersionIds.length > 0
      ? await prisma.trainingBlockOnCurriculumVersion.findMany({
          where: {
            deletedAt: null,
            curriculumVersionId: { in: curriculumVersionIds },
          },
        })
      : []
  const trainingBlockOnCvIds = uniqueIds(trainingBlockOnCvs.map((b) => b.id))
  const trainingBlockIds = uniqueIds(trainingBlockOnCvs.map((b) => b.trainingBlockId))

  const trainingBlockSubjects =
    trainingBlockOnCvIds.length > 0
      ? await prisma.trainingBlockSubject.findMany({
          where: {
            deletedAt: null,
            trainingBlockOnCurriculumVersionId: { in: trainingBlockOnCvIds },
          },
        })
      : []

  let trainingBlocks =
    trainingBlockIds.length > 0
      ? await prisma.trainingBlock.findMany({
          where: { id: { in: trainingBlockIds }, deletedAt: null },
        })
      : []

  // Parent blocks (nếu có)
  const parentBlockIds = uniqueIds(trainingBlocks.map((b) => b.parentId)).filter(
    (id) => !trainingBlockIds.includes(id)
  )
  if (parentBlockIds.length > 0) {
    const parents = await prisma.trainingBlock.findMany({
      where: { id: { in: parentBlockIds }, deletedAt: null },
    })
    trainingBlocks = [...parents, ...trainingBlocks]
  }

  // SubjectVersion từ khối CTĐT
  const blockSubjectVersionIds = uniqueIds(trainingBlockSubjects.map((s) => s.subjectId))
  const missingFromBlocks = blockSubjectVersionIds.filter(
    (id) => !finalSubjectVersions.some((sv) => sv.id === id)
  )
  const blockExtraVersions =
    missingFromBlocks.length > 0
      ? await prisma.subjectVersion.findMany({
          where: { id: { in: missingFromBlocks }, deletedAt: null },
        })
      : []
  const subjectVersionsWithBlocks = [...finalSubjectVersions, ...blockExtraVersions]
  const subjectIdsWithBlocks = uniqueIds([
    ...finalSubjectIds,
    ...blockExtraVersions.map((sv) => sv.subjectId),
  ])

  // Bổ sung tiên quyết/song hành cho SV từ khối CTĐT
  const [blockPrereqJoins, blockCoreqJoins] = await Promise.all([
    querySubjectVersionJoins("_PrerequisiteSubject", missingFromBlocks),
    querySubjectVersionJoins("_CoRequisiteSubject", missingFromBlocks),
  ])
  const joinKey = (j: JoinRow) => `${j.A}|${j.B}`
  const prerequisiteJoinsMerged = [
    ...prerequisiteJoins,
    ...blockPrereqJoins.filter((j) => !prerequisiteJoins.some((x) => joinKey(x) === joinKey(j))),
  ]
  const coRequisiteJoinsMerged = [
    ...coRequisiteJoins,
    ...blockCoreqJoins.filter((j) => !coRequisiteJoins.some((x) => joinKey(x) === joinKey(j))),
  ]

  // Semester / SchoolYear từ kết quả học kỳ, điểm lịch sử, semesterStart khóa
  const relatedSemesterIds = uniqueIds([
    semesterId,
    ...trainingCourses.map((tc) => tc.semesterStartId),
    ...studentSemesterResultsResolved.map((r) => r.semesterId),
    ...studentSubjectScoresRaw.map((s) => s.semesterId),
    ...subjectClassRecords.map((sc) => sc.semesterId),
  ])

  const [
    lecturers,
    staff,
    rooms,
    curriculumVersions,
    relatedSemesters,
    subjectsMerged,
    extraTrainingObjectTypes,
  ] = await Promise.all([
    lecturerIds.length > 0
      ? prisma.lecturer.findMany({ where: { id: { in: lecturerIds }, deletedAt: null } })
      : Promise.resolve([]),
    staffIds.length > 0
      ? prisma.staff.findMany({ where: { id: { in: staffIds }, deletedAt: null } })
      : Promise.resolve([]),
    roomIds.length > 0
      ? prisma.room.findMany({ where: { id: { in: roomIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumVersionIds.length > 0
      ? prisma.curriculumVersion.findMany({
          where: { id: { in: curriculumVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    relatedSemesterIds.length > 0
      ? prisma.semester.findMany({ where: { id: { in: relatedSemesterIds }, deletedAt: null } })
      : Promise.resolve([semesterRecord]),
    subjectIdsWithBlocks.length > 0
      ? prisma.subject.findMany({
          where: { id: { in: subjectIdsWithBlocks }, deletedAt: null },
        })
      : Promise.resolve([]),
    (() => {
      const existingTot = new Set(trainingObjectTypes.map((t) => t.id))
      const missingTot = uniqueIds([
        ...trainingBlocks.map((b) => b.trainingObjectTypeId),
        ...subjectClassRecords.map((sc) => sc.trainingObjectTypeId),
      ]).filter((id) => !existingTot.has(id))
      return missingTot.length > 0
        ? prisma.trainingObjectType.findMany({ where: { id: { in: missingTot } } })
        : Promise.resolve([])
    })(),
  ])

  const allTrainingObjectTypes = [...trainingObjectTypes, ...extraTrainingObjectTypes]

  const relatedSchoolYearIds = uniqueIds(relatedSemesters.map((s) => s.schoolYearId))
  const relatedSchoolYears =
    relatedSchoolYearIds.length > 0
      ? await prisma.schoolYear.findMany({
          where: { id: { in: relatedSchoolYearIds }, deletedAt: null },
        })
      : [schoolYear]

  const buildingIds = uniqueIds(rooms.map((r) => r.buildingId))
  const curriculumIds = uniqueIds(curriculumVersions.map((cv) => cv.curriculumId))

  const [buildings, curriculums] = await Promise.all([
    buildingIds.length > 0
      ? prisma.building.findMany({ where: { id: { in: buildingIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumIds.length > 0
      ? prisma.curriculum.findMany({ where: { id: { in: curriculumIds }, deletedAt: null } })
      : Promise.resolve([]),
  ])

  const trainingMajorIds = uniqueIds(curriculums.map((c) => c.trainingMajorId))
  const allTrainingLocationIds = uniqueIds([
    ...trainingLocationIds,
    ...buildings.map((b) => b.trainingLocationId),
  ])

  const [trainingMajors, trainingLocations] = await Promise.all([
    trainingMajorIds.length > 0
      ? prisma.trainingMajor.findMany({
          where: { id: { in: trainingMajorIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    allTrainingLocationIds.length > 0
      ? prisma.trainingLocation.findMany({
          where: { id: { in: allTrainingLocationIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  const userProfileIds = uniqueIds([
    ...lecturers.map((l) => l.userProfileId),
    ...students.map((s) => s.userProfileId),
    ...staff.map((s) => s.userProfileId),
  ])

  const [userProfiles, catalogs, examRecords] = await Promise.all([
    userProfileIds.length > 0
      ? prisma.userProfile.findMany({
          where: { id: { in: userProfileIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    loadAllCatalogs(),
    (async () => {
      const examIds = uniqueIds([
        ...exams.map((e) => e.id),
        ...subjectClassRecords.map((sc) => sc.examId),
      ])
      return examIds.length > 0
        ? prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
        : []
    })(),
  ])

  const { creditLimit, semester: _semester, trainingCourses: _tc, ...sessionRecord } = session

  const data = {
    ...catalogs,
    ClassRegisterSession: [sessionRecord],
    ClassRegisterSessionCredit: creditLimit,
    _ClassRegisterSessionToTrainingCourse: sessionToTrainingCourse,
    UserProfile: userProfiles,
    Student: students,
    Lecturer: lecturers,
    Staff: staff,
    TrainingObjectType: allTrainingObjectTypes,
    SchoolYear: relatedSchoolYears,
    Semester: relatedSemesters,
    TrainingCourse: trainingCourses,
    TrainingCourseRegulation: trainingCourseRegulations,
    Subject: subjectsMerged,
    SubjectVersion: subjectVersionsWithBlocks,
    _PrerequisiteSubject: prerequisiteJoinsMerged,
    _CoRequisiteSubject: coRequisiteJoinsMerged,
    EquivalencyGroup: equivalencyGroups,
    SubjectInGroup: subjectInGroups,
    TrainingBlock: trainingBlocks,
    TrainingBlockOnCurriculumVersion: trainingBlockOnCvs,
    TrainingBlockSubject: trainingBlockSubjects,
    SubjectClass: subjectClassRecordsNormalized,
    SubjectClassTime: subjectClassTimes,
    FixedClass: fixedClasses,
    _FixedClassToSubjectClass: fixedClassToSubjectClass,
    Room: rooms,
    Building: buildings,
    TrainingLocation: trainingLocations,
    TrainingMajor: trainingMajors,
    Curriculum: curriculums,
    CurriculumVersion: curriculumVersions,
    StudentSubjectScore: studentSubjectScores,
    StudentSemesterResult: studentSemesterResultsResolved,
    Exam: examRecords,
    ClassSchedule: classSchedules,
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
  )

  return serializeForJson({
    version: EXPORT_TRAINING_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    filters: {
      classRegisterSessionId,
      semesterId,
      trainingCourseIds,
    },
    counts,
    data,
  }) as {
    version: string
    exportedAt: string
    filters: {
      classRegisterSessionId: string
      semesterId: string
      trainingCourseIds: string[]
    }
    counts: Record<string, number>
    data: typeof data
  }
}
