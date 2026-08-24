import { $Enums, type PrismaClient } from "@workspace/db"
import { normalizeCatalogName } from "@workspace/libs/utils"
import { APP_TIMEZONE, setupAppTimezone } from "@workspace/libs/timezone"
import { HTTPException } from "hono/http-exception"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"
import dayjs from "dayjs"
import Decimal from "decimal.js"

export function parseDate(input?: number | string | Date): Date | null {
  if (!input) return null
  if (input) {
    // Check if input is a number (Excel date serial number)
    if (typeof input === "number") {
      const excelEpoch = new Date(1899, 11, 31) // 31/12/1899 (Excel starts at 1/1/1900 = 1)
      return new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000)
    }
    // Check if input is a DD/MM/YYYY string
    if (typeof input === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      const [day, month, year] = input.split("/").map(Number)
      if (year !== undefined && month !== undefined && day !== undefined) {
        return new Date(year, month - 1, day)
      }
    }
  }

  if (input instanceof Date) {
    return input
  }

  return null
}

export const getCurrentDateForReport = () => {
  const currentDate = new Date()
  const date = String(currentDate.getDate()).padStart(2, "0")
  const month = String(currentDate.getMonth() + 1).padStart(2, "0") // Tháng bắt đầu từ 0
  const year = currentDate.getFullYear()
  return { date, month, year }
}

export const MONTH_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const getReportDateParts = (date?: Date | dayjs.Dayjs | string | number | null) => {
  if (!date) return null
  setupAppTimezone()
  const d = dayjs(date)
  if (!d.isValid()) return null

  const vn = d.tz(APP_TIMEZONE)
  const day = vn.date().toString().padStart(2, "0")
  const monthRaw = vn.month() + 1
  const monthVi =
    monthRaw === 1 || monthRaw === 2 ? monthRaw.toString().padStart(2, "0") : monthRaw.toString()
  const monthEn = MONTH_EN[vn.month()]
  const year = vn.year().toString()

  const dateVi = `${day}/${monthVi}/${year}`
  const fullVi = `ngày ${day} tháng ${monthVi} năm ${year}`

  return { day, monthRaw, monthVi, monthEn, year, dateVi, fullVi }
}

export const buildGenderMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_GioiTinh.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Giới tính không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildEthnicityMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_DanToc.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Dân tộc không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildNationalityMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_QuocGia.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Quốc gia không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildNewProvinceMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_Tinh_New.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Tỉnh không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildDistrictMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_QuanHuyen.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Huyện không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildWardMapOrThrow = async (prisma: PrismaClient, names: (string | undefined)[]) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_XaPhuong.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Phường/Xã không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

type CurriculumData = {
  curriculum: string
  trainingMajor?: string
  trainingMajorId?: string
  trainingField?: string
  managementOrganization?: string
}

export const buildCurriculumMapOrThrow = async (
  prisma: PrismaClient,
  students: CurriculumData[],
  trainingObjectTypeId: string,
  trainingCourseId: string,
  createMissing = false
) => {
  const normalize = (value?: string) => value?.trim() ?? ""

  const categorySet = new Set<string>(
    students.map((s) =>
      JSON.stringify({
        curriculum: s.curriculum,
        trainingMajor: s.trainingMajor,
        trainingMajorId: s.trainingMajorId,
        trainingField: s.trainingField,
        managementOrganization: s.managementOrganization,
      })
    )
  )

  const uniqueTuples = Array.from(categorySet).map((s) => JSON.parse(s) as CurriculumData)

  const majorIds = Array.from(
    new Set(
      uniqueTuples
        .map(({ trainingMajorId }) => normalize(trainingMajorId))
        .filter((majorId): majorId is string => Boolean(majorId))
    )
  )

  if (majorIds.length) {
    const validMajors = await prisma.trainingMajor.findMany({
      where: {
        id: { in: majorIds },
        trainingObjectTypes: { some: { trainingObjectTypeId } },
      },
      select: { id: true, name: true },
    })

    const validMajorIdSet = new Set(validMajors.map(({ id }) => id))

    const invalidMajorIds = majorIds.filter((majorId) => !validMajorIdSet.has(majorId))

    if (invalidMajorIds.length) {
      const majorNameById = new Map(
        uniqueTuples
          .filter(({ trainingMajorId }) => Boolean(trainingMajorId))
          .map(({ trainingMajorId, trainingMajor }) => [trainingMajorId as string, trainingMajor])
      )

      const invalidMajorLabels = invalidMajorIds.map((majorId) => {
        const majorName = majorNameById.get(majorId)
        return majorName ? `${majorName} (${majorId})` : majorId
      })

      const friendlyInvalidMajors =
        invalidMajorLabels.length <= 5
          ? invalidMajorLabels.join(", ")
          : `${invalidMajorLabels.slice(0, 5).join(", ")} và ${invalidMajorLabels.length - 5} chuyên ngành khác`

      throw new HTTPException(400, {
        message: `Chuyên ngành không hợp lệ hoặc không thuộc đối tượng đào tạo: ${friendlyInvalidMajors}`,
      })
    }
  }

  const managementOrganizationMap = await buildOrgNameMapOrThrow(
    prisma,
    uniqueTuples.map((s) => s.managementOrganization)
  )

  const existing = await prisma.curriculumVersion.findMany({
    where: {
      OR: uniqueTuples.map(({ curriculum, trainingMajor, trainingField }) => ({
        name: curriculum,
        curriculum: {
          trainingMajor: {
            name: trainingMajor,
            trainingObjectTypes: { some: { trainingObjectTypeId } },
            trainingField: {
              name: trainingField,
              trainingObjectTypes: { some: { trainingObjectTypeId } },
            },
          },
        },
      })),
    },
    select: {
      id: true,
      name: true,
      curriculum: {
        select: {
          trainingMajor: {
            select: {
              name: true,
              trainingField: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const createdItems: { id: string; name: string }[] = []

  const missing = uniqueTuples.filter(
    ({ curriculum, trainingMajor, trainingField }) =>
      !existing.some(
        (version) =>
          version.name === curriculum &&
          (!trainingMajor || trainingMajor === version.curriculum.trainingMajor.name) &&
          (!trainingField || trainingField === version.curriculum.trainingMajor.trainingField.name)
      )
  )

  if (missing.length && !createMissing) {
    throw new HTTPException(400, {
      message: `Chương trình đào tạo không tồn tại:
${missing
  .map(
    ({ curriculum, trainingMajor, trainingField }) =>
      `${curriculum}${
        trainingMajor && trainingField ? ` - ${trainingMajor} - ${trainingField}` : ""
      }`
  )
  .join("; \n")}`,
    })
  }

  if (missing.length && createMissing) {
    await prisma.$transaction(async (tx) => {
      const course = await tx.trainingCourse.findFirst({
        where: {
          id: trainingCourseId,
          trainingObjectTypeId,
          active: true,
          deletedAt: null,
        },
      })

      if (!course) {
        throw new HTTPException(400, {
          message: `Khoá đào tạo không tồn tại: ${trainingCourseId}`,
        })
      }

      for (const item of missing) {
        const curriculumName = `${item.trainingMajor} - ${course.name}`
        let curriculum = await tx.curriculum.findFirst({
          where: {
            name: curriculumName,
            trainingObjectTypeId,
            ...(item.trainingMajor ? { trainingMajor: { name: item.trainingMajor } } : {}),
          },
        })

        const generateUniqueCode = (text: string) => {
          const initials = text
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
          const year = new Date().getFullYear().toString().slice(-2)
          const random = Math.random().toString(36).substring(2, 5).toUpperCase()
          return `${initials}${year}_${random}`
        }

        if (!curriculum) {
          if (!item.trainingMajor) {
            throw new HTTPException(400, {
              message: `Không thể tạo CTĐT ${item.curriculum} vì thiếu thông tin Chuyên ngành`,
            })
          }

          if (!item.managementOrganization) {
            throw new HTTPException(400, {
              message: `Không thể tạo CTĐT ${item.curriculum} vì thiếu thông tin Đơn vị quản lý`,
            })
          }

          const targetOrgId = managementOrganizationMap.get(item.managementOrganization)

          if (!targetOrgId) {
            throw new HTTPException(400, {
              message: `Đơn vị quản lý không tồn tại: ${item.managementOrganization}`,
            })
          }

          const major = await tx.trainingMajor.findFirst({
            where: {
              name: { equals: normalize(item.trainingMajor), mode: "insensitive" },
              trainingObjectTypes: { some: { trainingObjectTypeId } },
            },
          })

          if (!major) {
            throw new HTTPException(400, {
              message: `Chuyên ngành không tồn tại: ${item.trainingMajor}`,
            })
          }

          const curriculumCode = item.trainingMajor
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()

          curriculum = await tx.curriculum.create({
            data: {
              name: curriculumName,
              code: curriculumCode,
              trainingMajorId: major.id,
              trainingObjectTypeId,
              managementOrganizationId: targetOrgId,
            },
          })
        }

        const versionCode = item.curriculum
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()

        const created = await tx.curriculumVersion.create({
          data: {
            name: item.curriculum,
            code: generateUniqueCode(item.curriculum),
            curriculumId: curriculum.id,
            trainingObjectTypeId,
          },
          select: { id: true, name: true },
        })

        createdItems.push(created)
      }
    })
  }

  return new Map([...existing, ...createdItems].map(({ name, id }) => [name, id]))
}

export const buildTrainingBlockMapOrThrow = async (
  prisma: PrismaClient,
  trainingObjectTypeId: string,
  names: string[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))
  if (uniqNames.length === 0) return new Map<string, string>()

  const existing = await prisma.trainingBlock.findMany({
    where: {
      name: { in: uniqNames, mode: "insensitive" },
      trainingObjectTypeId,
    },
    select: { name: true, id: true },
  })

  const missing = uniqNames.filter(
    (name) => !existing.some((item) => item.name.toUpperCase() === name.toUpperCase())
  )

  if (missing.length) {
    // Tự tạo khối kiến thức theo đối tượng đào tạo của CTĐT đang import
    await prisma.trainingBlock.createMany({
      data: missing.map((name, index) => ({
        name,
        trainingObjectTypeId,
        priority: existing.length + index + 1,
      })),
      skipDuplicates: true,
    })
  }

  const all = await prisma.trainingBlock.findMany({
    where: {
      name: { in: uniqNames, mode: "insensitive" },
      trainingObjectTypeId,
    },
    select: { name: true, id: true },
  })

  const byLower = new Map(all.map(({ name, id }) => [name.toUpperCase(), id]))
  const stillMissing = uniqNames.filter((name) => !byLower.has(name.toUpperCase()))
  if (stillMissing.length) {
    throw new HTTPException(400, {
      message: `Không tạo được khối kiến thức: ${stillMissing.join(", ")}`,
    })
  }

  // Key theo tên trong file Excel để caller `.get(excelName)` luôn khớp
  return new Map(uniqNames.map((name) => [name, byLower.get(name.toUpperCase()) as string]))
}

type SubjectData = {
  trainingObjectTypeId: string
  name: string
  code: string
  organizationCode?: string
  credit: number
  examType: $Enums.ExamType | null
  type: $Enums.SubjectVersionType
  onePoint?: boolean
  period: number
  schedulePeriod: number
  numberOfTheory?: number
  numberOfPractical?: number
  numberOfSelfStudy?: number
  numberOfPractice?: number
  numberOfReview?: number
  numberOfExam?: number
}

export const buildSubjectMapOrThrow = async (
  prisma: PrismaClient,
  subjects: SubjectData[],
  createNewSubject = false
) => {
  // const subjectSet = new Set<string>(subjects.map((s) => JSON.stringify(s)))
  // const uniqueSubject = Array.from(subjectSet).map((s) => JSON.parse(s) as SubjectData)

  const { map: orgMap, unmappedCodes: unmappedOrgCodes } = await buildOrgCodeMapOrThrow(
    prisma,
    subjects.map((s) => s.organizationCode || null)
  )
  const unmappedOrgSet = new Set(unmappedOrgCodes)
  const warnings: string[] = []

  const subjectsWithCode = subjects.filter((s): s is SubjectData & { code: string } =>
    Boolean(s.code)
  )
  const existingCode = subjectsWithCode.length
    ? await prisma.subjectVersion.findMany({
        where: {
          OR: subjectsWithCode.map((s) => ({
            code: s.code,
          })),
        },
        include: { managementOrganization: { select: { sMa: true } } },
      })
    : []

  const existingByCode = new Map(existingCode.map((e) => [e.code as string, e]))

  const codeConflicts = subjects
    .map((s) => {
      if (!s.code) return null
      const existing = existingByCode.get(s.code)
      if (!existing) return null

      const diffs: string[] = []
      if (existing.credit !== s.credit) diffs.push("số tín chỉ")
      if (existing.period !== s.period) diffs.push("số tiết")
      if (
        s.organizationCode &&
        !unmappedOrgSet.has(s.organizationCode) &&
        (existing.managementOrganization?.sMa || null) !== s.organizationCode
      ) {
        diffs.push("đơn vị quản lý")
      }

      if (diffs.length > 0) {
        console.log(`[DEBUG_CONFLICT] Môn học: ${s.code}`, {
          diffs,
          excelCredit: s.credit,
          dbCredit: existing.credit,
          excelPeriod: s.period,
          dbPeriod: existing.period,
          excelOrg: s.organizationCode,
          dbOrg: existing.managementOrganization?.sMa,
        })
        return { code: s.code, diffs }
      }
      return null
    })
    .filter((s): s is { code: string; diffs: string[] } => s !== null)

  if (codeConflicts.length > 0) {
    const conflictMessages = Array.from(
      new Map(codeConflicts.map((c) => [c.code, `${c.code} (${c.diffs.join(", ")})`])).values()
    )
    warnings.push(
      `Mã học phần đã tồn tại với thông tin khác (giữ bản trong hệ thống, vui lòng kiểm tra lại): ${conflictMessages.join("; ")}`
    )
  }

  const existingCombination = await prisma.subjectVersion.findMany({
    where: {
      OR: subjects.map((s) => ({
        trainingObjectTypeId: s.trainingObjectTypeId,
        name: s.name,
        credit: s.credit,
        period: s.period,
      })),
    },
    include: { managementOrganization: { select: { sMa: true } } },
  })

  const combinationConflicts = subjects.filter((s) => {
    const excelOrg =
      s.organizationCode && !unmappedOrgSet.has(s.organizationCode) ? s.organizationCode : null
    const existing = existingCombination.find(
      (e) =>
        e.trainingObjectTypeId === s.trainingObjectTypeId &&
        e.name === s.name &&
        e.credit === s.credit &&
        e.period === s.period &&
        (e.managementOrganization?.sMa || null) === excelOrg &&
        e.code !== null &&
        e.code !== s.code
    )
    return !!existing
  })

  if (combinationConflicts.length > 0) {
    warnings.push(
      `Học phần đã tồn tại với mã khác (vui lòng kiểm tra lại): ${Array.from(
        new Set(combinationConflicts.map((s) => s.name))
      ).join(", ")}`
    )
  }

  // Ưu tiên map theo mã đã có trong hệ thống (kể cả khi lệch TC/tiết/đơn vị)
  const resolved = new Map<string, string>()
  for (const [code, row] of existingByCode) {
    resolved.set(code, row.id)
  }

  const existing = await prisma.subjectVersion.findMany({
    where: {
      OR: subjects.map((s) => ({
        name: s.name,
        trainingObjectTypeId: s.trainingObjectTypeId,
        ...(s.code ? { code: s.code } : {}),
        ...(s.organizationCode &&
        !unmappedOrgSet.has(s.organizationCode) &&
        orgMap.get(s.organizationCode)
          ? { managementOrganization: { sMa: s.organizationCode } }
          : {}),
        credit: s.credit,
        OR: [{ period: s.period }, { period: null }],
      })),
    },
    select: { id: true, code: true },
  })

  for (const row of existing) {
    if (row.code) resolved.set(row.code, row.id)
  }

  const missing = subjects.filter(({ code }) => Boolean(code) && !resolved.has(code))

  if (missing.length && createNewSubject) {
    const newSubjects = await prisma.$transaction(async (tx) => {
      await tx.subject.createMany({
        data: missing.map((s) => ({
          name: s.name,
          managementOrganizationId: orgMap.get(s.organizationCode || "") ?? undefined,
        })),
        skipDuplicates: true,
      })

      const subjectGroup = await tx.subject.findMany({
        where: {
          OR: missing.map((s) => ({
            name: s.name,
            managementOrganizationId: orgMap.get(s.organizationCode || "") ?? null,
          })),
        },
        select: { id: true, name: true, managementOrganizationId: true },
      })

      const groupMap = new Map(
        subjectGroup.map((s) => [s.name + (s.managementOrganizationId ?? ""), s.id])
      )

      return await tx.subjectVersion.createManyAndReturn({
        data: missing.map((subject) => {
          const orgId = orgMap.get(subject.organizationCode || "")
          return {
            name: subject.name,
            trainingObjectTypeId: subject.trainingObjectTypeId,
            credit: subject.credit,
            code: subject.code,
            codeTkb: subject.code,
            examType: subject.examType || $Enums.ExamType.Oral,
            type: subject.type,
            onePoint: subject.onePoint,
            period: subject.period,
            schedulePeriod: subject.schedulePeriod,
            numberOfTheory: subject.numberOfTheory,
            numberOfPractical: subject.numberOfPractical,
            numberOfSelfStudy: subject.numberOfSelfStudy,
            numberOfPractice: subject.numberOfPractice,
            numberOfReview: subject.numberOfReview,
            numberOfExam: subject.numberOfExam,
            managementOrganizationId: orgId,
            subjectId: groupMap.get(subject.name + (orgId ?? "")) as string,
          }
        }),
        select: { id: true, code: true },
      })
    })

    for (const row of newSubjects) {
      if (row.code) resolved.set(row.code, row.id)
    }

    return {
      map: resolved,
      unmappedOrgCodes,
      warnings,
    }
  }
  if (missing.length && !createNewSubject) {
    const missingDetails = missing
      .map(({ name, organizationCode, credit }) => `${name} (${credit}) - ${organizationCode}`)
      .join("; ")

    console.error(`[Subject Error]: Versions do not exist: ${missingDetails}`)
    throw new HTTPException(400, {
      message:
        "Một hoặc nhiều phiên bản môn học không tồn tại trong hệ thống. Vui lòng kiểm tra lại dữ liệu.",
    })
  }
  return {
    map: resolved,
    unmappedOrgCodes,
    warnings,
  }
}

/** Map mã đơn vị (sMa). Mã chưa có trong DM_DonVi → bỏ qua, trả về unmappedCodes. */
export const buildOrgCodeMapOrThrow = async (prisma: PrismaClient, codes: (string | null)[]) => {
  const uniqCodes = Array.from(new Set(codes.filter((code): code is string => Boolean(code))))

  const existing = await prisma.dM_DonVi.findMany({
    where: { sMa: { in: uniqCodes } },
    select: { sMa: true, Id: true },
  })

  const unmappedCodes = uniqCodes.filter((code) => !existing.some(({ sMa }) => sMa === code))

  return {
    map: new Map(existing.map(({ sMa, Id }) => [sMa, Id])),
    unmappedCodes,
  }
}

export const buildOrgNameMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_DonVi.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Đơn vị không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildFixedClassMap = async (
  prisma: PrismaClient,
  classes: {
    name: string
    trainingCourseId: string
    curriculumVersionId: string
  }[]
) => {
  const subjectSet = new Set<string>(
    classes.map((s) => JSON.stringify([s.name, s.trainingCourseId, s.curriculumVersionId]))
  )

  const uniqueTuples = Array.from(subjectSet).map((s) => JSON.parse(s) as [string, string, string])

  const existing = await prisma.fixedClass.findMany({
    where: {
      OR: uniqueTuples.map(([name, trainingCourseId, curriculumVersionId]) => ({
        name,
        trainingCourseId,
        curriculumVersionId,
      })),
    },
    select: { id: true, name: true },
  })

  // const missing = uniqueTuples.filter(([name]) => !existing.some((cls) => cls.name === name))
  return new Map(existing.map(({ name, id }) => [name, id]))
}

export const buildLecturerTypeMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.lecturerType.findMany({
    where: { name: { in: uniqNames } },
    select: { name: true, id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some((item) => item.name === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Loại giảng viên không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ name, id }) => [name, id]))
}

export const buildDegreeTypeMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const skipValue = "Chưa xác định"
  const uniqNames = Array.from(
    new Set(names.filter((name): name is string => Boolean(name) && name !== skipValue))
  )

  const existing = await prisma.dM_HocVi.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter(
    (name) => !existing.some(({ sTen }) => sTen === name && name !== skipValue)
  )

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Học vị không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildDegreeRankTypeMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const skipValue = "Chưa xác định"

  const uniqNames = Array.from(
    new Set(names.filter((name): name is string => Boolean(name) && name !== skipValue))
  )

  const existing = await prisma.dM_HocHam.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter(
    (name) => !existing.some(({ sTen }) => sTen === name && name !== skipValue)
  )

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Học hàm không tồn tại: ${missing.join(", ")}`,
    })
  }
  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildRankMapOrThrow = async (prisma: PrismaClient, names: (string | undefined)[]) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_CapBac.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Cấp bậc không tồn tại: ${missing.join(", ")}`,
    })
  }
  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

const positionMatchScore = (
  row: { sTen: string | null; bActive?: boolean | null },
  key: string
) => (row.sTen === key ? 2 : 0) + (row.bActive !== false ? 1 : 0)

export const buildPositionMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqueNormalized = Array.from(
    new Set(names.map((name) => normalizeCatalogName(name)).filter(Boolean))
  )

  if (!uniqueNormalized.length) {
    return new Map<string, string>()
  }

  const existing = await prisma.dM_ChucVu.findMany({
    where: {
      OR: [{ bDeleted: false }, { bDeleted: null }],
    },
    select: { Id: true, sTen: true, bActive: true, iSTT: true },
  })

  const byNormalized = new Map<string, { Id: string; sTen: string | null; bActive?: boolean | null }>()
  for (const row of existing) {
    const key = normalizeCatalogName(row.sTen)
    if (!key) continue
    const current = byNormalized.get(key)
    if (!current || positionMatchScore(row, key) > positionMatchScore(current, key)) {
      byNormalized.set(key, row)
    }
  }

  const missing = uniqueNormalized.filter((name) => !byNormalized.has(name))

  if (missing.length) {
    const maxStt = existing.reduce((max, row) => Math.max(max, row.iSTT ?? 0), 0)
    const created = await prisma.dM_ChucVu.createManyAndReturn({
      data: missing.map((sTen, index) => ({
        sTen,
        sMa: sTen,
        bActive: true,
        bDeleted: false,
        dNgayTao: new Date(),
        iSTT: maxStt + index + 1,
      })),
      select: { Id: true, sTen: true },
    })

    for (const row of created) {
      byNormalized.set(normalizeCatalogName(row.sTen), row)
    }
  }

  const map = new Map<string, string>()
  for (const name of names) {
    const key = normalizeCatalogName(name)
    const id = key ? byNormalized.get(key)?.Id : undefined
    if (!key || !id) continue
    map.set(key, id)
    if (name) map.set(name, id)
  }

  return map
}

export const buildDMTruongMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  await prisma.dM_TruongDaoTaoBacDH.createMany({
    skipDuplicates: true,
    data: uniqNames.map((name) => ({ name })),
  })

  const data = await prisma.dM_TruongDaoTaoBacDH.findMany({
    where: { name: { in: uniqNames } },
    select: { name: true, id: true },
  })

  return new Map(data.map(({ name, id }) => [name, id]))
}

export const buildDMNganhMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  await prisma.dM_NganhHoc.createMany({
    skipDuplicates: true,
    data: uniqNames.map((name) => ({ name })),
  })

  const data = await prisma.dM_NganhHoc.findMany({
    where: { name: { in: uniqNames } },
    select: { name: true, id: true },
  })

  return new Map(data.map(({ name, id }) => [name, id]))
}

export const buildDMChuyenNganhMap = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  await prisma.dM_ChuyenNganhDaoTaoBacDH.createMany({
    skipDuplicates: true,
    data: uniqNames.map((name) => ({ name })),
  })

  const data = await prisma.dM_ChuyenNganhDaoTaoBacDH.findMany({
    where: { name: { in: uniqNames } },
    select: { name: true, id: true },
  })

  return new Map(data.map(({ name, id }) => [name, id]))
}

export const fetchBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const parseSignerInfo = (signerStr: string) => {
  if (!signerStr) {
    return {
      chuc_vi: "GIÁM ĐỐC",
      chuc_vi_ky_thay: "",
      quan_ham: "Trung tướng",
      ten_day_du: "Lê Minh Thái",
    }
  }

  const parts = signerStr.split(",").map((p) => p.trim())
  const role = parts[0] || ""
  const rank = parts[1] || ""
  const nameWithDegree = parts[2] || ""

  const isDirector = role.toLowerCase() === "giám đốc"

  return {
    chuc_vi: isDirector ? "GIÁM ĐỐC" : "TL. GIÁM ĐỐC",
    chuc_vi_ky_thay: isDirector ? "" : role.toUpperCase(),
    quan_ham: rank,
    ten_day_du: nameWithDegree,
  }
}

export const generateExcelFromTemplate = async (
  templateBuffer: Buffer,
  payload: { data: any }[],
  options: { showGridLines?: boolean; wrapText?: boolean } = {}
) => {
  const PAGE_BREAK_MARKER = "ngắt trang"
  const { showGridLines = true, wrapText = true } = options

  const normalizeCellValue = (value: ExcelJS.CellValue | null | undefined): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value).trim().toLowerCase()
    }
    if (value instanceof Date) {
      return value.toISOString().trim().toLowerCase()
    }
    if (typeof value === "object") {
      if ("richText" in value && Array.isArray(value.richText)) {
        return value.richText
          .map((part) => part.text)
          .join("")
          .trim()
          .toLowerCase()
      }
      if ("text" in value && typeof value.text === "string") {
        return value.text.trim().toLowerCase()
      }
      if ("result" in value && value.result !== undefined && value.result !== null) {
        return String(value.result).trim().toLowerCase()
      }
    }
    return ""
  }

  const toColumnLetter = (columnNumber: number) => {
    let result = ""
    let current = columnNumber
    while (current > 0) {
      const remainder = (current - 1) % 26
      result = String.fromCharCode(65 + remainder) + result
      current = Math.floor((current - 1) / 26)
    }
    return result || "A"
  }

  const getLastUsedDataRow = (sheet: ExcelJS.Worksheet) => {
    const n = sheet.rowCount
    for (let r = n; r >= 1; r--) {
      const row = sheet.getRow(r)
      let has = false
      row.eachCell({ includeEmpty: false }, () => {
        has = true
      })
      if (has) return r
    }
    return 1
  }

  const copySheetContent = (
    sourceSheet: ExcelJS.Worksheet,
    targetSheet: ExcelJS.Worksheet,
    startRow: number
  ) => {
    const rowOffset = startRow - 1
    let currentRowInCopy = startRow

    const lastRow = sourceSheet.rowCount

    for (let r = 1; r <= lastRow; r++) {
      const row = sourceSheet.getRow(r)
      const newRow = targetSheet.getRow(currentRowInCopy)

      if (row.height !== undefined) newRow.height = row.height
      if (row.hidden) newRow.hidden = true
      if (row.outlineLevel !== undefined) newRow.outlineLevel = row.outlineLevel

      if ((row as any).style) {
        ;(newRow as any).style = { ...(row as any).style }
      }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)
        newCell.value = cell.value

        if (cell.style) {
          newCell.style = {
            font: cell.font ? { ...cell.font } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            fill: cell.fill ? { ...cell.fill } : undefined,
            numFmt: cell.numFmt,
            protection: cell.protection ? { ...cell.protection } : undefined,
          } as ExcelJS.Style

          if (wrapText && newCell.alignment) {
            newCell.alignment.wrapText = true
          }
        }
      })

      newRow.commit()
      currentRowInCopy++
    }

    const merges = sourceSheet.model?.merges
    if (merges) {
      for (const merge of merges) {
        const [topLeft, bottomRight] = merge.split(":")
        const topMatch = topLeft?.match(/([A-Z]+)(\d+)/)
        const bottomMatch = bottomRight?.match(/([A-Z]+)(\d+)/)

        if (topMatch && bottomMatch && topMatch[2] && bottomMatch[2]) {
          const startRowNum = Number.parseInt(topMatch[2], 10) + rowOffset
          const endRowNum = Number.parseInt(bottomMatch[2], 10) + rowOffset
          const startCol = topMatch[1]
          const endCol = bottomMatch[1]
          targetSheet.mergeCells(`${startCol}${startRowNum}:${endCol}${endRowNum}`)
        }
      }
    }

    sourceSheet.getImages().forEach((image) => {
      const imgData = sourceSheet.workbook.getImage(Number(image.imageId))
      if (!imgData) return

      const newImageId = targetSheet.workbook.addImage({
        buffer: imgData.buffer as any,
        extension: imgData.extension,
      })

      const { range } = image
      if (range) {
        const editAs = (range as any).editAs
        const newRange = {
          tl: {
            ...range.tl,
            row: range.tl.row + rowOffset,
            nativeRow: (range.tl as any).nativeRow + rowOffset,
          } as any,
          br: {
            ...range.br,
            row: range.br.row + rowOffset,
            nativeRow: (range.br as any).nativeRow + rowOffset,
          } as any,
        }
        targetSheet.addImage(newImageId, {
          tl: newRange.tl,
          br: newRange.br,
          editAs: editAs as any,
        })
      }
    })

    return currentRowInCopy
  }

  const applyTemplatePageSetup = (
    source: ExcelJS.Worksheet | undefined,
    target: ExcelJS.Worksheet
  ) => {
    if (!source) return
    const src = source.pageSetup
    if (!src) return
    const dst = target.pageSetup

    if (src.margins) {
      dst.margins = { ...dst.margins, ...src.margins }
    }

    const pageSetupKeys: (keyof ExcelJS.PageSetup)[] = [
      "orientation",
      "horizontalDpi",
      "verticalDpi",
      "fitToPage",
      "fitToWidth",
      "fitToHeight",
      "scale",
      "pageOrder",
      "blackAndWhite",
      "draft",
      "cellComments",
      "errors",
      "paperSize",
      "showRowColHeaders",
      "showGridLines",
      "firstPageNumber",
      "horizontalCentered",
      "verticalCentered",
      "printTitlesRow",
      "printTitlesColumn",
    ]
    for (const key of pageSetupKeys) {
      const value = src[key]
      if (value !== undefined && value !== null) {
        ;(dst as Record<string, unknown>)[key as string] = value
      }
    }

    if (source.headerFooter) {
      target.headerFooter = { ...target.headerFooter, ...source.headerFooter }
    }

    if (source.views) {
      target.views = source.views
    }
  }

  const mergedWorkbook = new ExcelJS.Workbook()
  const outputSheet = mergedWorkbook.addWorksheet("Merged")
  outputSheet.views = [{ showGridLines }]

  const generatedSheets: ExcelJS.Worksheet[] = []
  for (const item of payload) {
    const template = new XlsxTemplate(templateBuffer)
    template.substitute(1, { ...item.data, group: (item as any).group })
    const sheetBuffer = await template.generate({ type: "nodebuffer" })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(sheetBuffer as any)
    const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0]
    if (worksheet) generatedSheets.push(worksheet)
  }

  let currentRow = 1
  for (let i = 0; i < generatedSheets.length; i++) {
    const sourceSheet = generatedSheets[i]
    if (!sourceSheet) continue
    currentRow = copySheetContent(sourceSheet, outputSheet, currentRow)
    if (i < generatedSheets.length - 1) {
      outputSheet.getRow(currentRow - 1).addPageBreak()
    }
  }

  if (generatedSheets.length > 0) {
    generatedSheets?.[0]?.columns?.forEach((col, index) => {
      if (!col) return
      const dest = outputSheet.getColumn(index + 1)
      if (col.width) dest.width = col.width
      if (col.hidden) dest.hidden = true
    })
    applyTemplatePageSetup(generatedSheets[0], outputSheet)
  }

  const finalMarkerRows: number[] = []
  for (let rowNumber = 1; rowNumber <= outputSheet.rowCount; rowNumber++) {
    const row = outputSheet.getRow(rowNumber)
    let hasPageBreakMarker = false
    row.eachCell({ includeEmpty: true }, (cell) => {
      const val = normalizeCellValue(cell.value)
      if (val === PAGE_BREAK_MARKER) {
        hasPageBreakMarker = true
        cell.value = null
      }
    })

    if (hasPageBreakMarker) {
      row.hidden = true
      finalMarkerRows.push(rowNumber)
    }
    row.commit()
  }

  const lastDataRow = getLastUsedDataRow(outputSheet)
  const maxColumn = Math.max(outputSheet.columnCount, 1)
  const maxColumnLetter = toColumnLetter(maxColumn)

  if (finalMarkerRows.length > 0) {
    const uniqueBreakRows = [...new Set(finalMarkerRows)].sort((a, b) => a - b)
    for (const markerRow of uniqueBreakRows) {
      if (markerRow > 1 && markerRow <= lastDataRow) {
        outputSheet.getRow(markerRow - 1).addPageBreak()
      }
    }
    outputSheet.pageSetup.printArea = `A1:${maxColumnLetter}${lastDataRow}`
    outputSheet.pageSetup.fitToPage = true
    outputSheet.pageSetup.fitToWidth = 1
    outputSheet.pageSetup.fitToHeight = 0
  }

  return await mergedWorkbook.xlsx.writeBuffer()
}

export const generateExcelMultiSheet = async (
  templateBuffer: Buffer,
  sheets: { sheetName?: string; payload: { data: any; group?: any }[] }[],
  options: { showGridLines?: boolean; wrapText?: boolean } = {}
) => {
  const PAGE_BREAK_MARKER = "ngắt trang"
  const { showGridLines = true, wrapText = true } = options

  const normalizeCellValue = (value: ExcelJS.CellValue | null | undefined): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value).trim().toLowerCase()
    }
    if (value instanceof Date) {
      return value.toISOString().trim().toLowerCase()
    }
    if (typeof value === "object") {
      if ("richText" in value && Array.isArray(value.richText)) {
        return value.richText
          .map((part) => part.text)
          .join("")
          .trim()
          .toLowerCase()
      }
      if ("text" in value && typeof value.text === "string") {
        return value.text.trim().toLowerCase()
      }
      if ("result" in value && value.result !== undefined && value.result !== null) {
        return String(value.result).trim().toLowerCase()
      }
    }
    return ""
  }

  const toColumnLetter = (columnNumber: number) => {
    let result = ""
    let current = columnNumber
    while (current > 0) {
      const remainder = (current - 1) % 26
      result = String.fromCharCode(65 + remainder) + result
      current = Math.floor((current - 1) / 26)
    }
    return result || "A"
  }

  const getLastUsedDataRow = (sheet: ExcelJS.Worksheet) => {
    const n = sheet.rowCount
    for (let r = n; r >= 1; r--) {
      const row = sheet.getRow(r)
      let has = false
      row.eachCell({ includeEmpty: false }, () => {
        has = true
      })
      if (has) return r
    }
    return 1
  }

  const copySheetContent = (
    sourceSheet: ExcelJS.Worksheet,
    targetSheet: ExcelJS.Worksheet,
    startRow: number
  ) => {
    const rowOffset = startRow - 1
    let currentRowInCopy = startRow
    const lastRow = sourceSheet.rowCount

    for (let r = 1; r <= lastRow; r++) {
      const row = sourceSheet.getRow(r)
      const newRow = targetSheet.getRow(currentRowInCopy)
      if (row.height !== undefined) newRow.height = row.height
      if (row.hidden) newRow.hidden = true
      if (row.outlineLevel !== undefined) newRow.outlineLevel = row.outlineLevel

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)
        newCell.value = cell.value
        if (cell.style) {
          newCell.style = JSON.parse(JSON.stringify(cell.style))
          if (wrapText && newCell.alignment) {
            newCell.alignment.wrapText = true
          }
        }
      })
      currentRowInCopy++
    }

    const merges = sourceSheet.model?.merges
    if (merges) {
      for (const merge of merges) {
        const [topLeft, bottomRight] = merge.split(":")
        const topMatch = topLeft?.match(/([A-Z]+)(\d+)/)
        const bottomMatch = bottomRight?.match(/([A-Z]+)(\d+)/)
        if (topMatch && bottomMatch && topMatch[2] && bottomMatch[2]) {
          const startRowNum = Number.parseInt(topMatch[2], 10) + rowOffset
          const endRowNum = Number.parseInt(bottomMatch[2], 10) + rowOffset
          targetSheet.mergeCells(`${topMatch[1]}${startRowNum}:${bottomMatch[1]}${endRowNum}`)
        }
      }
    }

    sourceSheet.getImages().forEach((image) => {
      const imgData = sourceSheet.workbook.getImage(Number(image.imageId))
      if (!imgData) return
      const newImageId = targetSheet.workbook.addImage({
        buffer: imgData.buffer as any,
        extension: imgData.extension,
      })
      const { range } = image
      if (range) {
        const newRange = {
          tl: {
            ...range.tl,
            row: range.tl.row + rowOffset,
            nativeRow: (range.tl as any).nativeRow + rowOffset,
          } as any,
          br: {
            ...range.br,
            row: range.br.row + rowOffset,
            nativeRow: (range.br as any).nativeRow + rowOffset,
          } as any,
        }
        targetSheet.addImage(newImageId, {
          tl: newRange.tl,
          br: newRange.br,
          editAs: (range as any).editAs,
        })
      }
    })

    return currentRowInCopy
  }

  const applyTemplatePageSetup = (
    source: ExcelJS.Worksheet | undefined,
    target: ExcelJS.Worksheet
  ) => {
    if (!source) return
    const src = source.pageSetup
    if (!src) return
    const dst = target.pageSetup
    if (src.margins) dst.margins = { ...dst.margins, ...src.margins }

    const pageSetupKeys: (keyof ExcelJS.PageSetup)[] = [
      "orientation",
      "horizontalDpi",
      "verticalDpi",
      "fitToPage",
      "fitToWidth",
      "fitToHeight",
      "scale",
      "pageOrder",
      "blackAndWhite",
      "draft",
      "cellComments",
      "errors",
      "paperSize",
      "showRowColHeaders",
      "showGridLines",
      "firstPageNumber",
      "horizontalCentered",
      "verticalCentered",
      "printTitlesRow",
      "printTitlesColumn",
    ]
    for (const key of pageSetupKeys) {
      const value = src[key]
      if (value !== undefined && value !== null) {
        ;(dst as Record<string, unknown>)[key as string] = value
      }
    }
    target.headerFooter = {
      oddHeader: "",
      oddFooter: "",
      evenHeader: "",
      evenFooter: "",
      firstHeader: "",
      firstFooter: "",
    }
  }

  const mergedWorkbook = new ExcelJS.Workbook()
  const usedSheetNames = new Set<string>()

  for (let idx = 0; idx < sheets.length; idx++) {
    const sheetData = sheets[idx]
    let name = sheetData?.sheetName || `Sheet${idx + 1}`
    name = name.replace(/[\\/?*:[\]]/g, "_").slice(0, 31)
    let suffix = 1
    let finalName = name
    while (usedSheetNames.has(finalName)) {
      const sText = `_${suffix}`
      finalName = `${name.slice(0, 31 - sText.length)}${sText}`
      suffix++
    }
    usedSheetNames.add(finalName)
    const targetSheet = mergedWorkbook.addWorksheet(finalName)
    targetSheet.views = [{ showGridLines }]

    const generatedSheets: ExcelJS.Worksheet[] = []
    for (const item of sheetData?.payload || []) {
      const template = new XlsxTemplate(templateBuffer)
      template.substitute(1, { ...item.data, group: item.group })
      const sheetBuffer = await template.generate({ type: "nodebuffer" })
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(sheetBuffer as any)
      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0]
      if (worksheet) generatedSheets.push(worksheet)
    }

    let currentRow = 1
    for (const sourceSheet of generatedSheets) {
      currentRow = copySheetContent(sourceSheet, targetSheet, currentRow)
    }

    if (generatedSheets.length > 0) {
      generatedSheets?.[0]?.columns?.forEach((col, index) => {
        if (!col) return
        const dest = targetSheet.getColumn(index + 1)
        if (col.width) dest.width = col.width
        if (col.hidden) dest.hidden = true
      })
      applyTemplatePageSetup(generatedSheets[0], targetSheet)
    }

    const finalMarkerRows: number[] = []
    for (let rowNumber = 1; rowNumber <= targetSheet.rowCount; rowNumber++) {
      const row = targetSheet.getRow(rowNumber)
      let hasMarker = false
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (normalizeCellValue(cell.value) === PAGE_BREAK_MARKER) {
          hasMarker = true
          cell.value = null
        }
      })
      if (hasMarker) {
        row.hidden = true
        finalMarkerRows.push(rowNumber)
      }
    }

    const lastDataRow = getLastUsedDataRow(targetSheet)
    const maxColumnLetter = toColumnLetter(targetSheet.columnCount || 1)
    if (finalMarkerRows.length > 0) {
      const uniqueBreakRows = [...new Set(finalMarkerRows)].sort((a, b) => a - b)
      for (const markerRow of uniqueBreakRows) {
        if (markerRow > 1 && markerRow <= lastDataRow) {
          targetSheet.getRow(markerRow - 1).addPageBreak()
        }
      }
      targetSheet.pageSetup.printArea = `A1:${maxColumnLetter}${lastDataRow}`
    }
  }

  return await mergedWorkbook.xlsx.writeBuffer()
}

export const copyWorksheet = (sourceSheet: ExcelJS.Worksheet, destSheet: ExcelJS.Worksheet) => {
  for (let i = 1; i <= sourceSheet.columnCount; i++) {
    const srcCol = sourceSheet.getColumn(i)
    const destCol = destSheet.getColumn(i)
    if (srcCol.width) destCol.width = srcCol.width
  }

  sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const destRow = destSheet.getRow(rowNumber)
    destRow.height = row.height
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const destCell = destRow.getCell(colNumber)
      if (cell.master === cell) {
        destCell.value = cell.value
      }
      if (cell.style) {
        destCell.style = JSON.parse(JSON.stringify(cell.style))
      }
    })
  })

  const sourceBreaks = (sourceSheet as any)._rowBreaks || []
  sourceBreaks.forEach((br: any) => {
    if (br && br.main) {
      destSheet.getRow(br.main).addPageBreak()
    }
  })

  if (sourceSheet.pageSetup) {
    destSheet.pageSetup = JSON.parse(JSON.stringify(sourceSheet.pageSetup))
    destSheet.pageSetup.fitToHeight = 0
    destSheet.pageSetup.fitToPage = true
  }

  const merges = (sourceSheet.model as any).merges || []
  merges.forEach((m: string) => {
    try {
      destSheet.mergeCells(m)
    } catch (err) {}
  })
}

export const getScoreClassification = (
  finalScore: number,
  scoreConverts: { base10Min: number; base10Max: number; classification: string }[] = []
) => {
  const matched = scoreConverts.find(
    (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
  )

  return matched?.classification ?? ""
}

export const formatScore = (score: Decimal | number | string | null | undefined, precision = 2) => {
  if (score === null || score === undefined || score === "") return ""
  const num = typeof score === "string" ? parseFloat(score) : Number(score)
  if (isNaN(num)) return ""
  return num.toFixed(precision).replace(".", ",")
}

const classificationShortMap: Record<string, string> = {
  "xuat sac": "XS",
  gioi: "Giỏi",
  kha: "Khá",
  "trung binh kha": "TB Khá",
  "trung binh": "TB",
  yeu: "Yếu",
  kem: "Kém",
}

export const shortenClassification = (classification?: string | null) => {
  if (!classification) return ""
  const key = classification
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim()
    .toLowerCase()
  return classificationShortMap[key] ?? classification
}
