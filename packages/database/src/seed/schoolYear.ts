import { createId } from "@paralleldrive/cuid2"
import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

const year = [
  {
    id: createId(),
    name: "2021/2022",
    startDate: new Date("2021-09-01"),
    endDate: new Date("2022-06-31"),
  },
  {
    id: createId(),
    name: "2022/2023",
    startDate: new Date("2022-09-01"),
    endDate: new Date("2023-06-31"),
  },
  {
    id: createId(),
    name: "2023/2024",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-06-31"),
  },
  {
    id: createId(),
    name: "2024/2025",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-31"),
  },
  {
    id: createId(),
    name: "2025/2026",
    startDate: new Date("2025-09-01"),
    endDate: new Date("2026-06-31"),
  },
  {
    id: createId(),
    name: "2026/2027",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2027-06-31"),
  },
]

const semesters = year.flatMap((year) => [
  {
    id: createId(),
    code: `HK1-${year.name}`,
    name: `HK1-${year.name}`,
    startDate: year.startDate,
    endDate: new Date(year.startDate.setMonth(year.startDate.getMonth() + 6)),
    schoolYearId: year.id,
    semesterType: "FIRST" as const,
  },
  {
    id: createId(),
    code: `HK2-${year.name}`,
    name: `HK2-${year.name}`,
    startDate: new Date(year.startDate.setMonth(year.startDate.getMonth() + 6)),
    endDate: year.endDate,
    schoolYearId: year.id,
    semesterType: "SECOND" as const,
  },
])

export async function seedSchoolYear() {
  await prisma.schoolYear.createMany({ data: year })
  await prisma.semester.createMany({ data: semesters })
}
