import { TrainingObjectTypes } from "@workspace/db"
import PizZip from "pizzip"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn, nowVn } from "@workspace/libs/timezone"
import { formatPlaceOfBirth } from "@workspace/libs/utils"
import ExcelJS from "exceljs"
import type { Alignment } from "exceljs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { curriculumVersionForTrainingObjectTypeWhere } from "../utils"
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
      admissionCombination: true,
      entryScore: true,
      competencyScore: true,
      description: true,
      department: true,
      careerYear: true,
      universitySchool: true,
      universityGraduationYear: true,
      universityMajor: true,
      universityRank: true,
      universityTrainingType: true,
      basic: true,
      departmentAddress: true,
      priorityReason: true,
      foreignLanguage: true,

      facility: true,
      userProfile: {
        select: {
          code: true,
          fullname: true,
          dateOfBirth: true,
          idCardNumber: true,
          phoneNumber: true,
          placeOfBirth: true,
          gender: { select: { sTen: true } },
          ethnicity: { select: { sTen: true } },
          newProvinceOfBirth: {
            select: {
              sTen: true,
            },
          },
          provinceOfBirth: { select: { sTen: true } },
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
    orderBy: { userProfile: { code: "asc" } },
  })

  const TrainingObjectType = {
    [TrainingObjectTypes.MILITARY]: "Quân sự",
    [TrainingObjectTypes.CIVILIAN]: "Dân sự",
    [TrainingObjectTypes.INTERNATIONAL_MILITARY]: "Quốc tế",
  }

  const data = students.map((student, idx) => {
    const curriculumVersion = student.curriculumVersion || student.fixedClass?.curriculumVersion

    const dateOfBirth = student.userProfile.dateOfBirth

    return {
      no: idx + 1,
      registerNumber: student.registerNumber,
      doctoralCode: student.doctoralCode,
      code: student.userProfile.code,
      fullname: student.userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${formatDateVn(dateOfBirth)}` : "",
      gender: student.userProfile.gender?.sTen,
      ethnicity: student.userProfile.ethnicity?.sTen,
      nationality: student.userProfile.nationality?.sTen,
      provinceHometown: formatPlaceOfBirth(student.userProfile),
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
      provinceOfBirth: formatPlaceOfBirth(student.userProfile),
      department: student.department,
      departmentAddress: student.departmentAddress,
      priorityReason: student.priorityReason,
      foreignLanguage: student.foreignLanguage,
      careerYear: student.careerYear,
      universitySchool: student.universitySchool,
      universityGraduationYear: student.universityGraduationYear,
      universityMajor: student.universityMajor,
      universityRank: student.universityRank,
      universityTrainingType: student.universityTrainingType,
      basic: student.basic,
      facility: student.facility,

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
    include: { schoolYear: true },
  })
  const semesterName = semester?.name || ""
  const schoolYear = semester?.schoolYear?.name || ""

  const reportDate = formatDateVn(nowVn(), "DD/M/YYYY")

  const mapTrainingType = (type?: string | null) => {
    if (!type) return ""
    switch (type) {
      case "EXCELLENT":
        return "Xuất sắc"
      case "GOOD":
        return "Tốt"
      case "FAIR":
        return "Khá"
      case "MEDIUM":
        return "Trung bình khá"
      case "AVERAGE":
        return "Trung bình"
      case "POOR":
        return "Yếu"
      case "VERY_POOR":
        return "Kém"
      default:
        return type
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

  const rawTemplateBuffer = await loadTemplateBuffer(
    prisma,
    "/mta/template/DanhSachDeNghiXetHocBong.xlsx"
  )

  const sheetsInput = []
  for (const type of sortedTypes) {
    const rows = []
    for (const courseItem of filteredCourseStudents) {
      const groupStudents = courseItem.students.filter((student) => {
        if (!student.hasScholarship || !student.scholarship || student.scholarship.length === 0)
          return false
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
                conductScore: true,
              },
            },
            fixedClass: {
              select: {
                classMonitorId: true,
                unionSecretaryId: true,
                unionLeaderId: true,
                deputyUnionSecretaryId: true,
                managementOrganization: {
                  select: { sMa: true },
                },
              },
            },
          },
        })

        const department =
          studentDb?.fixedClass?.managementOrganization?.sMa || studentDb?.department || ""
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
        } catch (err) {}
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
              alignment: cellAlignment,
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
        ? formatDateVn((student.userProfile as any).dateOfBirth)
        : ""
      const studentCode = student.userProfile?.code || ""
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
    { header: "Mã định danh", key: "studentCode", width: 15 },
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
  // CTĐT / ngành / CN / đơn vị / lớp QL: luôn theo ĐTĐT (không lọc theo khoá).
  const curriculumVersionWhere = curriculumVersionForTrainingObjectTypeWhere(trainingObjectTypeId)

  const orgSelect = { sTen: true, bActive: true, bDeleted: true } as const

  const [fixedClasses, curricula, majorsByObjectType, fieldsByObjectType, trainingObjectType] =
    await Promise.all([
      prisma.fixedClass.findMany({
        where: {
          active: true,
          deletedAt: null,
          trainingCourse: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
          },
        },
        select: { code: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.curriculumVersion.findMany({
        where: curriculumVersionWhere,
        select: {
          name: true,
          curriculum: {
            select: {
              trainingField: {
                select: {
                  name: true,
                  organization: { select: orgSelect },
                },
              },
              trainingMajor: {
                select: {
                  name: true,
                  trainingField: { select: { name: true } },
                  organization: { select: orgSelect },
                  secondOrganization: { select: orgSelect },
                  thirdOrganization: { select: orgSelect },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.trainingMajor.findMany({
        where: {
          trainingObjectTypes: {
            some: { trainingObjectTypeId, deletedAt: null },
          },
          deletedAt: null,
          active: true,
        },
        select: {
          name: true,
          organization: { select: orgSelect },
          secondOrganization: { select: orgSelect },
          thirdOrganization: { select: orgSelect },
          trainingField: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.trainingField.findMany({
        where: {
          trainingObjectTypes: {
            some: { trainingObjectTypeId, deletedAt: null },
          },
          deletedAt: null,
          active: true,
        },
        select: {
          name: true,
          organization: { select: orgSelect },
        },
        orderBy: { name: "asc" },
      }),
      prisma.trainingObjectType.findUniqueOrThrow({
        where: { id: trainingObjectTypeId },
        select: { name: true },
      }),
    ])

  const majorNamesFromCurricula = new Set<string>()
  const fieldNamesFromCurricula = new Set<string>()
  const orgNamesFromCurricula = new Set<string>()
  const orgNamesFromObjectType = new Set<string>()
  const addOrg = (
    target: Set<string>,
    org?: { sTen: string | null; bActive: boolean | null; bDeleted: boolean | null } | null
  ) => {
    const name = org?.sTen?.trim()
    if (name && org?.bActive !== false && org?.bDeleted !== true) target.add(name)
  }

  for (const cv of curricula) {
    const major = cv.curriculum?.trainingMajor
    const field = cv.curriculum?.trainingField
    const majorName = major?.name?.trim()
    const fieldFromCurriculum = field?.name?.trim()
    const fieldFromMajor = major?.trainingField?.name?.trim()
    if (majorName) majorNamesFromCurricula.add(majorName)
    if (fieldFromCurriculum) fieldNamesFromCurricula.add(fieldFromCurriculum)
    if (fieldFromMajor) fieldNamesFromCurricula.add(fieldFromMajor)
    addOrg(orgNamesFromCurricula, field?.organization)
    addOrg(orgNamesFromCurricula, major?.organization)
    addOrg(orgNamesFromCurricula, major?.secondOrganization)
    addOrg(orgNamesFromCurricula, major?.thirdOrganization)
  }

  for (const major of majorsByObjectType) {
    addOrg(orgNamesFromObjectType, major.organization)
    addOrg(orgNamesFromObjectType, major.secondOrganization)
    addOrg(orgNamesFromObjectType, major.thirdOrganization)
  }
  for (const field of fieldsByObjectType) {
    addOrg(orgNamesFromObjectType, field.organization)
  }

  const mergeNames = (...groups: Array<Iterable<string> | Array<{ name: string }>>) => {
    const set = new Set<string>()
    for (const group of groups) {
      for (const item of group) {
        const name = (typeof item === "string" ? item : item.name)?.trim()
        if (name) set.add(name)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "vi"))
  }

  // Luôn lấy đủ danh mục theo ĐTĐT (gộp từ major/field của ĐTĐT + từ CTĐT).
  const trainingMajors = mergeNames(
    majorsByObjectType.map((m) => m.name),
    majorNamesFromCurricula
  )
  const trainingFields = mergeNames(
    fieldsByObjectType.map((f) => f.name),
    fieldNamesFromCurricula
  )
  let organizationNames = mergeNames(orgNamesFromObjectType, orgNamesFromCurricula)
  if (organizationNames.length === 0) {
    const allOrgs = await prisma.dM_DonVi.findMany({
      where: { bActive: true, bDeleted: false },
      select: { sTen: true },
      orderBy: { sTen: "asc" },
    })
    organizationNames = mergeNames(allOrgs.map((o) => o.sTen || ""))
  }

  const curriculumNames = mergeNames(curricula.map((c) => c.name))
  const fixedClassRows = fixedClasses.map((fc) => ({
    ma: (fc.code || "").trim(),
    ten: (fc.name || "").trim(),
  }))

  const buffer = await getTemplateBuffer(prisma, "MauImportDSHV_v5.xlsx")
  // Không dùng xlsx-template: template MinIO không có placeholder, và xlsx-template
  // dễ làm lệch named range. Chỉ PizZip ghi J6/J7 + danh mục + dropdown.
  return finalizeStudentImportWorkbook(buffer, {
    trainingObjectTypeName: trainingObjectType.name,
    trainingCourseName: "",
    catalogs: {
      nganh: trainingFields,
      chuyenNganh: trainingMajors,
      chuongTrinhDaoTao: curriculumNames,
      donViQuanLi: organizationNames,
      lopQuanLi: fixedClassRows,
    },
  }) as any
}

const EXCEL_MAX_ROW = 1_048_576
const STUDENT_IMPORT_DATA_START_ROW = 13
const STUDENT_IMPORT_DATA_END_ROW = 5000

function escapeXmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function setWorksheetInlineCell(xml: string, cellRef: string, value: string): string {
  const escaped = escapeXmlText(value)
  const re = new RegExp(`<c r="${cellRef}"([^>]*)/>|<c r="${cellRef}"([^>]*)>[\\s\\S]*?</c>`)
  return xml.replace(re, (full, attrsA?: string, attrsB?: string) => {
    const attrs = attrsA || attrsB || ""
    const styleMatch = attrs.match(/\ss="([^"]+)"/)
    const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : ""
    return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t>${escaped}</t></is></c>`
  })
}

function getWorkbookSheetPath(zip: InstanceType<typeof PizZip>, sheetName: string): string | null {
  const workbookXml = zip.file("xl/workbook.xml")?.asText()
  const relsXml = zip.file("xl/_rels/workbook.xml.rels")?.asText()
  if (!workbookXml || !relsXml) return null

  const sheetTag = [...workbookXml.matchAll(/<sheet\b[^>]*\/?>/g)].find((m) => {
    const nameMatch = m[0].match(/\bname="([^"]+)"/)
    return nameMatch?.[1] === sheetName
  })
  if (!sheetTag) return null
  const rId = sheetTag[0].match(/\br:id="([^"]+)"/)?.[1]
  if (!rId) return null

  let target: string | undefined
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*\/?>/g)) {
    const tag = m[0]
    const id = tag.match(/\bId="([^"]+)"/)?.[1]
    if (id !== rId) continue
    target = tag.match(/\bTarget="([^"]+)"/)?.[1]
    break
  }
  if (!target) return null

  const normalized = target.replace(/^\.\//, "").replace(/^\//, "")
  const candidates = [normalized.startsWith("xl/") ? normalized : `xl/${normalized}`, normalized]
  for (const path of candidates) {
    if (zip.file(path)) return path
  }
  return candidates[0]
}

function catalogLastRow(valueCount: number, hasHeader: boolean): number {
  const dataStartRow = hasHeader ? 2 : 1
  if (valueCount <= 0) return dataStartRow
  return dataStartRow + valueCount - 1
}

function rewriteCatalogSheetData(
  zip: InstanceType<typeof PizZip>,
  sheetName: string,
  columns: Array<{ col: string; header?: string; values: string[] }>
): number {
  const sheetPath = getWorkbookSheetPath(zip, sheetName)
  const maxValues = Math.max(0, ...columns.map((c) => c.values.length))
  const hasHeader = columns.some((c) => c.header != null && c.header !== "")
  const dataStartRow = hasHeader ? 2 : 1
  const lastRow = catalogLastRow(maxValues, hasHeader)

  if (!sheetPath || !zip.file(sheetPath)) {
    console.warn(
      `[_generateStudentImportTemplate] Không tìm thấy sheet danh mục "${sheetName}" — dropdown có thể thiếu dữ liệu`
    )
    return lastRow
  }

  const rowsXml: string[] = []
  if (hasHeader) {
    const cells = columns
      .map((c) => {
        const text = escapeXmlText(c.header || "")
        return `<c r="${c.col}1" t="inlineStr"><is><t>${text}</t></is></c>`
      })
      .join("")
    rowsXml.push(`<row r="1">${cells}</row>`)
  }

  for (let i = 0; i < maxValues; i++) {
    const rowNum = dataStartRow + i
    const cells = columns
      .map((c) => {
        const value = c.values[i] ?? ""
        return `<c r="${c.col}${rowNum}" t="inlineStr"><is><t>${escapeXmlText(value)}</t></is></c>`
      })
      .join("")
    rowsXml.push(`<row r="${rowNum}">${cells}</row>`)
  }
  if (maxValues === 0) {
    const cells = columns
      .map((c) => `<c r="${c.col}${dataStartRow}" t="inlineStr"><is><t></t></is></c>`)
      .join("")
    rowsXml.push(`<row r="${dataStartRow}">${cells}</row>`)
  }

  const lastCol =
    columns
      .map((c) => c.col)
      .sort()
      .slice(-1)[0] || "A"
  const sheetData = `<sheetData>${rowsXml.join("")}</sheetData>`
  let xml = zip.file(sheetPath)!.asText()
  if (/<sheetData\b[^>]*\/>/.test(xml)) {
    xml = xml.replace(/<sheetData\b[^>]*\/>/, sheetData)
  } else if (/<sheetData\b[\s\S]*?<\/sheetData>/.test(xml)) {
    xml = xml.replace(/<sheetData\b[\s\S]*?<\/sheetData>/, sheetData)
  } else {
    xml = xml.replace("</worksheet>", `${sheetData}</worksheet>`)
  }
  if (/<dimension\b[^>]*\/>/.test(xml)) {
    xml = xml.replace(/<dimension\b[^>]*\/>/, `<dimension ref="A1:${lastCol}${lastRow}"/>`)
  } else if (/<dimension\b[^>]*>[\s\S]*?<\/dimension>/.test(xml)) {
    xml = xml.replace(
      /<dimension\b[^>]*>[\s\S]*?<\/dimension>/,
      `<dimension ref="A1:${lastCol}${lastRow}"/>`
    )
  }
  // Bỏ table/autoFilter — dễ khóa named range còn 1 dòng.
  xml = xml.replace(/<tableParts\b[\s\S]*?<\/tableParts>/g, "")
  xml = xml.replace(/<autoFilter\b[^>]*\/>/g, "")
  xml = xml.replace(/<autoFilter\b[\s\S]*?<\/autoFilter>/g, "")
  zip.file(sheetPath, xml)

  const written = zip.file(sheetPath)?.asText() || ""
  const inlineCount = (written.match(/t="inlineStr"/g) || []).length
  if (maxValues > 0 && inlineCount === 0) {
    console.warn(
      `[_generateStudentImportTemplate] Ghi sheet "${sheetName}" thất bại (không có inlineStr sau khi ghi)`
    )
  }
  return lastRow
}

function finalizeStudentImportWorkbook(
  buffer: Buffer,
  opts: {
    trainingObjectTypeName: string
    trainingCourseName: string
    catalogs: {
      nganh: string[]
      chuyenNganh: string[]
      chuongTrinhDaoTao: string[]
      donViQuanLi: string[]
      lopQuanLi: Array<{ ma: string; ten: string }>
    }
  }
): Buffer {
  const zip = new PizZip(buffer)
  const { catalogs } = opts

  for (const file of Object.values(zip.files)) {
    if (!file.name.startsWith("xl/worksheets/sheet") || !file.name.endsWith(".xml")) continue
    if (file.dir) continue
    let xml = file.asText()
    xml = xml.replace(/<selection\b[^>]*\/>/g, '<selection activeCell="A1" sqref="A1"/>')
    xml = xml.replace(
      /<selection\b[^>]*>\s*<\/selection>/g,
      '<selection activeCell="A1" sqref="A1"/>'
    )
    xml = xml.replace(/\s+topLeftCell="[^"]*"/g, "")
    zip.file(file.name, xml)
  }

  // lastRow lấy theo số phần tử catalog (không tin chiều dài sheet template).
  const lastRowBySheet: Record<string, number> = {
    DanhMucNganh: rewriteCatalogSheetData(zip, "DanhMucNganh", [
      { col: "A", header: "Tên", values: catalogs.nganh },
    ]),
    DanhMucChuyenNganh: rewriteCatalogSheetData(zip, "DanhMucChuyenNganh", [
      { col: "A", header: "Tên", values: catalogs.chuyenNganh },
    ]),
    DanhMucChuongTrinhDaoTao: rewriteCatalogSheetData(zip, "DanhMucChuongTrinhDaoTao", [
      { col: "A", values: catalogs.chuongTrinhDaoTao },
    ]),
    DanhMucDonViQuanLi: rewriteCatalogSheetData(zip, "DanhMucDonViQuanLi", [
      { col: "A", values: catalogs.donViQuanLi },
    ]),
    DanhMucLopQuanLi: rewriteCatalogSheetData(zip, "DanhMucLopQuanLi", [
      { col: "A", values: catalogs.lopQuanLi.map((x) => x.ma) },
      { col: "B", values: catalogs.lopQuanLi.map((x) => x.ten) },
    ]),
    DanhMucGioiTinh: 3,
    DanhMucDanToc: 56,
    DanhMucQuocTich: 231,
    DanhMucTinh: 35,
  }

  // Bảo đảm range dropdown khớp số lượng catalog (tránh A2:A2 khi sheet còn nhiều dòng).
  lastRowBySheet.DanhMucNganh = catalogLastRow(catalogs.nganh.length, true)
  lastRowBySheet.DanhMucChuyenNganh = catalogLastRow(catalogs.chuyenNganh.length, true)
  lastRowBySheet.DanhMucChuongTrinhDaoTao = catalogLastRow(catalogs.chuongTrinhDaoTao.length, false)
  lastRowBySheet.DanhMucDonViQuanLi = catalogLastRow(catalogs.donViQuanLi.length, false)
  lastRowBySheet.DanhMucLopQuanLi = catalogLastRow(catalogs.lopQuanLi.length, false)

  console.info("[_generateStudentImportTemplate] catalog rows", {
    nganh: catalogs.nganh.length,
    chuyenNganh: catalogs.chuyenNganh.length,
    ctdt: catalogs.chuongTrinhDaoTao.length,
    donVi: catalogs.donViQuanLi.length,
    lop: catalogs.lopQuanLi.length,
    lastRowBySheet,
  })

  const mainSheetPath = getWorkbookSheetPath(zip, "HỌC VIÊN, SINH VIÊN")
  if (mainSheetPath && zip.file(mainSheetPath)) {
    let mainXml = zip.file(mainSheetPath)!.asText()
    mainXml = setWorksheetInlineCell(mainXml, "J6", opts.trainingObjectTypeName)
    mainXml = setWorksheetInlineCell(mainXml, "J7", opts.trainingCourseName)

    // Excel ưu tiên x14:dataValidations (thường lệch/hỏng) → gỡ trước khi gắn lại classic.
    mainXml = mainXml.replace(/<x14:dataValidations\b[\s\S]*?<\/x14:dataValidations>/g, "")
    mainXml = mainXml.replace(
      /<ext uri="\{CCE6A557-97BC-4b89-ADB6-D9C93CAAB3DF\}"[^>]*>\s*<\/ext>/g,
      ""
    )
    mainXml = mainXml.replace(/<extLst>\s*<\/extLst>/g, "")

    const quoteSheet = (name: string) => {
      // Chỉ quote khi tên sheet có khoảng trắng / ký tự đặc biệt (Excel native).
      if (/^[A-Za-z0-9_]+$/.test(name)) return name
      return `'${name.replace(/'/g, "''")}'`
    }
    const sheetRange = (sheet: string, col: string, startRow: number, endRow: number) => {
      const end = Math.min(Math.max(endRow, startRow), EXCEL_MAX_ROW)
      return `${quoteSheet(sheet)}!$${col}$${startRow}:$${col}$${end}`
    }

    const listValidations = [
      ["G", sheetRange("DanhMucGioiTinh", "A", 2, lastRowBySheet.DanhMucGioiTinh ?? 3)],
      ["H", sheetRange("DanhMucDanToc", "A", 2, lastRowBySheet.DanhMucDanToc ?? 56)],
      ["I", sheetRange("DanhMucQuocTich", "A", 2, lastRowBySheet.DanhMucQuocTich ?? 231)],
      ["J", sheetRange("DanhMucTinh", "A", 2, lastRowBySheet.DanhMucTinh ?? 35)],
      ["P", sheetRange("DanhMucLopQuanLi", "A", 1, lastRowBySheet.DanhMucLopQuanLi ?? 1)],
      ["Q", sheetRange("DanhMucLopQuanLi", "B", 1, lastRowBySheet.DanhMucLopQuanLi ?? 1)],
      ["R", sheetRange("DanhMucNganh", "A", 2, lastRowBySheet.DanhMucNganh ?? 2)],
      ["S", sheetRange("DanhMucChuyenNganh", "A", 2, lastRowBySheet.DanhMucChuyenNganh ?? 2)],
      [
        "T",
        sheetRange(
          "DanhMucChuongTrinhDaoTao",
          "A",
          1,
          lastRowBySheet.DanhMucChuongTrinhDaoTao ?? 1
        ),
      ],
      ["U", sheetRange("DanhMucDonViQuanLi", "A", 1, lastRowBySheet.DanhMucDonViQuanLi ?? 1)],
    ].map(([col, formula], idx) => {
      const sqref = `${col}${STUDENT_IMPORT_DATA_START_ROW}:${col}${STUDENT_IMPORT_DATA_END_ROW}`
      return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${sqref}" xr:uid="{00000000-0001-0000-0000-${String(idx + 1).padStart(12, "0")}}"><formula1>${formula}</formula1></dataValidation>`
    })
    listValidations.push(
      `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="V${STUDENT_IMPORT_DATA_START_ROW}:V${STUDENT_IMPORT_DATA_END_ROW}" xr:uid="{00000000-0001-0000-0000-000000000099}"><formula1>"Quân sự,Dân sự"</formula1></dataValidation>`
    )

    const dataValidationsXml = `<dataValidations count="${listValidations.length}">${listValidations.join("")}</dataValidations>`
    if (/<dataValidations\b[\s\S]*?<\/dataValidations>/.test(mainXml)) {
      mainXml = mainXml.replace(/<dataValidations\b[\s\S]*?<\/dataValidations>/, dataValidationsXml)
    } else {
      mainXml = mainXml.replace("</worksheet>", `${dataValidationsXml}</worksheet>`)
    }
    zip.file(mainSheetPath, mainXml)
  }

  const workbookPath = "xl/workbook.xml"
  const workbookXml = zip.file(workbookPath)?.asText()
  if (!workbookXml) {
    return zip.generate({ type: "nodebuffer" }) as Buffer
  }

  const quoteSheet = (name: string) => {
    if (/^[A-Za-z0-9_]+$/.test(name)) return name
    return `'${name.replace(/'/g, "''")}'`
  }
  const range = (sheet: string, col: string, startRow: number, endRow: number) => {
    const end = Math.min(Math.max(endRow, startRow), EXCEL_MAX_ROW)
    return `${quoteSheet(sheet)}!$${col}$${startRow}:$${col}$${end}`
  }

  const requiredNames: Record<string, string> = {
    danhmucnganh2: range("DanhMucNganh", "A", 2, lastRowBySheet.DanhMucNganh ?? 2),
    danhmucchuyennganh2: range(
      "DanhMucChuyenNganh",
      "A",
      2,
      lastRowBySheet.DanhMucChuyenNganh ?? 2
    ),
    danhmucctdt: range(
      "DanhMucChuongTrinhDaoTao",
      "A",
      1,
      lastRowBySheet.DanhMucChuongTrinhDaoTao ?? 1
    ),
    danhmucmalop: range("DanhMucLopQuanLi", "A", 1, lastRowBySheet.DanhMucLopQuanLi ?? 1),
    danhmuctenlop: range("DanhMucLopQuanLi", "B", 1, lastRowBySheet.DanhMucLopQuanLi ?? 1),
    danhmucdonviquanly2: range(
      "DanhMucDonViQuanLi",
      "A",
      1,
      lastRowBySheet.DanhMucDonViQuanLi ?? 1
    ),
    danhmucgioitinh2: range("DanhMucGioiTinh", "A", 2, lastRowBySheet.DanhMucGioiTinh ?? 3),
    danhmucdantoc2: range("DanhMucDanToc", "A", 2, lastRowBySheet.DanhMucDanToc ?? 56),
    danhmucquoctich2: range("DanhMucQuocTich", "A", 2, lastRowBySheet.DanhMucQuocTich ?? 231),
    danhmuctinh2: range("DanhMucTinh", "A", 2, lastRowBySheet.DanhMucTinh ?? 35),
  }

  // Bỏ hết defined name danh mục cũ (thường bị clamp lệch kiểu $A$15:$A$15 / $A$444).
  // Chỉ giữ name không liên quan; gắn lại requiredNames phía dưới.
  const keptNames: string[] = []
  let next = workbookXml.replace(
    /<definedName(\b[^>]*)>([\s\S]*?)<\/definedName>/g,
    (_full, attrs: string, value: string) => {
      const nameMatch = String(attrs).match(/\bname="([^"]+)"/)
      const name = (nameMatch?.[1] || "").toLowerCase()
      if (name.startsWith("danhmuc") || requiredNames[nameMatch?.[1] || ""]) {
        return ""
      }
      const ref = String(value).trim()
      if (!ref || ref.includes("#REF!")) return ""
      keptNames.push(`<definedName${attrs}>${ref}</definedName>`)
      return ""
    }
  )

  const requiredXml = Object.entries(requiredNames)
    .map(([name, ref]) => `<definedName name="${name}">${ref}</definedName>`)
    .join("")

  if (/<definedNames>[\s\S]*?<\/definedNames>/.test(next)) {
    next = next.replace(
      /<definedNames>[\s\S]*?<\/definedNames>/,
      `<definedNames>${keptNames.join("")}${requiredXml}</definedNames>`
    )
  } else {
    next = next.replace("</workbook>", `<definedNames>${requiredXml}</definedNames></workbook>`)
  }

  next = next.replace(/<definedNames>\s*<\/definedNames>/, "")
  zip.file(workbookPath, next)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}

/** @deprecated kept for callers that only need named-range clamp */
function sanitizeStudentImportWorkbook(
  buffer: Buffer,
  lastRowBySheet: Record<string, number>
): Buffer {
  const zip = new PizZip(buffer)

  for (const file of Object.values(zip.files)) {
    if (!file.name.startsWith("xl/worksheets/sheet") || !file.name.endsWith(".xml")) continue
    if (file.dir) continue
    let xml = file.asText()
    xml = xml.replace(/<selection\b[^>]*\/>/g, '<selection activeCell="A1" sqref="A1"/>')
    xml = xml.replace(
      /<selection\b[^>]*>\s*<\/selection>/g,
      '<selection activeCell="A1" sqref="A1"/>'
    )
    xml = xml.replace(/\s+topLeftCell="[^"]*"/g, "")
    zip.file(file.name, xml)
  }

  const workbookPath = "xl/workbook.xml"
  const workbookXml = zip.file(workbookPath)?.asText()
  if (!workbookXml) {
    return zip.generate({ type: "nodebuffer" }) as Buffer
  }

  let next = workbookXml.replace(
    /<definedName(\b[^>]*)>([\s\S]*?)<\/definedName>/g,
    (_full, attrs: string, value: string) => {
      const ref = String(value).trim()
      if (!ref || ref.includes("#REF!")) return ""

      const sheetMatch = ref.match(/^([^!]+)!/)
      const sheetName = sheetMatch?.[1]?.replace(/'/g, "")
      const lastRow = sheetName ? lastRowBySheet[sheetName] : undefined

      let fixed = ref.replace(/\$([A-Z]+)\$(\d+)/gi, (_m, col: string, rowStr: string) => {
        const row = Number(rowStr)
        if (!Number.isFinite(row)) return _m
        let capped = Math.min(row, EXCEL_MAX_ROW)
        if (typeof lastRow === "number" && capped > lastRow) capped = lastRow
        return `$${col}$${capped}`
      })

      if (lastRow && /![A-Z]+:[A-Z]+$/i.test(fixed.replace(/\$/g, ""))) {
        const colMatch = fixed.match(/!\$?([A-Z]+):\$?([A-Z]+)$/i)
        if (colMatch) {
          const prefix = fixed.slice(0, fixed.lastIndexOf("!"))
          fixed = `${prefix}!$${colMatch[1]}$2:$${colMatch[2]}$${lastRow}`
        }
      }

      return `<definedName${attrs}>${fixed}</definedName>`
    }
  )

  next = next.replace(/<definedNames>\s*<\/definedNames>/, "")
  zip.file(workbookPath, next)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}

/**
 * Fix workbook definedNames broken by xlsx-template table expansion:
 * - clamp row refs > 1048576
 * - drop #REF! names
 */
function sanitizeXlsxDefinedNames(buffer: Buffer): Buffer {
  return sanitizeStudentImportWorkbook(buffer, {})
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
          userProfile: {
            include: {
              newProvinceOfBirth: true,
              provinceOfBirth: true,
            },
          },
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
      dateOfBirth: userProfile?.dateOfBirth ? `'${formatDateVn(userProfile.dateOfBirth)}` : "",
      placeOfBirth: formatPlaceOfBirth(userProfile),
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
      issuedDate: item.issuedDate ? `'${formatDateVn(item.issuedDate)}` : "",
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
      userProfile: {
        include: {
          newProvinceOfBirth: true,
          provinceOfBirth: true,
        },
      },
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
      dateOfBirth: userProfile?.dateOfBirth ? `'${formatDateVn(userProfile.dateOfBirth)}` : "",
      placeOfBirth: formatPlaceOfBirth(userProfile),
      idCardNumber: userProfile?.idCardNumber || "",
      fixedClass: fixedClass?.name || "",
      trainingCourse: fixedClass?.trainingCourse?.name || "",
      trainingMajorName: trainingMajor?.name || "",
      issuedDate: archivedState?.issuedDate ? `'${formatDateVn(archivedState.issuedDate)}` : "",
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
      userProfile: {
        include: {
          newProvinceOfBirth: true,
          provinceOfBirth: true,
        },
      },
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
      dateOfBirth: userProfile?.dateOfBirth ? `'${formatDateVn(userProfile.dateOfBirth)}` : "",
      fixedClass: fixedClass?.name || "",
      trainingCourse: fixedClass?.trainingCourse?.name || "",
      trainingField: trainingMajor?.trainingField?.name || "",
      trainingMajorName: trainingMajor?.name || "",
      placeOfBirth: formatPlaceOfBirth(userProfile),
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
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "emf":
      return "image/x-emf"
    default:
      return "application/octet-stream"
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
    const sheetFiles = allOutputFiles.filter((name) =>
      name.match(/^xl\/worksheets\/sheet\d+\.xml$/)
    )

    for (const sheetFile of sheetFiles) {
      const sheetIndexMatch = sheetFile.match(/sheet(\d+)\.xml/)
      if (!sheetIndexMatch) continue
      const idx = sheetIndexMatch[1]

      const outputRelsFileName = `xl/worksheets/_rels/sheet${idx}.xml.rels`
      const outputRelsFile = outputZip.file(outputRelsFileName)
      let outputRelsXml =
        outputRelsFile?.asText() ??
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
