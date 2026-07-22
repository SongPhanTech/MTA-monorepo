import { prisma } from ".."
import ExcelJS from "exceljs"
import dayjs from "dayjs"

export const exportXetChungChi = async ({
  certificateId,
  trainingCourseId,
  fixedClassIds,
}: {
  certificateId: string
  trainingCourseId: string
  fixedClassIds?: string[]
}) => {
  const selectedCertificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { subjectVersions: { orderBy: { code: "asc" } } },
  })
  if (!selectedCertificate) throw new Error("Không tìm thấy chứng chỉ")

  const whereStudent: any = {
    fixedClass: {
      trainingCourseId,
      ...(fixedClassIds && fixedClassIds.length > 0 ? { id: { in: fixedClassIds } } : {}),
    },
    deletedAt: null,
  }

  const students = await prisma.student.findMany({
    where: whereStudent,
    include: {
      userProfile: true,
      fixedClass: true,
      subjectClassStudent: {
        where: {
          subjectVersionId: {
            in: selectedCertificate.subjectVersions.map((sv) => sv.id),
          },
          deletedAt: null,
        },
        include: { subjectVersion: true },
        orderBy: { finalScore: "desc" },
        distinct: ["subjectVersionId"],
      },
      archivedCertificate: {
        where: {
          certificateId: selectedCertificate.id,
          deletedAt: null,
        },
      },
    },
    orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
  })

  const getStudentResult = (record: any) => {
    let totalScore = 0
    let totalCredit = 0
    let hasZeroScore = false
    let hasFailedSubject = false

    selectedCertificate.subjectVersions.forEach((sv: any) => {
      const scoreRecord = record.subjectClassStudent?.find((s: any) => s.subjectVersionId === sv.id)
      const scoreVal = scoreRecord?.manualFinalScore ?? scoreRecord?.finalScore
      const score =
        scoreVal != null
          ? Number(
              typeof scoreVal === "object" && typeof scoreVal.toNumber === "function"
                ? scoreVal.toNumber()
                : scoreVal
            )
          : 0
      if (score === 0) hasZeroScore = true
      totalScore += score * sv.credit
      totalCredit += sv.credit
      const threshold = selectedCertificate.scoreThreshold ?? 5
      if (score < threshold) hasFailedSubject = true
    })

    if (totalCredit === 0) return { tbc: 0, isPassed: false }

    const tbc = totalScore / totalCredit
    const threshold = selectedCertificate.scoreThreshold ?? 5
    const isPassed = tbc >= threshold && !hasZeroScore && !hasFailedSubject
    return { tbc, isPassed }
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Danh Sach")
  const existingColsCount = 6
  const svCols = selectedCertificate.subjectVersions.map((sv) => ({
    header: `${sv.code} (${sv.credit} TC)`,
    key: `sub_${sv.id}`,
    width: 15,
  }))

  const allCols = [
    { header: "STT", key: "stt", width: 10 },
    { header: "Mã SV", key: "code", width: 15 },
    { header: "Họ và tên", key: "fullname", width: 25 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "CCCD/CMND", key: "cccd", width: 20 },
    { header: "Lớp", key: "classCode", width: 15 },
    ...svCols,
    { header: "Điểm TBC", key: "tbc", width: 15 },
    { header: "Kết quả", key: "result", width: 15 },
  ]
  sheet.columns = allCols
  const headerRow = sheet.getRow(1)
  allCols.forEach((col, index) => {
    headerRow.getCell(index + 1).value = col.header
  })
  headerRow.font = { bold: true, size: 12, name: "Times New Roman" }
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  students.forEach((record, index) => {
    const { tbc, isPassed } = getStudentResult(record)
    const rowData: any = {
      stt: index + 1,
      code: record.code,
      fullname: record.userProfile?.fullname || "",
      dob: record.userProfile?.dateOfBirth
        ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
        : "",
      cccd: record.userProfile?.idCardNumber || "",
      classCode: record.fixedClass?.code || "",
      tbc: tbc ? tbc.toFixed(2) : "",
    }

    if (record.archivedCertificate && record.archivedCertificate.length > 0) {
      rowData.result = "Đã cấp"
    } else {
      rowData.result = isPassed ? "Đạt" : "Không đạt"
    }

    selectedCertificate.subjectVersions.forEach((sv: any) => {
      const scoreRecord = record.subjectClassStudent?.find((s: any) => s.subjectVersionId === sv.id)
      const rawScore = scoreRecord?.manualFinalScore ?? scoreRecord?.finalScore
      const score =
        rawScore != null
          ? typeof rawScore === "object" && typeof rawScore.toNumber === "function"
            ? rawScore.toNumber()
            : rawScore
          : null
      rowData[`sub_${sv.id}`] = score ?? "-"
    })

    const newRow = sheet.addRow(rowData)
    newRow.font = { size: 12, name: "Times New Roman" }

    newRow.getCell("stt").alignment = { horizontal: "center", vertical: "middle" }
    newRow.getCell("tbc").alignment = { horizontal: "center", vertical: "middle" }
    newRow.getCell("result").alignment = { horizontal: "center", vertical: "middle" }
    newRow.getCell("code").alignment = { horizontal: "center", vertical: "middle" }
    newRow.getCell("cccd").alignment = { horizontal: "center", vertical: "middle" }
    selectedCertificate.subjectVersions.forEach((sv: any) => {
      newRow.getCell(`sub_${sv.id}`).alignment = { horizontal: "center", vertical: "middle" }
    })

    const resultCell = newRow.getCell("result")
    if (rowData.result === "Đã cấp") {
      resultCell.font = {
        size: 12,
        name: "Times New Roman",
        bold: true,
        color: { argb: "FF0000FF" },
      }
    } else if (rowData.result === "Đạt") {
      resultCell.font = {
        size: 12,
        name: "Times New Roman",
        bold: true,
        color: { argb: "FF008000" },
      }
    } else {
      resultCell.font = {
        size: 12,
        name: "Times New Roman",
        bold: true,
        color: { argb: "FFFF0000" },
      }
    }
  })
  const rowCount = sheet.rowCount
  const colCount = sheet.columns.length
  for (let r = 1; r <= rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = sheet.getCell(r, c)
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as any as Buffer
}
