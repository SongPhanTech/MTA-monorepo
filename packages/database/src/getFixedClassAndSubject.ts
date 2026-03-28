import dayjs from "dayjs"
import { $Enums, PrismaClient } from "../generated/prisma-client"

const prisma = new PrismaClient()
async function getSubjectsToOpen(semesterId: string) {
  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId, deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      semesterType: true,
      schoolYear: {
        select: { startDate: true },
      },
    },
  })

  console.log("semester", semester)

  const maxSemesterCurriculum = await prisma.curriculumVersion.findFirst({
    orderBy: { numberOfSemesters: "desc" },
    select: { numberOfSemesters: true },
  })

  // thời gian đào tạo tối đa: fre-filter
  const maxSemester = maxSemesterCurriculum?.numberOfSemesters || 12
  const maxSchoolYear = maxSemester / 2
  Math.ceil(maxSchoolYear)

  // những lớp nằm trong kỳ học này (tối đa 6 năm ~ 12 kỳ)
  const classes = await prisma.fixedClass.findMany({
    where: {
      trainingCourse: {
        semesterStart: {
          schoolYear: {
            startDate: {
              gte: dayjs(semester.schoolYear.startDate)
                .subtract(maxSchoolYear, "year")
                .startOf("year")
                .toDate(),
            },
          },
        },
      },
      curriculumVersionId: { not: null },
    },
    include: {
      curriculumVersion: true,
      trainingCourse: {
        include: {
          semesterStart: {
            include: {
              schoolYear: true,
            },
          },
        },
      },
    },
  })

  const results: any[] = []

  for (const cls of classes) {
    if (!cls.trainingCourse || !cls.curriculumVersionId) continue

    const semesterOrder =
      semester.semesterType === $Enums.SemesterType.FIRST
        ? 1
        : semester.semesterType === $Enums.SemesterType.SECOND
          ? 2
          : 3

    const semesterOffset =
      (semester.schoolYear.startDate.getFullYear() -
        cls.trainingCourse.semesterStart.schoolYear.startDate.getFullYear()) *
        2 +
      semesterOrder

    console.log(
      "class",
      cls.name,
      cls.curriculumVersion?.name,
      semesterOffset,
      cls.trainingCourse.semesterStart.schoolYear.startDate.getFullYear()
    )

    const subjects = await prisma.subjectVersion.findMany({
      where: {
        trainingBlocks: {
          some: {
            trainingBlockOnCurriculumVersion: {
              curriculumVersionId: cls.curriculumVersionId,
            },
            semester: semesterOffset,
          },
        },
      },
      include: {
        trainingBlocks: {
          where: {
            trainingBlockOnCurriculumVersion: {
              curriculumVersionId: cls.curriculumVersionId,
            },
            semester: semesterOffset,
          },
          include: {
            trainingBlockOnCurriculumVersion: {
              include: {
                curriculumVersion: true,
              },
            },
          },
        },
      },
    })

    results.push({
      classId: cls.id,
      subjects,
    })
  }

  return results
}

const subjects = await getSubjectsToOpen("HK1_2526")
console.log("subjects", subjects)
