import { TrainingObjectTypes } from "@workspace/db"
import PizZip from "pizzip"
import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import type { Alignment } from "exceljs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import {
  listStudentResultInfo,
  resultCourseStudentAcademicWarning,
  resultCourseStudentScholarship,
} from "./student-result.service"
import { renderXlsxTemplate, loadTemplateBuffer } from "./render-xlsx-template"

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
          newProvinceOfBirth: {
            select: {
              sTen: true,
            },
          },
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

  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { schoolYear: true }
  })
  const semesterName = semester?.name || ""
  const schoolYear = semester?.schoolYear?.name || ""

  const now = dayjs()
  const reportDate = now.format("D/M/YYYY")

  const mapTrainingType = (type?: string | null) => {
    if (!type) return ""
    switch (type) {
      case "EXCELLENT": return "Xuất sắc"
      case "GOOD": return "Tốt"
      case "FAIR": return "Khá"
      case "MEDIUM": return "Trung bình khá"
      case "AVERAGE": return "Trung bình"
      case "POOR": return "Yếu"
      case "VERY_POOR": return "Kém"
      default: return type
    }
  }

  const getConductLabel = (type?: string | null, score?: number | null) => {
    if (type) return mapTrainingType(type)
    if (score !== undefined && score !== null) {
      const val = score > 10 ? score / 10 : score
      if (val >= 9) return "Xuất sắc"
      if (val >= 8) return "Tốt"
      if (val >= 6.5) return "Khá"
      if (val >= 5) return "Trung bình"
      return "Yếu"
    }
    return ""
  }

  const formatScholarshipName = (name: string) => {
    if (name.includes("Lê Quý Đôn")) return "Lê Quý Đôn"
    if (name.includes("loại A") || name.includes("Loại A")) return "Loại A"
    if (name.includes("loại B") || name.includes("Loại B")) return "Loại B"
    if (name.includes("loại C") || name.includes("Loại C")) return "Loại C"
    return name
  }

  const allTypes = new Set<string>()
  for (const courseItem of filteredCourseStudents) {
    for (const student of courseItem.students) {
      if (student.hasScholarship && student.scholarship?.length > 0) {
        const firstSchName = student.scholarship[0]?.name || ""
        const type = formatScholarshipName(firstSchName) || "Khác"
        allTypes.add(type)
      }
    }
  }

  const sortedTypes = Array.from(allTypes).sort((a, b) => {
    const order: Record<string, number> = { "Lê Quý Đôn": 1, "Loại A": 2, "Loại B": 3, "Loại C": 4 }
    return (order[a] || 99) - (order[b] || 99)
  })

  if (sortedTypes.length === 0) {
    throw new Error("Không có dữ liệu học bổng để xuất")
  }

  const rawTemplateBuffer = await loadTemplateBuffer(prisma, "/mta/template/DanhSachDeNghiXetHocBong.xlsx")

  const sheetsInput = []
  for (const type of sortedTypes) {
    const rows = []
    for (const courseItem of filteredCourseStudents) {
      const groupStudents = courseItem.students.filter((student) => {
        if (!student.hasScholarship || !student.scholarship || student.scholarship.length === 0) return false
        const firstSchName = student.scholarship[0]?.name || ""
        return formatScholarshipName(firstSchName) === type
      })
      if (groupStudents.length === 0) continue

      rows.push({
        stt: courseItem.courseName,
        studentName: "",
        classCode: "",
        department: "",
        gpa10: "",
        gpa4: "",
        bonusPoints: "",
        conduct: "",
        foreignLanguageReq: "",
        foreignLanguageActual: "",
        scholarshipType: "",
        note: "",
      })

      let idx = 1
      for (const student of groupStudents) {
        const studentName =
          (student.userProfile as any)?.fullname ||
          (student.studentSemesterResult as any)?.studentName ||
          ""
        const classCode = student.fixedClass?.code || ""
        const studentDb = await prisma.student.findUnique({
          where: { id: student.id },
          select: {
            foreignLanguage: true,
            department: true,
            studentSemesterResult: {
              where: { semesterId },
              select: {
                studentTrainingType: true,
                conductScore: true
              }
            },
            fixedClass: {
              select: {
                classMonitorId: true,
                unionSecretaryId: true,
                unionLeaderId: true,
                deputyUnionSecretaryId: true,
                managementOrganization: {
                  select: { sMa: true }
                }
              }
            }
          }
        })

        const department = studentDb?.fixedClass?.managementOrganization?.sMa || studentDb?.department || ""
        const foreignLanguage = studentDb?.foreignLanguage || ""

        const result: any = student.studentSemesterResult
        const gpa10 = result?.gpaBase10 ? Number(result.gpaBase10).toFixed(2) : "0.00"
        const gpa4 = result?.gpaBase4 ? Number(result.gpaBase4).toFixed(2) : "0.00"

        const fixedClass = studentDb?.fixedClass
        const positions = []
        if (fixedClass?.classMonitorId === student.id) positions.push("Lt")
        if (fixedClass?.unionSecretaryId === student.id) positions.push("BTCĐ")
        if (fixedClass?.unionLeaderId === student.id) positions.push("BTLCĐ")
        if (fixedClass?.deputyUnionSecretaryId === student.id) positions.push("Phó BTLCĐ")
        const bonusPoints = positions.join(", ")

        const conduct = getConductLabel(
          studentDb?.studentSemesterResult?.[0]?.studentTrainingType,
          studentDb?.studentSemesterResult?.[0]?.conductScore
        )

        const firstSchName = student.scholarship[0]?.name || ""
        const scholarshipType = formatScholarshipName(firstSchName)
        const note = foreignLanguage || student.reason || ""

        rows.push({
          stt: idx++,
          studentName,
          classCode,
          department,
          gpa10,
          gpa4,
          bonusPoints,
          conduct,
          foreignLanguageReq: "",
          foreignLanguageActual: "",
          scholarshipType,
          note,
        })
      }
    }

    if (rows.length > 0) {
      sheetsInput.push({
        sheetName: `Học bổng ${type}`,
        data: {
          semesterName: semesterName.toUpperCase(),
          schoolYear: schoolYear,
          reportDate,
          data: rows,
        },
      })
    }
  }

  if (sheetsInput.length === 0) {
    throw new Error("Không có dữ liệu học bổng để xuất")
  }

  const templateBuffer = await renderXlsxTemplate(prisma, {
    templatePath: "/mta/template/DanhSachDeNghiXetHocBong.xlsx",
    sheets: sheetsInput,
  })

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer as any)

  const NOTE_COL_WIDTH = 45

  workbook.worksheets.forEach((worksheet) => {
    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
      printTitlesRow: "1:6",
    }

    worksheet.getColumn(12).width = NOTE_COL_WIDTH

    const rowCount = worksheet.rowCount
    for (let rowNumber = 7; rowNumber <= rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const valA = row.getCell(1).value
      const valB = row.getCell(2).value
      const strA = valA ? valA.toString().trim() : ""
      const strB = valB ? valB.toString().trim() : ""
      const valC = row.getCell(3).value
      const strC = valC ? valC.toString().trim() : ""

      if (strA.startsWith("*") || strA.startsWith("-") || strA.startsWith("Đã")) {
        continue
      }

      const isGroupHeader = strA && !strB && !strC

      if (isGroupHeader) {
        try {
          worksheet.mergeCells(rowNumber, 1, rowNumber, 12)
        } catch (err) {
        }
        row.height = 24

        for (let col = 1; col <= 12; col++) {
          const cell = row.getCell(col)
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: col === 1 ? { style: "thin" } : undefined,
            right: col === 12 ? { style: "thin" } : undefined,
          }
          cell.font = { name: "Times New Roman", size: 11, bold: true, italic: true }
          cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
        }
      } else {
        if (strA || strB || strC) {
          let maxLines = 1
          for (let col = 1; col <= 12; col++) {
            const cell = row.getCell(col)
            let cellAlignment: Partial<Alignment> = { vertical: "middle", horizontal: "center" }
            
            if (col === 2) {
              cellAlignment = { vertical: "middle", horizontal: "left", wrapText: true }
            } else if (col === 12) {
              cellAlignment = { vertical: "top", horizontal: "left", wrapText: true }
              const text = cell.value ? cell.value.toString() : ""
              if (text) {
                const segments = text.split("\n")
                let totalLines = 0
                for (const seg of segments) {
                  totalLines += Math.max(1, Math.ceil(seg.length / NOTE_COL_WIDTH))
                }
                if (totalLines > maxLines) maxLines = totalLines
              }
            }

            cell.style = {
              font: { name: "Times New Roman", size: 11, bold: false },
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
              },
              alignment: cellAlignment
            }
          }
          row.height = Math.max(22, maxLines * 15)
        }
      }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const finalBuffer = preserveDrawings(rawTemplateBuffer as Buffer, Buffer.from(buffer))
  return finalBuffer
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
  const [fixedClasses, curricula, organizations, trainingMajors, trainingFields, trainingObjectType] =
    await Promise.all([
      prisma.fixedClass.findMany({
        where: {
          active: true,
          trainingCourse: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
          },
          deletedAt: null,
        },
        select: { code: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.curriculumVersion.findMany({
        where: { trainingObjectTypeId, active: true, deletedAt: null },
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
              active: true,
            },
          },
          deletedAt: null,
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
              active: true,
            },
          },
          deletedAt: null,
        },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.trainingObjectType.findUniqueOrThrow({
        where: { id: trainingObjectTypeId },
        select: { name: true },
      }),
    ])

  const buffer = await getTemplateBuffer(prisma, "MauImportDSHV_v4.xlsx")
  const template = new XlsxTemplate(buffer)

  const safeSubstitute = (sheetName: string, data: Record<string, unknown>) => {
    try {
      template.substitute(sheetName, data)
    } catch (e) {
      console.warn(`[_generateStudentImportTemplate] Không thể map sheet "${sheetName}":`, e)
    }
  }

  safeSubstitute("HỌC VIÊN, SINH VIÊN", {
    doituongdaotao: trainingObjectType.name,
  })
  safeSubstitute("DoiTuongDaoTao", {
    team: [{ ten: trainingObjectType.name }],
  })
  safeSubstitute("DanhMucLopQuanLi", {
    team: fixedClasses.map((fc) => ({ ma: fc.code || "", ten: fc.name })),
  })
  safeSubstitute("DanhMucChuongTrinhDaoTao", {
    team: curricula.map((c) => ({ ten: c.name })),
  })
  safeSubstitute("DanhMucChuyenNganh", {
    team: trainingMajors.map((tm) => ({ ten: tm.name })),
  })
  safeSubstitute("DanhMucNganh", {
    team: trainingFields.map((tf) => ({ ten: tf.name })),
  })
  safeSubstitute("DanhMucDonViQuanLi", {
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

function ensureContentType(contentTypesXml: string, partName: string, contentType: string) {
  if (contentTypesXml.includes(`PartName="${partName}"`)) {
    return contentTypesXml
  }
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`
  )
}

function getMediaContentType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "png": return "image/png"
    case "jpg":
    case "jpeg": return "image/jpeg"
    case "gif": return "image/gif"
    case "svg": return "image/svg+xml"
    case "emf": return "image/x-emf"
    default: return "application/octet-stream"
  }
}

function preserveDrawings(templateBuffer: Buffer, outputBuffer: Buffer): Buffer {
  try {
    const templateZip = new PizZip(templateBuffer)
    const outputZip = new PizZip(outputBuffer)
    let contentTypesXml = outputZip.file("[Content_Types].xml")?.asText() ?? ""

    const sheetRelsFile = templateZip.file("xl/worksheets/_rels/sheet1.xml.rels")
    if (!sheetRelsFile) return outputBuffer

    const sheetRelsXml = sheetRelsFile.asText()
    const drawingMatches = [...sheetRelsXml.matchAll(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/g)]
    if (drawingMatches.length === 0) return outputBuffer

    const allOutputFiles = Object.keys(outputZip.files)
    const sheetFiles = allOutputFiles.filter((name) => name.match(/^xl\/worksheets\/sheet\d+\.xml$/))

    for (const sheetFile of sheetFiles) {
      const sheetIndexMatch = sheetFile.match(/sheet(\d+)\.xml/)
      if (!sheetIndexMatch) continue
      const idx = sheetIndexMatch[1]

      const outputRelsFileName = `xl/worksheets/_rels/sheet${idx}.xml.rels`
      const outputRelsFile = outputZip.file(outputRelsFileName)
      let outputRelsXml = outputRelsFile?.asText() ??
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

      let maxRid = 0
      for (const match of outputRelsXml.matchAll(/Id="rId(\d+)"/g)) {
        maxRid = Math.max(maxRid, Number(match[1]))
      }

      for (const match of drawingMatches) {
        const drawingFile = match[1]
        if (!drawingFile) continue
        const templateDrawingPath = `xl/drawings/${drawingFile}`

        if (!templateZip.file(templateDrawingPath)) continue

        const targetDrawingFile = `drawing${idx}.xml`
        const targetDrawingPath = `xl/drawings/${targetDrawingFile}`

        outputZip.file(targetDrawingPath, templateZip.file(templateDrawingPath)!.asUint8Array())
        const drawingBase = drawingFile.replace(".xml", "")
        const drawingRelsPath = `xl/drawings/_rels/${drawingBase}.xml.rels`
        const drawingRelsFile = templateZip.file(drawingRelsPath)
        if (drawingRelsFile) {
          const drawingRelsXml = drawingRelsFile.asText()
          for (const mediaMatch of drawingRelsXml.matchAll(/Target="\.\.\/media\/([^"]+)"/g)) {
            const mediaFile = mediaMatch[1]
            if (!mediaFile) continue
            const mediaPath = `xl/media/${mediaFile}`
            if (!outputZip.file(mediaPath) && templateZip.file(mediaPath)) {
              outputZip.file(mediaPath, templateZip.file(mediaPath)!.asUint8Array())
              contentTypesXml = ensureContentType(
                contentTypesXml,
                `/xl/media/${mediaFile}`,
                getMediaContentType(mediaFile)
              )
            }
          }

          const targetDrawingRelsPath = `xl/drawings/_rels/drawing${idx}.xml.rels`
          outputZip.file(targetDrawingRelsPath, drawingRelsXml)
        }

        contentTypesXml = ensureContentType(
          contentTypesXml,
          `/${targetDrawingPath}`,
          "application/vnd.openxmlformats-officedocument.drawing+xml"
        )

        if (!outputRelsXml.includes("drawing")) {
          maxRid += 1
          const newRid = `rId${maxRid}`
          const newRel = `<Relationship Id="${newRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/${targetDrawingFile}"/>`
          outputRelsXml = outputRelsXml.replace("</Relationships>", `${newRel}</Relationships>`)
          outputZip.file(outputRelsFileName, outputRelsXml)

          const sheetXmlFile = outputZip.file(sheetFile)
          if (sheetXmlFile) {
            let outputSheetXml = sheetXmlFile.asText()
            if (!outputSheetXml.includes("<drawing")) {
              outputSheetXml = outputSheetXml.replace(
                "</worksheet>",
                `<drawing r:id="${newRid}"/></worksheet>`
              )
              outputZip.file(sheetFile, outputSheetXml)
            }
          }
        }
      }
    }

    if (contentTypesXml) {
      outputZip.file("[Content_Types].xml", contentTypesXml)
    }

    return outputZip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
  } catch (err) {
    console.error("Lỗi khi khôi phục drawing shapes:", err)
    return outputBuffer
  }
}
