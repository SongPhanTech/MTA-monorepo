import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import { HTTPException } from "hono/http-exception"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."

// ${semester}	Name of the semester.
// ${trainingObjectType}	 Name of the Training Object Type (e.g. Quân sự, Dân sự).

// ${table:data.no}	Sequential number (STT).
// ${table:data.code}	Student Code (Mã học viên).
// ${table:data.fullname}	Full name (Họ và tên).
// ${table:data.dateOfBirth}	Date of birth (DD/MM/YYYY).
// ${table:data.fixedClass}	Class code (Lớp).
// ${table:data.trainingCourse}	Training Course name (Khóa).
// ${table:data.studyYear}	Study Year (Năm học thứ).
// ${table:data.semesterIndexInCourse}	Semester index (Học kỳ thứ).
// ${table:data.gpaBase10}	GPA Base 10 (TBCHK hệ 10).
// ${table:data.cumulativeGpaBase10}	Cumulative GPA Base 10 (TL hệ 10).
// ${table:data.gpaBase4}	GPA Base 4 (TBCHK hệ 4).
// ${table:data.cumulativeGpaBase4}	Cumulative GPA Base 4 (TL hệ 4).
// ${table:data.conductScore}	Conduct Score (ĐRL).
// ${table:data.studentTrainingType}	Student Training Type (Xếp loại rèn luyện).
// ${table:data.rank}	Academic Rank (Xếp loại học lực).
// ${table:data.lowestFinalScore}	Lowest Final Score (Điểm thấp nhất).
// ${table:data.totalCredits}	Total Credits in Semester (TC đăng ký).
// ${table:data.retakingCredits}	Retaking Credits (TC học lại).
// ${table:data.reExamCredits}	Re-exam Credits (TC thi lại).
// ${table:data.passedCredits}	Passed Credits (TC đạt).
// ${table:data.failedCredits}	Failed Credits (TC nợ kỳ này).
// ${table:data.accumulatedCredits}	Accumulated Credits (TC tích lũy).
// ${table:data.totalCreditsByCurriculum}	Total Credits by Curriculum (TC theo CTĐT).
// ${table:data.totalFailedCredits}	Total Failed Credits (TC nợ tích lũy).
// ${table:data.foreignLangPass}	Foreign Language Pass status (Đạt chuẩn NN).
// ${table:data.academicWarningLevel}	Academic Warning Level (Mức CC học vụ).
// ${table:data.disciplinaryWarningLevel}	Disciplinary Warning Level (Mức CC rèn luyện).
// ${table:data.note}	Note (Ghi chú - e.g., Học cải thiện, Tạm hoãn, Đình chỉ...).
export async function exportStudentSemesterResult({
  semesterId,
  trainingObjectTypeId,
}: {
  semesterId: string
  trainingObjectTypeId: string
}) {
  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
  })

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
  })

  const studentSemesterResults = await prisma.studentSemesterResult.findMany({
    where: {
      semesterId,
      student: {
        fixedClass: {
          trainingCourse: {
            trainingObjectTypeId,
          },
        },
      },
    },
    include: {
      student: {
        select: {
          code: true,
          userProfile: {
            select: {
              fullname: true,
              dateOfBirth: true,
            },
          },
          fixedClass: {
            select: {
              code: true,
              name: true,
              trainingCourse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const data = studentSemesterResults.map((result, idx) => {
    const student = result.student
    const userProfile = student.userProfile
    const dateOfBirth = userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : null

    return {
      no: idx + 1,
      code: student.code,
      fullname: userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${dateOfBirth.format("DD/MM/YYYY")}` : "",
      fixedClass: student.fixedClass?.code,
      trainingCourse: student.fixedClass?.trainingCourse?.name,

      // StudentSemesterResult Data
      studyYear: result.studyYear,
      semesterIndexInCourse: result.semesterIndexInCourse,
      gpaBase4: result.gpaBase4?.toNumber(),
      cumulativeGpaBase4: result.cumulativeGpaBase4?.toNumber(),
      gpaBase10: result.gpaBase10?.toNumber(),
      cumulativeGpaBase10: result.cumulativeGpaBase10?.toNumber(),
      conductScore: result.conductScore,
      studentTrainingType: result.studentTrainingType,
      lowestFinalScore: result.lowestFinalScore,
      totalCredits: result.totalCredits,
      registeredCredits: result.registeredCredits,
      retakingCredits: result.retakingCredits,
      reExamCredits: result.reExamCredits,
      passedCredits: result.passedCredits,
      failedCredits: result.failedCredits,
      accumulatedCredits: result.accumulatedCredits,
      totalCreditsByCurriculum: result.totalCreditsByCurriculum,
      totalFailedCredits: result.totalFailedCredits,
      foreignLangPass: result.foreignLangPass ? "Đạt" : "Không đạt",
      academicWarningLevel: result.academicWarningLevel,
      disciplinaryWarningLevel: result.disciplinaryWarningLevel,
      note: result.isImproving
        ? "Học cải thiện"
        : result.postponeWithReason
          ? "Tạm hoãn"
          : result.suspended
            ? "Đình chỉ"
            : result.expelled
              ? "Buộc thôi học"
              : "",
    }
  })

  // Use 'KET_QUA_HOC_TAP_HK' template or fallback if needed.
  // Assuming the template exists based on requirements.
  const buffer = await getTemplateBuffer(prisma, "KET_QUA_HOC_TAP_HK.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    semester: semester.name,
    trainingObjectType: trainingObjectType.name,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}

// ${schoolYear}	Name of the school year.
// ${trainingObjectType}	 Name of the Training Object Type.

// ${table:data.no}	Sequential number (STT).
// ${table:data.code}	Student Code.
// ${table:data.fullname}	Full name.
// ${table:data.dateOfBirth}	Date of birth.
// ${table:data.fixedClass}	Class code.
// ${table:data.trainingCourse}	Training Course.
// ${table:data.studyYear}	Study Year.
// ${table:data.gpaBase10}	GPA Base 10.
// ${table:data.cumulativeGpaBase10}	Cumulative GPA Base 10.
// ${table:data.gpaBase4}	GPA Base 4.
// ${table:data.cumulativeGpaBase4}	Cumulative GPA Base 4.
// ${table:data.conductScore}	Conduct Score.
// ${table:data.studentTrainingType}	Student Training Type.
// ${table:data.rank}	Academic Rank.
// ${table:data.lowestFinalScore}	Lowest Final Score.
// ${table:data.totalCredits}	Total Credits.
// ${table:data.retakingCredits}	Retaking Credits.
// ${table:data.reExamCredits}	Re-exam Credits.
// ${table:data.failedCredits}	Failed Credits.
// ${table:data.academicWarningLevel}	Academic Warning Level.
// ${table:data.disciplinaryWarningLevel}	Disciplinary Warning Level.
// ${table:data.note}	Note.
export async function exportStudentYearResult({
  semesterId,
  schoolYearId,
  trainingObjectTypeId,
}: {
  semesterId?: string
  schoolYearId?: string
  trainingObjectTypeId: string
}) {
  const schoolYear = await prisma.schoolYear.findFirst({
    where: {
      OR: [
        { id: schoolYearId },
        {
          semesters: {
            some: {
              id: semesterId,
            },
          },
        },
      ],
    },
  })

  if (!schoolYear) {
    throw new HTTPException(404, { message: "Không tìm thấy năm học" })
  }

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
  })

  const studentYearResults = await prisma.studentYearResult.findMany({
    where: {
      schoolYearId: schoolYear.id,
      student: {
        curriculumVersion: {
          trainingObjectTypeId,
        },
      },
    },
    include: {
      student: {
        select: {
          code: true,
          userProfile: {
            select: {
              fullname: true,
              dateOfBirth: true,
            },
          },
          fixedClass: {
            select: {
              code: true,
              name: true,
              trainingCourse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      rank: true,
    },
  })

  const formatGpa = (val: any) => {
    const num = typeof val?.toNumber === "function" ? val.toNumber() : val
    if (num === null || num === undefined || isNaN(num)) return ""
    return num.toFixed(2).replace(".", ",")
  }

  const data = studentYearResults.map((result, idx) => {
    const student = result.student
    const userProfile = student.userProfile
    const dateOfBirth = userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : null

    return {
      no: idx + 1,
      code: student.code,
      fullname: userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${dateOfBirth.format("DD/MM/YYYY")}` : "",
      fixedClass: student.fixedClass?.code,
      trainingCourse: student.fixedClass?.trainingCourse?.name,
      // StudentYearResult Data
      studyYear: result.studyYear,
      gpaBase4: formatGpa(result.gpaBase4),
      cumulativeGpaBase4: formatGpa(result.cumulativeGpaBase4),
      gpaBase10: formatGpa(result.gpaBase10),
      cumulativeGpaBase10: formatGpa(result.cumulativeGpaBase10),
      conductScore: formatGpa(result.conductScore),
      studentTrainingType: result.studentTrainingType,
      rank: result.rank?.classification,
      lowestFinalScore: formatGpa(result.lowestFinalScore),
      totalCredits: result.totalCredits,
      retakingCredits: result.retakingCredits,
      reExamCredits: result.reExamCredits,
      failedCredits: result.failedCredits,

      academicWarningLevel: result.academicWarningLevel,
      disciplinaryWarningLevel: result.disciplinaryWarningLevel,
      note: result.suspended ? "Đình chỉ" : result.expelled ? "Buộc thôi học" : "",
    }
  })

  // Use 'KET_QUA_HOC_TAP_NAM.xlsx' template
  const buffer = await getTemplateBuffer(prisma, "KET_QUA_HOC_TAP_NAM.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    schoolYear: schoolYear.name,
    trainingObjectType: trainingObjectType.name,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}
