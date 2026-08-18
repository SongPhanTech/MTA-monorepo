/**
 * Đồng bộ 1 đợt đăng ký học (ClassRegisterSession) từ DB nguồn → DB đích.
 *
 * Usage:
 *   SOURCE_DATABASE_URL="postgresql://..." \
 *   TARGET_DATABASE_URL="postgresql://..." \
 *   bun scripts/sync-class-register-session.mjs --session=cmsr7fw6r0001o401q0a2y4sz
 *
 * Options:
 *   --session=<id>   Bắt buộc — id ClassRegisterSession trên nguồn
 *   --dry-run        Chỉ in thống kê, không ghi DB đích
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const sessionArg = process.argv.find((a) => a.startsWith("--session="))
const SESSION_ID = sessionArg?.split("=")[1] || process.env.SESSION_ID

const SOURCE_URL = process.env.SOURCE_DATABASE_URL
const TARGET_URL = process.env.TARGET_DATABASE_URL

if (!SESSION_ID) {
  console.error("Thiếu --session=<ClassRegisterSessionId>")
  process.exit(1)
}
if (!SOURCE_URL || !TARGET_URL) {
  console.error("Thiếu SOURCE_DATABASE_URL và/hoặc TARGET_DATABASE_URL")
  process.exit(1)
}

function withLimit(url) {
  return url.includes("?") ? `${url}&connection_limit=2` : `${url}?connection_limit=2`
}

function createPrisma(url) {
  return new PrismaClient({ datasources: { db: { url: withLimit(url) } } })
}

function serializeRow(row) {
  return JSON.parse(
    JSON.stringify(row, (_k, v) => {
      if (typeof v === "bigint") return v.toString()
      if (v instanceof Date) return v.toISOString()
      if (v?.constructor?.name === "Decimal") return v.toString()
      return v
    })
  )
}

function uniqueIds(values) {
  return [...new Set(values.filter(Boolean))]
}

async function queryJoin(src, table, filterA) {
  const rows = await src.$queryRawUnsafe(
    `SELECT "A", "B" FROM "ql-dao-tao"."${table}" WHERE "A" = ANY($1::text[])`,
    filterA
  )
  return rows
}

async function upsertJoin(tgt, table, rows) {
  let n = 0
  for (const row of rows) {
    if (!row.A || !row.B) continue
    await tgt.$executeRawUnsafe(
      `INSERT INTO "ql-dao-tao"."${table}" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      row.A,
      row.B
    )
    n += 1
  }
  return n
}

async function upsertMany(tgt, model, rows, pk = "id") {
  if (rows.length === 0) return 0
  let n = 0
  for (const row of rows) {
    const data = serializeRow(row)
    const where = { [pk]: data[pk] }
    try {
      await tgt[model].upsert({ where, create: data, update: data })
      n += 1
    } catch (e) {
      console.warn(`[warn] ${model}/${data[pk]}: ${e.message}`)
    }
  }
  return n
}

async function main() {
  const src = createPrisma(SOURCE_URL)
  const tgt = createPrisma(TARGET_URL)

  try {
    const session = await src.classRegisterSession.findUnique({
      where: { id: SESSION_ID },
      include: {
        creditLimit: { where: { deletedAt: null } },
        semester: { include: { schoolYear: true } },
      },
    })
    if (!session) throw new Error(`Không tìm thấy ClassRegisterSession ${SESSION_ID} trên nguồn`)

    const sessionJoins = await src.$queryRawUnsafe(
      `SELECT "A", "B" FROM "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" WHERE "A" = $1`,
      SESSION_ID
    )
    const trainingCourseIds = uniqueIds(sessionJoins.map((r) => r.B))

    const subjectClasses = await src.subjectClass.findMany({
      where: { semesterId: session.semesterId, deletedAt: null },
    })
    const subjectClassIds = subjectClasses.map((sc) => sc.id)
    const subjectVersionIds = uniqueIds(subjectClasses.map((sc) => sc.subjectId))

    const subjectVersions = await src.subjectVersion.findMany({
      where: { id: { in: subjectVersionIds } },
    })
    const subjectIds = uniqueIds(subjectVersions.map((sv) => sv.subjectId))

    const [subjects, subjectClassTimes, classSchedules, trainingCourses, trainingCourseRegulations] =
      await Promise.all([
        src.subject.findMany({ where: { id: { in: subjectIds } } }),
        src.subjectClassTime.findMany({ where: { subjectClassId: { in: subjectClassIds } } }),
        src.classSchedule.findMany({ where: { subjectClassId: { in: subjectClassIds } } }),
        src.trainingCourse.findMany({ where: { id: { in: trainingCourseIds } } }),
        src.trainingCourseRegulation.findMany({
          where: { trainingCourseId: { in: trainingCourseIds }, deletedAt: null },
        }),
      ])

    const trainingObjectTypeIds = uniqueIds(subjectClasses.map((sc) => sc.trainingObjectTypeId))
    const trainingObjectTypes = await src.trainingObjectType.findMany({
      where: { id: { in: trainingObjectTypeIds } },
    })

    const prereqJoins = await queryJoin(src, "_PrerequisiteSubject", subjectVersionIds)
    const coreqJoins = await queryJoin(src, "_CoRequisiteSubject", subjectVersionIds)

    const registerLogs = await src.classRegisterLogs.findMany({
      where: { classRegisterSessionId: SESSION_ID, deletedAt: null },
    })
    const registerAttempts = await src.classRegisterAttempt.findMany({
      where: { classRegisterSessionId: SESSION_ID, deletedAt: null },
    })

    const studentIds = uniqueIds([
      ...registerLogs.map((l) => l.studentId),
      ...registerAttempts.map((a) => a.studentId),
    ])
    const students = await src.student.findMany({ where: { id: { in: studentIds } } })
    const userProfileIds = uniqueIds(students.map((s) => s.userProfileId))
    const userProfiles = await src.userProfile.findMany({
      where: { id: { in: userProfileIds } },
    })

    const fixedClassIds = uniqueIds(students.map((s) => s.fixedClassId))
    const fixedClasses = await src.fixedClass.findMany({ where: { id: { in: fixedClassIds } } })

    const curriculumVersionIds = uniqueIds([
      ...students.map((s) => s.curriculumVersionId),
      ...fixedClasses.map((fc) => fc.curriculumVersionId),
    ])
    const curriculumVersions = await src.curriculumVersion.findMany({
      where: { id: { in: curriculumVersionIds } },
    })
    const curriculumIds = uniqueIds(curriculumVersions.map((cv) => cv.curriculumId))
    const curriculums = await src.curriculum.findMany({ where: { id: { in: curriculumIds } } })

    const studentSemesterResults = await src.studentSemesterResult.findMany({
      where: { studentId: { in: studentIds } },
    })

    const studentSubjectScores = await src.studentSubjectScore.findMany({
      where: { subjectClassId: { in: subjectClassIds } },
    })

    const summary = {
      session: session.name,
      semester: session.semester?.name,
      trainingCourses: trainingCourses.length,
      subjectClasses: subjectClasses.length,
      registerLogs: registerLogs.length,
      registerAttempts: registerAttempts.length,
      students: students.length,
      userProfiles: userProfiles.length,
      studentSubjectScores: studentSubjectScores.length,
    }
    console.log("[sync-session] scope:", summary)

    if (dryRun) {
      console.log("[sync-session] dry-run — không ghi DB đích")
      return
    }

    const steps = []

    steps.push({ table: "SchoolYear", count: await upsertMany(tgt, "schoolYear", session.semester?.schoolYear ? [session.semester.schoolYear] : []) })
    const semesterRow = serializeRow(session.semester)
    delete semesterRow.schoolYear
    steps.push({ table: "Semester", count: await upsertMany(tgt, "semester", semesterRow ? [semesterRow] : []) })
    steps.push({ table: "TrainingObjectType", count: await upsertMany(tgt, "trainingObjectType", trainingObjectTypes) })
    steps.push({ table: "TrainingCourse", count: await upsertMany(tgt, "trainingCourse", trainingCourses) })
    steps.push({
      table: "TrainingCourseRegulation",
      count: await upsertMany(tgt, "trainingCourseRegulation", trainingCourseRegulations),
    })
    steps.push({ table: "Curriculum", count: await upsertMany(tgt, "curriculum", curriculums) })
    steps.push({ table: "CurriculumVersion", count: await upsertMany(tgt, "curriculumVersion", curriculumVersions) })
    steps.push({ table: "Subject", count: await upsertMany(tgt, "subject", subjects) })
    steps.push({ table: "SubjectVersion", count: await upsertMany(tgt, "subjectVersion", subjectVersions) })
    steps.push({ table: "FixedClass", count: await upsertMany(tgt, "fixedClass", fixedClasses) })

    for (const profile of userProfiles) {
      const data = serializeRow(profile)
      await tgt.userProfile.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      })
    }
    steps.push({ table: "UserProfile", count: userProfiles.length })

    steps.push({ table: "Student", count: await upsertMany(tgt, "student", students) })
    steps.push({
      table: "StudentSemesterResult",
      count: await upsertMany(tgt, "studentSemesterResult", studentSemesterResults),
    })

    const sessionData = serializeRow(session)
    delete sessionData.creditLimit
    delete sessionData.semester
    await tgt.classRegisterSession.upsert({
      where: { id: sessionData.id },
      create: sessionData,
      update: sessionData,
    })
    steps.push({ table: "ClassRegisterSession", count: 1 })

    steps.push({
      table: "ClassRegisterSessionCredit",
      count: await upsertMany(tgt, "classRegisterSessionCredit", session.creditLimit),
    })

    for (const sc of subjectClasses) {
      const data = serializeRow({ ...sc, scoreLinkSubjectVersionId: null })
      await tgt.subjectClass.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      })
    }
    steps.push({ table: "SubjectClass", count: subjectClasses.length })

    steps.push({ table: "SubjectClassTime", count: await upsertMany(tgt, "subjectClassTime", subjectClassTimes) })
    steps.push({ table: "ClassSchedule", count: await upsertMany(tgt, "classSchedule", classSchedules) })
    steps.push({
      table: "StudentSubjectScore",
      count: await upsertMany(tgt, "studentSubjectScore", studentSubjectScores),
    })
    steps.push({
      table: "ClassRegisterLogs",
      count: await upsertMany(tgt, "classRegisterLogs", registerLogs),
    })
    steps.push({
      table: "ClassRegisterAttempt",
      count: await upsertMany(tgt, "classRegisterAttempt", registerAttempts),
    })

    steps.push({
      table: "_ClassRegisterSessionToTrainingCourse",
      count: await upsertJoin(tgt, "_ClassRegisterSessionToTrainingCourse", sessionJoins),
    })
    steps.push({
      table: "_PrerequisiteSubject",
      count: await upsertJoin(tgt, "_PrerequisiteSubject", prereqJoins),
    })
    steps.push({
      table: "_CoRequisiteSubject",
      count: await upsertJoin(tgt, "_CoRequisiteSubject", coreqJoins),
    })

    console.log("[sync-session] done:")
    for (const s of steps) console.log(`  ${s.table}: ${s.count}`)

    const verify = await tgt.classRegisterSession.findUnique({
      where: { id: SESSION_ID },
      include: { creditLimit: true },
    })
    const logCount = await tgt.classRegisterLogs.count({
      where: { classRegisterSessionId: SESSION_ID },
    })
    const scCount = await tgt.subjectClass.count({
      where: { semesterId: session.semesterId, deletedAt: null },
    })
    console.log("[sync-session] verify target:", {
      session: verify?.name,
      credits: verify?.creditLimit?.length ?? 0,
      logs: logCount,
      subjectClasses: scCount,
    })
  } finally {
    await src.$disconnect()
    await tgt.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
