import { BAO_LUU_EXCEL_COLOR, isBaoLuuScoreDescription } from "@workspace/libs/bao-luu-diem"
import { HTTPException } from "hono/http-exception"
import { formatDateVn, formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import type { SheetExportOptions, TableRow } from "@workspace/libs/template-excel-core"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "object" && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function getFinalScore(manualFinalScore: unknown, finalScore: unknown): number {
  const manual = toNumber(manualFinalScore)
  if (manualFinalScore != null && manual != null) return manual
  return toNumber(finalScore) ?? 0
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return formatDateVn(value) || ""
}

function hangTotNghiep(diemTB: number): string {
  if (diemTB >= 9.0) return "Xuất sắc"
  if (diemTB >= 8.0) return "Giỏi"
  if (diemTB >= 7.0) return "Khá"
  if (diemTB >= 6.0) return "Trung bình"
  if (diemTB >= 5.0) return "Trung bình yếu"
  return "Yếu"
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const sanitized = name.replace(/[\\/?:*[\]]/g, "_").trim()
  const baseName = (sanitized.slice(0, 31) || "Sheet").trim()
  if (!used.has(baseName)) {
    used.add(baseName)
    return baseName
  }
  let counter = 1
  while (true) {
    const suffix = ` (${counter})`
    const candidate = `${sanitized.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
    counter++
  }
}

export async function exportBangDiemNganDaiHan({ studentIds }: { studentIds: string[] }) {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    throw new HTTPException(400, { message: "Danh sách học viên trống" })
  }

  const students = await prisma.student.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      curriculumVersionId: true,
      userProfile: { select: { code: true, fullname: true, dateOfBirth: true } },
      curriculumVersion: {
        select: {
          trainingTime: { select: { name: true } },
          trainingLanguage: { select: { name: true } },
        },
      },
      fixedClass: {
        select: {
          curriculumVersionId: true,
          trainingCourse: {
            select: {
              name: true,
              admissionStartDate: true,
              trainingObjectType: { select: { name: true } },
            },
          },
          curriculumVersion: {
            select: {
              trainingTime: { select: { name: true } },
              trainingLanguage: { select: { name: true } },
              curriculum: {
                select: { trainingMajor: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })

  const studentById = new Map(students.map((s) => [s.id, s]))
  const orderedStudents = uniqueIds
    .map((id) => studentById.get(id))
    .filter((s): s is (typeof students)[number] => Boolean(s))

  if (orderedStudents.length === 0) {
    throw new HTTPException(404, { message: "Không tìm thấy học viên" })
  }

  const ids = orderedStudents.map((s) => s.id)

  const [semesters, phienDiemScores] = await Promise.all([
    prisma.semester.findMany({
      where: {
        subjectClasses: {
          some: { subjectClassStudent: { some: { studentId: { in: ids } } } },
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        createdAt: true,
        schoolYear: { select: { name: true } },
        subjectClasses: {
          where: { subjectClassStudent: { some: { studentId: { in: ids } } } },
          select: {
            subjectClassStudent: {
              where: { studentId: { in: ids }, deletedAt: null },
              select: {
                studentId: true,
                subjectVersionId: true,
                manualFinalScore: true,
                finalScore: true,
                subjectVersion: { select: { id: true, name: true, credit: true } },
              },
            },
          },
        },
      },
    }),
    prisma.studentSubjectScore.findMany({
      where: {
        studentId: { in: ids },
        subjectClassId: null,
        deletedAt: null,
        OR: [{ manualFinalScore: { not: null } }, { finalScore: { not: null } }],
      },
      select: {
        studentId: true,
        semesterId: true,
        subjectVersionId: true,
        manualFinalScore: true,
        finalScore: true,
        description: true,
        subjectVersion: { select: { id: true, name: true, credit: true } },
      },
    }),
  ])

  const curriculumVersionIds = [
    ...new Set(
      orderedStudents
        .map((student) => student.curriculumVersionId || student.fixedClass?.curriculumVersionId)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  const [trainingBlockSubjects, semesterResults] = await Promise.all([
    curriculumVersionIds.length
      ? prisma.trainingBlockSubject.findMany({
          where: {
            trainingBlockOnCurriculumVersion: { curriculumVersionId: { in: curriculumVersionIds } },
            deletedAt: null,
          },
          select: {
            subjectId: true,
            semester: true,
            trainingBlockOnCurriculumVersion: { select: { curriculumVersionId: true } },
          },
        })
      : Promise.resolve([]),
    prisma.studentSemesterResult.findMany({
      where: { studentId: { in: ids }, deletedAt: null },
      select: {
        studentId: true,
        semesterIndexInCourse: true,
        semester: {
          select: {
            id: true,
            code: true,
            name: true,
            schoolYear: { select: { name: true } },
          },
        },
      },
    }),
  ])

  type MonHoc = { TenMonhoc: string; soTC: number | null; diemhe10: number; baoLuu: boolean }
  type HocKi = { key: string; TenHocKi: string; monHocs: MonHoc[] }

  const today = nowVn()
  const usedSheetNames = new Set<string>()
  let globalCounter = 1

  const sheets: SheetExportOptions[] = orderedStudents.map((student) => {
    const hocKis: HocKi[] = []
    const classSubjectIds = new Set<string>()

    for (const semester of semesters) {
      const monHocs: MonHoc[] = []
      for (const subjectClass of semester.subjectClasses) {
        for (const scs of subjectClass.subjectClassStudent) {
          if (scs.studentId !== student.id) continue
          const subject = scs.subjectVersion
          if (subject?.id) classSubjectIds.add(subject.id)
          monHocs.push({
            TenMonhoc: subject?.name ?? "",
            soTC: toNumber(subject?.credit),
            diemhe10: getFinalScore(scs.manualFinalScore, scs.finalScore),
            baoLuu: false,
          })
        }
      }
      if (monHocs.length === 0) continue
      hocKis.push({
        key: semester.id,
        TenHocKi: `${semester.code ?? ""}-${semester.name ?? ""}-${semester.schoolYear?.name ?? ""}`,
        monHocs,
      })
    }

    const cvId = student.curriculumVersionId || student.fixedClass?.curriculumVersionId
    const ctdtSemesterBySubject = new Map<string, number | null>()
    for (const block of trainingBlockSubjects) {
      if (block.trainingBlockOnCurriculumVersion.curriculumVersionId !== cvId) continue
      if (!ctdtSemesterBySubject.has(block.subjectId) || ctdtSemesterBySubject.get(block.subjectId) == null) {
        ctdtSemesterBySubject.set(block.subjectId, block.semester)
      }
    }
    const ssrByIndex = new Map(
      semesterResults
        .filter((item) => item.studentId === student.id)
        .map((item) => [item.semesterIndexInCourse, item])
    )

    const phienHocKi: HocKi = { key: "phien-diem", TenHocKi: "Phiên điểm", monHocs: [] }
    const phienBySemester = new Map<string, MonHoc[]>()
    for (const score of phienDiemScores) {
      if (score.studentId !== student.id) continue
      const subject = score.subjectVersion
      if (!subject?.id || classSubjectIds.has(subject.id)) continue
      const monHoc: MonHoc = {
        TenMonhoc: subject.name,
        soTC: toNumber(subject.credit),
        diemhe10: getFinalScore(score.manualFinalScore, score.finalScore),
        baoLuu: isBaoLuuScoreDescription(score.description),
      }
      const ctdtKy = ctdtSemesterBySubject.get(subject.id) ?? null
      const mapped = ctdtKy != null ? ssrByIndex.get(ctdtKy) : undefined
      const groupKey = mapped?.semester.id ?? (ctdtKy != null ? `ctdt-${ctdtKy}` : score.semesterId)
      if (groupKey && hocKis.some((hk) => hk.key === groupKey)) {
        const list = phienBySemester.get(groupKey) ?? []
        list.push(monHoc)
        phienBySemester.set(groupKey, list)
      } else if (mapped) {
        hocKis.push({
          key: mapped.semester.id,
          TenHocKi: [mapped.semester.code, mapped.semester.name, mapped.semester.schoolYear?.name]
            .filter(Boolean)
            .join(" - "),
          monHocs: [monHoc],
        })
      } else if (ctdtKy != null) {
        const virtualKey = `ctdt-${ctdtKy}`
        const existing = hocKis.find((hk) => hk.key === virtualKey)
        if (existing) existing.monHocs.push(monHoc)
        else hocKis.push({ key: virtualKey, TenHocKi: `Học kỳ ${ctdtKy}`, monHocs: [monHoc] })
      } else {
        phienHocKi.monHocs.push(monHoc)
      }
      classSubjectIds.add(subject.id)
    }
    for (const hocKi of hocKis) {
      const extra = phienBySemester.get(hocKi.key)
      if (extra?.length) hocKi.monHocs.push(...extra)
    }
    if (phienHocKi.monHocs.length) hocKis.push(phienHocKi)

    const tableRows: TableRow[] = hocKis.flatMap((hocKi) =>
      hocKi.monHocs.map((monHoc) => ({
        cells: [
          { value: globalCounter++, ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}) },
          {
            value: monHoc.TenMonhoc,
            colSpan: 8,
            border: true,
            ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
          },
          {
            value: monHoc.soTC,
            align: "center" as const,
            ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
          },
          {
            value: monHoc.diemhe10 ?? 0,
            align: "right" as const,
            ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
          },
        ],
      }))
    )

    const allMonHocs = hocKis.flatMap((hk) => hk.monHocs)
    const { tongDiemCoTrongSo, tongTrongSo } = allMonHocs.reduce(
      (acc, mon) => {
        acc.tongDiemCoTrongSo += (mon.diemhe10 ?? 0) * (mon.soTC ?? 0)
        acc.tongTrongSo += mon.soTC ?? 0
        return acc
      },
      { tongDiemCoTrongSo: 0, tongTrongSo: 0 }
    )
    const diemTB =
      tongTrongSo > 0 ? Math.round((tongDiemCoTrongSo / tongTrongSo) * 100) / 100 : 0
    const hang = hangTotNghiep(diemTB)

    const gapRow: TableRow = { cells: [{ value: null, colSpan: 18, border: false }] }
    const cv = student.curriculumVersion
    const classCv = student.fixedClass?.curriculumVersion
    const fullname = student.userProfile?.fullname ?? ""
    const maSV = student.userProfile?.code ?? ""

    return {
      sheet: sanitizeSheetName(`${maSV} - ${fullname}`, usedSheetNames),
      data: {
        soChungChi: "0",
        fullname,
        maSV,
        dateOfBirth: formatDate(student.userProfile?.dateOfBirth),
        khoa: student.fixedClass?.trainingCourse?.name ?? "",
        ngaynhaphoc: formatDate(student.fixedClass?.trainingCourse?.admissionStartDate),
        ctdt: student.fixedClass?.trainingCourse?.trainingObjectType?.name ?? "",
        nganh: classCv?.curriculum?.trainingMajor?.name ?? "",
        thoigian: cv?.trainingTime?.name ?? classCv?.trainingTime?.name ?? "",
        ngonngu: cv?.trainingLanguage?.name ?? classCv?.trainingLanguage?.name ?? "",
      },
      tableStartCell: { row: 15, col: 1 },
      rows: [
        ...tableRows,
        gapRow,
        {
          cells: [
            {
              value: `Điểm trung bình chung tốt nghiệp: ${diemTB}`,
              border: false,
              colSpan: 7,
              bold: true,
            },
            {
              value: `Hạng tốt nghiệp: ${hang}`,
              border: false,
              colSpan: 10,
              bold: true,
            },
          ],
        },
        gapRow,
        {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: `Hà Nội, ngày ${formatNgayIn(today.date())} tháng ${formatThangIn(today.month() + 1)} năm ${today.year()}`,
              colSpan: 5,
              border: false,
              align: "center",
            },
          ],
        },
        {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: "TL. GIÁM ĐỐC ",
              colSpan: 5,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        },
        {
          cells: [
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            { value: null, border: false },
            {
              value: "TRƯỞNG PHÒNG SAU ĐẠI HỌC",
              colSpan: 5,
              border: false,
              align: "center",
              bold: true,
            },
          ],
        },
      ],
    }
  })

  const fileName = "BangDiemNganHan,DaiHan.xlsx"
  const buffer = await buildFromTemplate(prisma, {
    templatePath: "/mta/template/bang-diem-ngan-dai-han.xlsx",
    fileName,
    mergeSheetsToOne: true,
    sheets,
  })

  return { buffer, fileName }
}
