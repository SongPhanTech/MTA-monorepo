import type { $Enums, Prisma } from "@workspace/db"
import { Prisma as PrismaNamespace } from "@workspace/db"
import { prisma } from ".."

export const EXPORT_TRAINING_DATA_VERSION = "1.0.0"

export type ExportTrainingDataParams = {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  type?: $Enums.SubjectClassType
}

type FixedClassToSubjectClassRow = {
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

  return prisma.$queryRaw<FixedClassToSubjectClassRow[]>`
    SELECT "A", "B"
    FROM "ql-dao-tao"."_FixedClassToSubjectClass"
    WHERE "B" IN (${PrismaNamespace.join(subjectClassIds)})
  `
}

export async function exportTrainingData(params: ExportTrainingDataParams) {
  const { semesterId, trainingObjectTypeId, trainingCourseId, type } = params

  const [semester, trainingObjectType] = await Promise.all([
    prisma.semester.findUniqueOrThrow({
      where: { id: semesterId },
      select: { id: true, schoolYearId: true },
    }),
    prisma.trainingObjectType.findUniqueOrThrow({
      where: { id: trainingObjectTypeId },
      select: { id: true },
    }),
  ])

  const subjectClassWhere: Prisma.SubjectClassWhereInput = {
    semesterId,
    trainingObjectTypeId,
    ...(type ? { type } : {}),
    active: true,
    deletedAt: null,
    cancelled: false,
    status: "OFFICIAL",
  }

  const subjectClassCourseFilter: Prisma.SubjectClassWhereInput = trainingCourseId
    ? {
        OR: [
          { fixedClasses: { some: { trainingCourseId } } },
          { fixedClasses: { none: {} } },
        ],
      }
    : {}

  const subjectClasses = await prisma.subjectClass.findMany({
    where: { ...subjectClassWhere, ...subjectClassCourseFilter },
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

  if (subjectClasses.length === 0) {
    throw new Error("Không có dữ liệu lớp học phần để xuất")
  }

  const subjectClassIds = subjectClasses.map((sc) => sc.id)
  const subjectVersionIds = uniqueIds(subjectClasses.map((sc) => sc.subjectId))

  const fixedClassToSubjectClass = await queryFixedClassToSubjectClass(subjectClassIds)
  const fixedClassIdsFromM2m = uniqueIds(fixedClassToSubjectClass.map((row) => row.A))

  const trainingCourseWhere: Prisma.TrainingCourseWhereInput = trainingCourseId
    ? { id: trainingCourseId, trainingObjectTypeId, deletedAt: null }
    : {
        trainingObjectTypeId,
        deletedAt: null,
        fixedClass: {
          some: {
            deletedAt: null,
            subjectClasses: { some: { id: { in: subjectClassIds } } },
          },
        },
      }

  const trainingCourses = await prisma.trainingCourse.findMany({
    where: trainingCourseWhere,
  })
  const trainingCourseIds = uniqueIds(trainingCourses.map((tc) => tc.id))

  const fixedClassWhere: Prisma.FixedClassWhereInput = {
    deletedAt: null,
    ...(trainingCourseIds.length > 0
      ? trainingCourseId
        ? { trainingCourseId: { in: trainingCourseIds } }
        : {
            OR: [
              { id: { in: fixedClassIdsFromM2m } },
              { subjectClasses: { some: { id: { in: subjectClassIds } } } },
            ],
          }
      : { id: { in: fixedClassIdsFromM2m } }),
  }

  const fixedClasses = await prisma.fixedClass.findMany({ where: fixedClassWhere })
  const fixedClassIds = uniqueIds(fixedClasses.map((fc) => fc.id))

  const [
    subjectClassTimes,
    classSchedules,
    studentSubjectScores,
    subjectVersions,
    planTrainings,
    exams,
    schoolYear,
    semesterRecord,
    trainingObjectTypeRecord,
  ] = await Promise.all([
    prisma.subjectClassTime.findMany({
      where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
    }),
    prisma.classSchedule.findMany({
      where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
    }),
    prisma.studentSubjectScore.findMany({
      where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
    }),
    prisma.subjectVersion.findMany({
      where: { id: { in: subjectVersionIds }, deletedAt: null },
    }),
    prisma.planTraining.findMany({
      where: {
        semesterId,
        trainingObjectTypeId,
        deletedAt: null,
        ...(trainingCourseId
          ? { OR: [{ trainingCourseId }, { trainingCourseId: null }] }
          : {}),
      },
    }),
    prisma.exam.findMany({
      where: {
        semesterId,
        deletedAt: null,
        OR: [
          { subjectClass: { some: { id: { in: subjectClassIds } } } },
          { subjectVersionId: { in: subjectVersionIds } },
        ],
      },
    }),
    prisma.schoolYear.findUniqueOrThrow({ where: { id: semester.schoolYearId } }),
    prisma.semester.findUniqueOrThrow({ where: { id: semesterId } }),
    prisma.trainingObjectType.findUniqueOrThrow({ where: { id: trainingObjectType.id } }),
  ])

  const subjectIds = uniqueIds(subjectVersions.map((sv) => sv.subjectId))
  const planTrainingIds = uniqueIds(planTrainings.map((pt) => pt.id))
  const examIds = uniqueIds([
    ...exams.map((e) => e.id),
    ...subjectClasses.map((sc) => sc.examId),
  ])

  const studentIds = uniqueIds(studentSubjectScores.map((sss) => sss.studentId))

  const studentWhere: Prisma.StudentWhereInput = {
    deletedAt: null,
    OR: [
      ...(fixedClassIds.length > 0 ? [{ fixedClassId: { in: fixedClassIds } }] : []),
      ...(studentIds.length > 0 ? [{ id: { in: studentIds } }] : []),
    ],
  }

  const [
    subjects,
    planTrainingSubjects,
    students,
    subjectClassRecords,
    examRecords,
  ] = await Promise.all([
    prisma.subject.findMany({ where: { id: { in: subjectIds }, deletedAt: null } }),
    planTrainingIds.length > 0
      ? prisma.planTrainingSubject.findMany({
          where: { planTrainingId: { in: planTrainingIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    studentWhere.OR && studentWhere.OR.length > 0
      ? prisma.student.findMany({ where: studentWhere })
      : Promise.resolve([]),
    prisma.subjectClass.findMany({ where: { id: { in: subjectClassIds } } }),
    examIds.length > 0
      ? prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
      : Promise.resolve(exams),
  ])

  const lecturerIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.lecturerId),
    ...subjectClasses.map((sc) => sc.extraLecturerId),
    ...subjectClasses.map((sc) => sc.enterGradeLecturerId),
    ...fixedClasses.map((fc) => fc.lecturerManagementId),
    ...classSchedules.map((cs) => cs.lecturerId),
    ...classSchedules.map((cs) => cs.extraLecturerId),
  ])

  const roomIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.roomId),
    ...classSchedules.map((cs) => cs.roomId),
  ])

  const trainingLocationIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.trainingLocationId),
    ...students.map((s) => s.trainingLocationId),
  ])

  const curriculumVersionIds = uniqueIds([
    ...fixedClasses.map((fc) => fc.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionParallelId),
  ])

  const [lecturers, rooms, curriculumVersions] = await Promise.all([
    lecturerIds.length > 0
      ? prisma.lecturer.findMany({ where: { id: { in: lecturerIds }, deletedAt: null } })
      : Promise.resolve([]),
    roomIds.length > 0
      ? prisma.room.findMany({ where: { id: { in: roomIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumVersionIds.length > 0
      ? prisma.curriculumVersion.findMany({
          where: { id: { in: curriculumVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  const buildingIds = uniqueIds(rooms.map((r) => r.buildingId))
  const curriculumIds = uniqueIds(curriculumVersions.map((cv) => cv.curriculumId))
  const lecturerTypeIds = uniqueIds(lecturers.map((l) => l.lecturerTypeId))

  const [buildings, curriculums, lecturerTypes] = await Promise.all([
    buildingIds.length > 0
      ? prisma.building.findMany({ where: { id: { in: buildingIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumIds.length > 0
      ? prisma.curriculum.findMany({ where: { id: { in: curriculumIds }, deletedAt: null } })
      : Promise.resolve([]),
    lecturerTypeIds.length > 0
      ? prisma.lecturerType.findMany({ where: { id: { in: lecturerTypeIds }, deletedAt: null } })
      : Promise.resolve([]),
  ])

  const trainingMajorIds = uniqueIds(curriculums.map((c) => c.trainingMajorId))
  const trainingLocationIdsFromBuildings = uniqueIds(buildings.map((b) => b.trainingLocationId))
  const allTrainingLocationIds = uniqueIds([
    ...trainingLocationIds,
    ...trainingLocationIdsFromBuildings,
  ])

  const organizationIds = uniqueIds([
    ...subjects.map((s) => s.managementOrganizationId),
    ...subjectVersions.map((sv) => sv.managementOrganizationId),
    ...fixedClasses.map((fc) => fc.managementOrganizationId),
    ...lecturers.map((l) => l.organizationId),
    ...curriculums.map((c) => c.managementOrganizationId),
  ])

  const [trainingMajors, trainingLocations, dmDonVis] = await Promise.all([
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
    organizationIds.length > 0
      ? prisma.dM_DonVi.findMany({ where: { Id: { in: organizationIds } } })
      : Promise.resolve([]),
  ])

  const dmDonViIdsFromMajors = uniqueIds([
    ...trainingMajors.map((tm) => tm.organizationId),
    ...trainingMajors.map((tm) => tm.secondOrganizationId),
    ...trainingMajors.map((tm) => tm.thirdOrganizationId),
  ])

  const extraDmDonVis =
    dmDonViIdsFromMajors.length > 0
      ? await prisma.dM_DonVi.findMany({
          where: { Id: { in: dmDonViIdsFromMajors } },
        })
      : []

  const allDmDonVis = [
    ...dmDonVis,
    ...extraDmDonVis.filter((d) => !dmDonVis.some((existing) => existing.Id === d.Id)),
  ]

  const userProfileIds = uniqueIds([
    ...lecturers.map((l) => l.userProfileId),
    ...students.map((s) => s.userProfileId),
  ])

  const userProfiles =
    userProfileIds.length > 0
      ? await prisma.userProfile.findMany({ where: { id: { in: userProfileIds } } })
      : []

  const data = {
    DM_DonVi: allDmDonVis,
    UserProfile: userProfiles,
    LecturerType: lecturerTypes,
    Lecturer: lecturers,
    TrainingObjectType: [trainingObjectTypeRecord],
    SchoolYear: [schoolYear],
    Semester: [semesterRecord],
    TrainingCourse: trainingCourses,
    Subject: subjects,
    SubjectVersion: subjectVersions,
    SubjectClass: subjectClassRecords,
    SubjectClassTime: subjectClassTimes,
    FixedClass: fixedClasses,
    _FixedClassToSubjectClass: fixedClassToSubjectClass,
    Room: rooms,
    Building: buildings,
    TrainingLocation: trainingLocations,
    TrainingMajor: trainingMajors,
    Curriculum: curriculums,
    CurriculumVersion: curriculumVersions,
    Student: students,
    StudentSubjectScore: studentSubjectScores,
    PlanTraining: planTrainings,
    PlanTrainingSubject: planTrainingSubjects,
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
      semesterId,
      trainingObjectTypeId,
      trainingCourseId: trainingCourseId ?? null,
      type: type ?? null,
    },
    counts,
    data,
  }) as {
    version: string
    exportedAt: string
    filters: {
      semesterId: string
      trainingObjectTypeId: string
      trainingCourseId: string | null
      type: string | null
    }
    counts: Record<string, number>
    data: typeof data
  }
}
