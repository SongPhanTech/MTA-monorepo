import { calcFinalScore } from "../../../libs/src/utils"
import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

// THI VIẾT: only fill attandance and midterm
const subjectClassIds = await prisma.subjectClass.findMany({
  where: {
    examType: "OfflineWritten",
    subject: { onePoint: false },
    fixedClasses: {
      some: {
        trainingCourseId: "cmnfopsiz002sp101f3r243hh",
      },
    },
    semesterId: 'cmmvor6bi0001mp01mgfapxwk'
  },
})

console.log("lớp thi viết", subjectClassIds.length)

const whereCondition = {
  subjectClassId: {
    in: subjectClassIds.map((c) => c.id),
  },
  attendanceScore: null,
  midtermScore: null,
  examScore: null,
  examBanned: false,
  examPostponed: false,
}

const count = await prisma.studentSubjectScore.count({
  where: whereCondition,
})

console.log(`Found ${count} records to update`)

const scoresToUpdate = await prisma.studentSubjectScore.findMany({
  where: whereCondition,
  select: { id: true },
})

const getRandomScore = () => {
  // Generate random score between 6.0 and 10.0 with 0.5 increments
  const steps = Math.floor(Math.random() * 9) // 0 to 8
  return 6 + steps * 0.5
}

const chunkSize = 1000
for (let i = 0; i < scoresToUpdate.length; i += chunkSize) {
  const chunk = scoresToUpdate.slice(i, i + chunkSize)

  await prisma.$executeRawUnsafe(`
        UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
        SET
            "attendanceScore" = data."attendanceScore"::double precision,
            "midtermScore" = data."midtermScore"::double precision,
            "updatedAt" = NOW()
        FROM (
            VALUES
            ${chunk
              .map(
                (u) => `(
                        '${u.id}',
                        ${getRandomScore()},
                        ${getRandomScore()}
                    )`
              )
              .join(",\n")}
        ) AS data("id", "attendanceScore", "midtermScore")
        WHERE sss.id = data.id;
    `)

  console.log(
    `Updated ${Math.min(i + chunkSize, scoresToUpdate.length)} / ${scoresToUpdate.length} records...`
  )
}

await prisma.subjectClass.updateMany({
  where: { id: { in: subjectClassIds.map((c) => c.id) } },
  data: { enteredScore: true },
})

// THI KHÁC
const classes = await prisma.subjectClass.findMany({
  include: {
    subject: { select: { onePoint: true } },
  },
  where: {
    examType: { not: "OfflineWritten" },
    fixedClasses: {
      some: {
        trainingCourseId: "cmnfopsiz002sp101f3r243hh",
      },
    },
    semesterId: 'cmmvor6bi0001mp01mgfapxwk'
  },
})

console.log("lớp thi khác", classes.length)

const scoresKhac = await prisma.studentSubjectScore.findMany({
  where: {
    subjectClassId: { in: classes.map((c) => c.id) },
    finalScore: null,
    examBanned: false,
    examPostponed: false,
  },
  select: {
    id: true,
    subjectClass: {
      select: {
        subject: {
          select: { onePoint: true },
        },
      },
    },
  },
})

console.log("scores thi khác", scoresKhac.length)

if (scoresKhac.length > 0) {
  for (let i = 0; i < scoresKhac.length; i += chunkSize) {
    const chunk = scoresKhac.slice(i, i + chunkSize)

    await prisma.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
            SET
                "attendanceScore" = data."attendanceScore"::double precision,
                "midtermScore" = data."midtermScore"::double precision,
                "updatedAt" = NOW()
            FROM (
                VALUES
                ${chunk
                  .map((s) => {
                    const isOnePoint = s.subjectClass?.subject.onePoint
                    if (isOnePoint) {
                      const score = getRandomScore()
                      return `(
                                '${s.id}',
                                ${score},
                                ${score},
                                ${score}
                            )`
                    }
                    return `(
                            '${s.id}',
                            ${getRandomScore()},
                            ${getRandomScore()}
                        )`
                  })
                  .join(",\n")}
            ) AS data("id", "attendanceScore", "midtermScore")
            WHERE sss.id = data.id;
        `)

    console.log(
      `Updated ${Math.min(i + chunkSize, scoresKhac.length)} / ${scoresKhac.length} records... (THI KHÁC)`
    )
  }
}

await prisma.subjectClass.updateMany({
  where: { id: { in: classes.map((c) => c.id) } },
  data: { enteredScore: true },
})

console.log("Update complete!")
