import { TrainingObjectTypes } from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import {
  listStudentResultInfo,
  resultCourseStudentAcademicWarning,
  resultCourseStudentScholarship,
} from "./student-result.service"

export async function exportStudentProfile({ trainingCourseId }: { trainingCourseId: string }) {
  const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
    where: { id: trainingCourseId },
    select: {
      name: true,
      trainingObjectType: {
        select: { name: true, type: true },
      },
    },
  })

  const students = await prisma.student.findMany({
    where: { fixedClass: { trainingCourseId } },
    select: {
      registerNumber: true,
      doctoralCode: true,
      code: true,
      admissionCombination: true,
      entryScore: true,
      competencyScore: true,
      description: true,
      userProfile: {
        select: {
          fullname: true,
          dateOfBirth: true,
          idCardNumber: true,
          phoneNumber: true,
          gender: { select: { sTen: true } },
          ethnicity: { select: { sTen: true } },
          provinceHometown: { select: { sTen: true } },
          nationality: { select: { sTen: true } },
          officerNumber: true,
          rank: { select: { sTen: true } },
          chucVuChinhQuyen: { select: { sTen: true } },
        },
      },
      fixedClass: {
        select: {
          code: true,
          name: true,
          curriculumVersion: {
            select: {
              name: true,

              curriculum: {
                select: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                  managementOrganization: {
                    select: {
                      sTen: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      curriculumVersion: {
        select: {
          name: true,
          curriculum: {
            select: {
              trainingMajor: {
                include: {
                  trainingField: true,
                },
              },
              managementOrganization: {
                select: {
                  sTen: true,
                },
              },
            },
          },
        },
      },
      studentSemesterResult: {
        select: {
          cumulativeGpaBase10: true,
          cumulativeGpaBase4: true,
        },
        take: 1,
        orderBy: { semester: { startDate: "desc" } },
      },
    },
    orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
  })

  const TrainingObjectType = {
    [TrainingObjectTypes.MILITARY]: "Quân sự",
    [TrainingObjectTypes.CIVILIAN]: "Dân sự",
    [TrainingObjectTypes.INTERNATIONAL_MILITARY]: "Quốc tế",
  }

  const data = students.map((student, idx) => {
    const curriculumVersion = student.curriculumVersion || student.fixedClass?.curriculumVersion

    const dateOfBirth = student.userProfile.dateOfBirth
      ? dayjs(student.userProfile.dateOfBirth)
      : null

    return {
      no: idx + 1,
      registerNumber: student.registerNumber,
      doctoralCode: student.doctoralCode,
      code: student.code,
      fullname: student.userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${dateOfBirth?.format("DD/MM/YYYY")}` : "",
      gender: student.userProfile.gender?.sTen,
      ethnicity: student.userProfile.ethnicity?.sTen,
      nationality: student.userProfile.nationality?.sTen,
      provinceHometown: student.userProfile.provinceHometown?.sTen,
      idCardNumber: student.userProfile.idCardNumber,
      phoneNumber: student.userProfile.phoneNumber,
      admissionCombination: student.admissionCombination,
      entryScore: student.entryScore,
      competencyScore: student.competencyScore,
      fixedClassCode: student.fixedClass?.code,
      fixedClassName: student.fixedClass?.name,
      trainingField: curriculumVersion?.curriculum.trainingMajor?.trainingField?.name,
      trainingMajor: curriculumVersion?.curriculum.trainingMajor?.name,
      curriculum: curriculumVersion?.name,
      curriculumOrg: curriculumVersion?.curriculum.managementOrganization.sTen,
      trainingObjectType:
        TrainingObjectType[trainingCourse.trainingObjectType.type || TrainingObjectTypes.MILITARY],
      officerNumber: student.userProfile.officerNumber,
      rank: student.userProfile.rank?.sTen,
      chucvu: student.userProfile.chucVuChinhQuyen?.sTen,

      description: student.description,
      gpaBase10: student.studentSemesterResult?.[0]?.cumulativeGpaBase10?.toNumber(),
      gpaBase4: student.studentSemesterResult?.[0]?.cumulativeGpaBase4?.toNumber(),
    }
  })

  const buffer = await getTemplateBuffer(prisma, "DANH_SACH_SV")

  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    trainingCourse: trainingCourse.name,
    trainingObjectType: trainingCourse.trainingObjectType.name,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}

export const exportStudentScholarship = async ({
  semesterId,
  trainingObjectTypeId,
}: {
  semesterId: string
  trainingObjectTypeId: string
}) => {
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)

  if (!students || students.length === 0) {
    throw new Error("Không có sinh viên nào trong danh sách")
  }

  const filteredCourseStudents = await resultCourseStudentScholarship(students, semesterId)

  // Flatten data
  const rows = []
  let stt = 1
  for (const courseItem of filteredCourseStudents) {
    for (const student of courseItem.students) {
      // Check if student has scholarships
      if (student.hasScholarship && student.scholarship && student.scholarship.length > 0) {
        // Get general student info
        const studentName =
          (student.userProfile as any)?.fullname ||
          (student.studentSemesterResult as any)?.studentName ||
          ""
        const studentCode = student.code || ""
        const dob = (student.userProfile as any)?.dateOfBirth
          ? dayjs((student.userProfile as any).dateOfBirth).format("DD/MM/YYYY")
          : ""
        const courseName = courseItem.courseName
        const classCode = student.fixedClass?.code || ""

        const trainingMajor = student.trainingMajor

        // Semester Result info
        const result: any = student.studentSemesterResult
        const semester = result?.semesterIndexInCourse || ""
        const gpaSemester = result?.gpaBase10 || 0
        // const academicClassification = result?.rank?.classification || ''

        const note = student.reason || ""

        for (const scholarship of student.scholarship) {
          rows.push({
            stt: stt++,
            studentCode,
            studentName,
            dob,
            trainingMajor,
            courseName,
            classCode,
            semester,
            gpaSemester,
            // academicClassification,
            scholarshipName: scholarship.name,
            note,
          })
        }
      }
    }
  }

  if (rows.length === 0) {
    throw new Error("Không có dữ liệu học bổng để xuất")
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Danh sách học bổng")

  worksheet.columns = [
    { header: "STT", key: "stt", width: 10 },
    { header: "Mã học viên", key: "studentCode", width: 15 },
    { header: "Tên học viên", key: "studentName", width: 25 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "Chuyên ngành", key: "trainingMajor", width: 25 },
    { header: "Khoá", key: "courseName", width: 15 },
    { header: "Lớp", key: "classCode", width: 15 },
    { header: "Kỳ đang học", key: "semester", width: 15 },
    { header: "Trung bình học kỳ", key: "gpaSemester", width: 18 },
    // { header: 'Xếp loại học tập', key: 'academicClassification', width: 20 },
    { header: "Học bổng", key: "scholarshipName", width: 25 },
    { header: "Ghi chú", key: "note", width: 30 },
  ]

  // Style header
  worksheet.getRow(1).font = { bold: true }

  worksheet.addRows(rows)

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

export const exportStudentAcademicWarning = async ({
  semesterId,
  trainingObjectTypeId,
}: {
  semesterId: string
  trainingObjectTypeId: string
}) => {
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)

  if (!students || students.length === 0) {
    throw new Error("Không có sinh viên nào trong danh sách")
  }

  const filteredCourseStudents = await resultCourseStudentAcademicWarning(students, semesterId)

  const approvedWarnings = await prisma.academicWarning.findMany({
    where: {
      semesterId: semesterId,
    },
    select: {
      studentId: true,
    },
  })

  const approvedStudentIds = new Set(approvedWarnings.map((w) => w.studentId))

  const rows = []
  for (const courseItem of filteredCourseStudents) {
    for (const student of courseItem.students) {
      if (approvedStudentIds.has(student.id)) {
        continue
      }

      // Get general student info
      const studentName =
        (student.userProfile as any)?.fullname ||
        (student.studentSemesterResult as any)?.studentName ||
        ""
      const dob = (student.userProfile as any)?.dateOfBirth
        ? dayjs((student.userProfile as any).dateOfBirth).format("DD/MM/YYYY")
        : ""
      const studentCode = student.code || ""
      const className = student.fixedClass?.name || ""
      const courseName = courseItem.courseName

      // Semester Result info
      const result: any = student.studentSemesterResult
      const gpaSemester = result?.gpaBase10 || 0
      const trainingPoint = result?.conductScore || 0

      // Reason for warning
      const reason = student.reason || ""

      rows.push({
        studentCode,
        studentName,
        dob,
        className,
        courseName,
        gpaSemester,
        trainingPoint,
        reason,
      })
    }
  }

  if (rows.length === 0) {
    throw new Error("Không có dữ liệu cảnh báo học tập để xuất")
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Danh sách cảnh báo học tập")

  worksheet.columns = [
    { header: "Mã SV", key: "studentCode", width: 15 },
    { header: "Họ và tên", key: "studentName", width: 25 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "Lớp", key: "className", width: 15 },
    { header: "Khoá", key: "courseName", width: 15 },
    { header: "ĐTB Học kỳ", key: "gpaSemester", width: 15 },
    { header: "ĐRL", key: "trainingPoint", width: 10 },
    // { header: 'Xếp loại HT', key: 'academicClassification', width: 15 },
    { header: "Lý do", key: "reason", width: 40 },
  ]

  // Style header
  worksheet.getRow(1).font = { bold: true }

  worksheet.addRows(rows)

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

export async function _generateStudentImportTemplate(
  trainingObjectTypeId: string
): Promise<ArrayBuffer> {
  const [fixedClasses, curricula, organizations, trainingMajors, trainingFields] =
    await Promise.all([
      prisma.fixedClass.findMany({
        where: { active: true, trainingCourse: {
          trainingObjectTypeId,
          active: true,
          deletedAt: null
        }, deletedAt: null },
        select: { code: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.curriculumVersion.findMany({
        where: {trainingObjectTypeId, active: true, deletedAt: null },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.dM_DonVi.findMany({
        where: { bActive: true, bDeleted: false },
        select: { sTen: true },
        orderBy: { sTen: "asc" },
      }),
      prisma.trainingMajor.findMany({
        where: { 
          trainingObjectTypes: {
            some: {
              trainingObjectTypeId,
              deletedAt: null,
              active: true
            }
          }, 
          deletedAt: null 
        },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.trainingField.findMany({
        where: { 
          trainingObjectTypes: {
            some: {
              trainingObjectTypeId,
              deletedAt: null,
              active: true
            }
          }, 
          deletedAt: null 
        },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ])

  const buffer = await getTemplateBuffer(prisma, "MauImportDSHV_v4.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute("DanhMucLopQuanLi", {
    team: fixedClasses.map((fc) => ({ ma: fc.code || "", ten: fc.name })),
  })

  template.substitute("DanhMucChuongTrinhDaoTao", {
    team: curricula.map((c) => ({ ten: c.name })),
  })

  template.substitute("DanhMucChuyenNganh", {
    team: trainingMajors.map((tm) => ({ ten: tm.name })),
  })

  template.substitute("DanhMucNganh", {
    team: trainingFields.map((tf) => ({ ten: tf.name })),
  })

  template.substitute("DanhMucDonViQuanLi", {
    team: organizations.map((o) => ({ ten: o.sTen })),
  })

  return template.generate({ type: "nodebuffer" }) as any
}

export const exportArchivedCertificate = async ({
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
  certificateId,
}: {
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
  certificateId?: string
}) => {
  const where: any = {
    deletedAt: null,
    student: {
      fixedClass: {
        trainingCourse: {
          trainingObjectTypeId,
          deletedAt: null,
          active: true,
        },
      },
    },
  }

  if (trainingCourseId) {
    where.student.fixedClass.trainingCourseId = trainingCourseId
  }

  if (fixedClassId) {
    where.student.fixedClassId = fixedClassId
  }

  if (certificateId) {
    where.certificateId = certificateId
  }

  const archivedCertificates = await prisma.archivedCertificate.findMany({
    where,
    include: {
      certificate: true,
      student: {
        include: {
          userProfile: true,
          fixedClass: {
            include: {
              trainingCourse: true,
              curriculumVersion: {
                include: {
                  curriculum: {
                    include: {
                      trainingMajor: {
                        include: {
                          trainingField: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (!archivedCertificates || archivedCertificates.length === 0) {
    throw new Error("Không có dữ liệu điểm chứng chỉ để xuất")
  }

  // Map status
  const statusMap: Record<string, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCEL: "Đã huỷ",
  }

  // Flatten data
  const data = archivedCertificates.map((item, idx) => {
    const student = item.student
    const userProfile = student?.userProfile
    const fixedClass = student?.fixedClass
    const curriculum = fixedClass?.curriculumVersion?.curriculum
    const trainingMajor = curriculum?.trainingMajor

    return {
      no: idx + 1,
      studentName: userProfile?.fullname || "",
      dateOfBirth: userProfile?.dateOfBirth
        ? `'${dayjs(userProfile.dateOfBirth).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}`
        : "",
      placeOfBirth: userProfile?.placeOfBirth || "",
      idCardNumber: userProfile?.idCardNumber || "",
      fixedClass: fixedClass?.name || "",
      trainingCourse: fixedClass?.trainingCourse?.name || "",
      trainingMajorName: trainingMajor?.name || "",
      certificateName: item.certificate?.name || "",
      listening: item.listeningScore || "",
      speaking: item.speakingScore || "",
      reading: item.readingScore || "",
      writing: item.writingScore || "",
      score: item.score ?? "",
      issuedDate: item.issuedDate
        ? `'${dayjs(item.issuedDate).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}`
        : "",
      issuedBy: item.issuedBy || "",
    }
  })

  const buffer = await getTemplateBuffer(prisma, "DIEM_CHUNG_CHI.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer
  return result
}

export const exportArchivedCertificateMulti = async ({
  trainingObjectTypeId,
  trainingCourseIds,
  certificateIds,
}: {
  trainingObjectTypeId: string
  trainingCourseIds: string[]
  certificateIds: string[]
}) => {
  if (!trainingCourseIds.length) {
    throw new Error("Vui lòng chọn ít nhất một khoá học")
  }

  const selectedCertificates = await prisma.certificate.findMany({
    where: {
      deletedAt: null,
      active: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  const certificateMap = new Map(selectedCertificates.map((item) => [item.id, item.name]))
  const orderedCertificates = selectedCertificates.filter(
    (item): item is { id: string; name: string } => !!item.name
  )

  const archivedCertificates = await prisma.archivedCertificate.findMany({
    where: {
      deletedAt: null,
      student: {
        fixedClass: {
          trainingCourseId: { in: trainingCourseIds },
          trainingCourse: {
            trainingObjectTypeId,
            deletedAt: null,
            active: true,
          },
        },
      },
    },
    select: {
      studentId: true,
      certificateId: true,
      issuedDate: true,
      issuedBy: true,
      createdAt: true,
    },
    orderBy: [{ student: { userProfile: { fullname: "asc" } } }, { createdAt: "desc" }],
  })

  const students = await prisma.student.findMany({
    where: {
      deletedAt: null,
      fixedClass: {
        trainingCourseId: { in: trainingCourseIds },
        trainingCourse: {
          trainingObjectTypeId,
          deletedAt: null,
          active: true,
        },
      },
    },
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: true,
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ fixedClass: { name: "asc" } }, { userProfile: { fullname: "asc" } }],
  })

  if (!students.length) {
    throw new Error("Không có dữ liệu sinh viên để xuất")
  }

  const archivedByStudent = new Map<
    string,
    {
      issuedDate: Date | null
      issuedBy: string
      scores: Record<string, true>
    }
  >()

  for (const archived of archivedCertificates) {
    const currentState = archivedByStudent.get(archived.studentId)

    if (!currentState) {
      archivedByStudent.set(archived.studentId, {
        issuedDate: archived.issuedDate || null,
        issuedBy: archived.issuedBy || "",
        scores: {
          [archived.certificateId]: true,
        },
      })
      continue
    }

    currentState.scores[archived.certificateId] = true
  }

  const data = students.map((student, idx) => {
    const userProfile = student.userProfile
    const fixedClass = student.fixedClass
    const curriculum = fixedClass?.curriculumVersion?.curriculum
    const trainingMajor = curriculum?.trainingMajor
    const archivedState = archivedByStudent.get(student.id)
    const scoresArray = orderedCertificates.map((cert) =>
      archivedState?.scores[cert.id] ? "Có" : "Không"
    )

    return {
      no: idx + 1,
      studentName: userProfile?.fullname || "",
      dateOfBirth: userProfile?.dateOfBirth
        ? `'${dayjs(userProfile.dateOfBirth).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}`
        : "",
      placeOfBirth: userProfile?.placeOfBirth || "",
      idCardNumber: userProfile?.idCardNumber || "",
      fixedClass: fixedClass?.name || "",
      trainingCourse: fixedClass?.trainingCourse?.name || "",
      trainingMajorName: trainingMajor?.name || "",
      issuedDate: archivedState?.issuedDate
        ? `'${dayjs(archivedState.issuedDate).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}`
        : "",
      issuedBy: archivedState?.issuedBy || "",
      scores: scoresArray,
    }
  })

  const certNames = orderedCertificates.map((cert) => cert.name)

  const buffer = await getTemplateBuffer(prisma, "DIEM_CHUNG_CHI_MULTI.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    data,
    certNames: certNames,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer
  return result
}
export const exportStudentsMissingCertificate = async ({
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
  certificateId,
}: {
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
  certificateId?: string
}) => {
  const where: any = {
    deletedAt: null,
    fixedClass: {
      trainingCourse: {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      },
    },
  }

  if (trainingCourseId) {
    where.fixedClass.trainingCourseId = trainingCourseId
  }

  if (fixedClassId) {
    where.fixedClassId = fixedClassId
  }

  if (certificateId) {
    where.archivedCertificate = {
      none: {
        certificateId,
        deletedAt: null,
      },
    }
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: true,
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ fixedClass: { name: "asc" } }, { userProfile: { fullname: "asc" } }],
  })

  if (!students || students.length === 0) {
    throw new Error("Không có dữ liệu học viên chưa có chứng chỉ để xuất")
  }

  let certificateName = ""
  if (certificateId) {
    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { name: true },
    })
    certificateName = cert?.name || ""
  }

  const data = students.map((item, idx) => {
    const userProfile = item.userProfile
    const fixedClass = item.fixedClass
    const curriculum = fixedClass?.curriculumVersion?.curriculum
    const trainingMajor = curriculum?.trainingMajor

    return {
      no: idx + 1,
      studentCode: userProfile?.code || "",
      studentName: userProfile?.fullname || "",
      dateOfBirth: userProfile?.dateOfBirth
        ? `'${dayjs(userProfile.dateOfBirth).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}`
        : "",
      fixedClass: fixedClass?.name || "",
      trainingCourse: fixedClass?.trainingCourse?.name || "",
      trainingField: trainingMajor?.trainingField?.name || "",
      trainingMajorName: trainingMajor?.name || "",
      placeOfBirth: userProfile?.placeOfBirth || "",
      idCardNumber: userProfile?.idCardNumber || "",
      certificateName: certificateName || "Tất cả",
      status: "Chưa có",
    }
  })

  const buffer = await getTemplateBuffer(prisma, "DS_CHUA_CO_DIEM_CHUNG_CHI.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    data,
    certificateName: certificateName || "Tất cả",
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer
  return result
}
