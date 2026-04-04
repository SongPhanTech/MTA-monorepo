import { getTemplateBuffer } from "@workspace/libs/server"
import type { $Enums } from "@workspace/db"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."

export async function exportThoiKhoaBieu({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  type,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  type?: $Enums.SubjectClassType
}) {
  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
    include: {
      schoolYear: true,
    },
  })

  const semesterTypeLabel = (() => {
    switch (semester.semesterType) {
      case "FIRST":
        return "Học kỳ 1"
      case "SECOND":
        return "Học kỳ 2"
      case "SUMMER":
        return "Học kỳ Hè"
      case "FIRST_SUPPLEMENTARY":
        return "Học kỳ phụ 1"
      case "SECOND_SUPPLEMENTARY":
        return "Học kỳ phụ 2"
      default:
        return semester.name
    }
  })()

  const schoolYearLabel = (() => {
    const start = new Date(semester.schoolYear.startDate).getFullYear()
    const end = start + 1
    return `${start} - ${end}`
  })()

  const semesterName = `${semesterTypeLabel.toUpperCase()}, NĂM HỌC ${schoolYearLabel}`

  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      semesterId,
      trainingObjectTypeId,
      ...(type ? { type } : {}),
      ...(trainingCourseId
        ? {
            OR: [{ fixedClasses: { some: { trainingCourseId } } }, { fixedClasses: { none: {} } }],
          }
        : {}),
      active: true,
      deletedAt: null,
    },
    include: {
      subject: {
        select: {
          code: true,
          codeTkb: true,
          name: true,
          credit: true,
        },
      },
      mainLecturer: {
        include: { userProfile: { select: { fullname: true } } },
      },
      extraLecturer: {
        include: { userProfile: { select: { fullname: true } } },
      },
      fixedClasses: {
        select: {
          _count: {
            select: {
              students: {
                where: { deletedAt: null, active: true, status: "ENROLLED" },
              },
            },
          },
        },
      },
      room: {
        select: {
          name: true,
        },
      },
      subjectClassTimes: {
        take: 1,
      },
    },
    orderBy: [{ subject: { code: "asc" } }, { code: "asc" }],
  })

  // Group by subject code
  const groupedBySubject = Object.groupBy(subjectClasses, (sc) => sc.subject.code)

  let subjectIndex = 0
  const data = Object.entries(groupedBySubject).flatMap(([_, classes = []]) => {
    subjectIndex++

    return classes.map((sc) => {
      const classTime = sc.subjectClassTimes[0]
      return {
        no: subjectIndex,
        subjectCode: sc.subject.codeTkb || sc.subject.code,
        subjectName: sc.subject.name,
        credit: sc.subject.credit,
        classCode: sc.code,
        lecturers: [sc.mainLecturer?.userProfile?.fullname, sc.extraLecturer?.userProfile?.fullname]
          .filter(Boolean)
          .join("; "),
        weekday: classTime?.dayOfWeek || "",
        period: classTime ? `${classTime.startPeriod} - ${classTime.endPeriod}` : "",
        room: sc.room?.name || "",
        maxStudent: sc.maxStudent,
      }
    })
  })

  const buffer = await getTemplateBuffer(prisma, "MAU2_DanSu_template.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    semesterName,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer
  return result
}
