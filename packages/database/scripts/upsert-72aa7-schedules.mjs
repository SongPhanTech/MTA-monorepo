/**
 * Upsert SubjectClassTime + ClassSchedule cho lớp 72AA 7
 * Chiều, Thứ 3, tiết 7–10, các ngày học cụ thể.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/upsert-72aa7-schedules.mjs
 */
import { PrismaClient, $Enums } from "../generated/prisma-client/index.js"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"

dayjs.extend(customParseFormat)

const CODE = "72AA 7"
const DATES = [
  "11/08/2026",
  "18/08/2026",
  "25/08/2026",
  "08/09/2026",
  "15/09/2026",
  "22/09/2026",
  "29/09/2026",
  "06/10/2026",
  "13/10/2026",
  "20/10/2026",
  "27/10/2026",
  "03/11/2026",
  "10/11/2026",
  "17/11/2026",
]
const START_PERIOD = 7
const END_PERIOD = 10
/** Thứ 3 trong hệ thống (2=T2 … 8=CN) */
const DAY_OF_WEEK = 3

const prisma = new PrismaClient()

async function main() {
  const subjectClass = await prisma.subjectClass.findFirst({
    where: {
      code: { equals: CODE, mode: "insensitive" },
      deletedAt: null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      schedule: true,
      semesterId: true,
      roomId: true,
      lecturerId: true,
      extraLecturerId: true,
      status: true,
    },
  })

  if (!subjectClass) {
    const similar = await prisma.subjectClass.findMany({
      where: { code: { contains: "72AA", mode: "insensitive" } },
      select: { id: true, code: true, semesterId: true, deletedAt: true },
      take: 20,
    })
    console.error(`Không tìm thấy SubjectClass code="${CODE}"`)
    console.error("Gần giống:", similar)
    process.exit(1)
  }

  console.log("Found:", subjectClass)

  const result = await prisma.$transaction(async (tx) => {
    await tx.subjectClass.update({
      where: { id: subjectClass.id },
      data: { schedule: $Enums.SubjectClassSchedule.AFTERNOON },
    })

    // Khung tuần–tiết: xóa cũ rồi tạo lại Thứ 3 tiết 7–10
    await tx.subjectClassTime.deleteMany({
      where: { subjectClassId: subjectClass.id },
    })
    await tx.subjectClassTime.create({
      data: {
        subjectClassId: subjectClass.id,
        dayOfWeek: DAY_OF_WEEK,
        startPeriod: START_PERIOD,
        endPeriod: END_PERIOD,
      },
    })

    let created = 0
    let updated = 0
    let skipped = 0

    for (const d of DATES) {
      const classDate = dayjs(d, "DD/MM/YYYY").hour(12).minute(0).second(0).millisecond(0)
      if (!classDate.isValid()) {
        console.warn("Ngày không hợp lệ:", d)
        skipped++
        continue
      }
      const dateOnly = classDate.toDate()

      const existing = await tx.classSchedule.findFirst({
        where: {
          subjectClassId: subjectClass.id,
          classDate: dateOnly,
          startPeriod: START_PERIOD,
          endPeriod: END_PERIOD,
        },
      })

      if (existing) {
        await tx.classSchedule.update({
          where: { id: existing.id },
          data: {
            roomId: subjectClass.roomId,
            lecturerId: subjectClass.lecturerId,
            extraLecturerId: subjectClass.extraLecturerId,
            startPeriod: START_PERIOD,
            endPeriod: END_PERIOD,
            periodType: $Enums.PeriodType.THEORY,
          },
        })
        updated++
      } else {
        // Tránh trùng nếu đã có buổi cùng ngày (khác tiết) — upsert theo ngày+lớp
        const sameDay = await tx.classSchedule.findFirst({
          where: {
            subjectClassId: subjectClass.id,
            classDate: dateOnly,
          },
        })
        if (sameDay) {
          await tx.classSchedule.update({
            where: { id: sameDay.id },
            data: {
              roomId: subjectClass.roomId,
              lecturerId: subjectClass.lecturerId,
              extraLecturerId: subjectClass.extraLecturerId,
              startPeriod: START_PERIOD,
              endPeriod: END_PERIOD,
              periodType: $Enums.PeriodType.THEORY,
            },
          })
          updated++
        } else {
          await tx.classSchedule.create({
            data: {
              subjectClassId: subjectClass.id,
              classDate: dateOnly,
              startPeriod: START_PERIOD,
              endPeriod: END_PERIOD,
              roomId: subjectClass.roomId,
              lecturerId: subjectClass.lecturerId,
              extraLecturerId: subjectClass.extraLecturerId,
              periodType: $Enums.PeriodType.THEORY,
            },
          })
          created++
        }
      }
    }

    const schedules = await tx.classSchedule.findMany({
      where: { subjectClassId: subjectClass.id },
      select: { id: true, classDate: true, startPeriod: true, endPeriod: true },
      orderBy: { classDate: "asc" },
    })

    return { created, updated, skipped, schedules }
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        subjectClassId: subjectClass.id,
        code: subjectClass.code,
        schedule: "AFTERNOON",
        dayOfWeek: DAY_OF_WEEK,
        periods: `${START_PERIOD}-${END_PERIOD}`,
        ...result,
        schedules: result.schedules.map((s) => ({
          ...s,
          classDate: dayjs(s.classDate).format("DD/MM/YYYY"),
        })),
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
