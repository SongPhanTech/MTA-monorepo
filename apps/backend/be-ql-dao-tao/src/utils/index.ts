import type { $Enums, PrismaClient } from "@workspace/db"
import { HTTPException } from "hono/http-exception"

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

  // await prisma.trainingBlock.createMany({
  //     data: uniqNames.map((name) => ({ name })),
  //     skipDuplicates: true,
  // })

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
    throw new HTTPException(400, {
      message: `Khối kiến thức không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ name, id }) => [name, id]))

  // // Normalize existing names to lowercase for case-insensitive matching
  // const existingMap = new Map(existing.map(({ name, id }) => [name.toLowerCase(), id]))

  // // Build result map using the original uniqNames
  // const result = new Map<string, string>()
  // for (const name of uniqNames) {
  //     const id = existingMap.get(name.toLowerCase())
  //     if (id) {
  //         result.set(name, id)
  //     }
  // }

  // return result
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
  const subjectSet = new Set<string>(subjects.map((s) => JSON.stringify(s)))
  const uniqueSubject = Array.from(subjectSet).map((s) => JSON.parse(s) as SubjectData)

  const orgMap = await buildOrgCodeMapOrThrow(
    prisma,
    subjects.map((s) => s.organizationCode || null)
  )

  const existingCode = await prisma.subjectVersion.findMany({
    where: {
      code: { in: subjects.map((s) => s.code).filter((c): c is string => Boolean(c)) },
    },
  })

  const codeConflicts = uniqueSubject.filter((s) => {
    if (!s.code) return false
    const existing = existingCode.find((e) => e.code === s.code)
    if (!existing) return false
    return (
      existing.trainingObjectTypeId !== s.trainingObjectTypeId ||
      existing.name !== s.name ||
      existing.credit !== s.credit ||
      existing.period !== s.period ||
      existing.managementOrganizationId !== orgMap.get(s.organizationCode || null)
    )
  })

  if (codeConflicts.length > 0) {
    throw new HTTPException(400, {
      message: `Mã học phần đã tồn tại với thông tin khác: ${Array.from(
        new Set(codeConflicts.map((s) => s.code))
      ).join(", ")}`,
    })
  }

  const existingCombination = await prisma.subjectVersion.findMany({
    where: {
      OR: uniqueSubject.map((s) => ({
        trainingObjectTypeId: s.trainingObjectTypeId,
        name: s.name,
        credit: s.credit,
        period: s.period,
        managementOrganizationId: orgMap.get(s.organizationCode || null),
      })),
    },
  })

  const combinationConflicts = uniqueSubject.filter((s) => {
    const existing = existingCombination.find(
      (e) =>
        e.trainingObjectTypeId === s.trainingObjectTypeId &&
        e.name === s.name &&
        e.credit === s.credit &&
        e.period === s.period &&
        e.managementOrganizationId === orgMap.get(s.organizationCode || null) &&
        e.code !== null &&
        e.code !== s.code
    )
    return !!existing
  })

  if (combinationConflicts.length > 0) {
    throw new HTTPException(400, {
      message: `Học phần đã tồn tại với mã khác: ${Array.from(
        new Set(combinationConflicts.map((s) => s.name))
      ).join(", ")}`,
    })
  }

  const existing = await prisma.subjectVersion.findMany({
    where: {
      OR: uniqueSubject.map((s) => ({
        name: s.name,
        trainingObjectTypeId: s.trainingObjectTypeId,
        ...(s.code ? { code: s.code } : {}),
        ...(orgMap.get(s.organizationCode || null)
          ? { managementOrganizationId: orgMap.get(s.organizationCode || null) }
          : {}),
        credit: s.credit,
        OR: [{ period: s.period }, { period: null }],
        // TODO: correct this
        // examType: s.examType,
        // type: s.type,
        // schedulePeriod: s.schedulePeriod,
        // ...(s.numberOfTheory ? { numberOfTheory: s.numberOfTheory } : {}),
        // ...(s.numberOfPractical ? { numberOfPractical: s.numberOfPractical } : {}),
        // ...(s.numberOfSelfStudy ? { numberOfSelfStudy: s.numberOfSelfStudy } : {}),
        // ...(s.numberOfPractice ? { numberOfPractice: s.numberOfPractice } : {}),
        // ...(s.numberOfReview ? { numberOfReview: s.numberOfReview } : {}),
        // ...(s.numberOfExam ? { numberOfExam: s.numberOfExam } : {}),
      })),
    },
    select: { id: true, code: true },
  })

  const missing = uniqueSubject.filter(
    ({ code }) => !existing.some((version) => version.code === code)
  )

  if (missing.length && createNewSubject) {
    const newSubjects = await prisma.$transaction(async (tx) => {
      await tx.subject.createMany({
        data: missing.map((s) => ({
          name: s.name,
          managementOrganizationId: orgMap.get(s.organizationCode || null),
        })),
        skipDuplicates: true,
      })

      const subjectGroup = await tx.subject.findMany({
        where: { name: { in: missing.map((s) => s.name) } },
        select: { id: true, name: true },
      })

      const groupMap = new Map(subjectGroup.map((s) => [s.name, s.id]))

      return await tx.subjectVersion.createManyAndReturn({
        data: missing.map((subject) => ({
          name: subject.name,
          trainingObjectTypeId: subject.trainingObjectTypeId,
          credit: subject.credit,
          code: subject.code,
          codeTkb: subject.code,
          examType: subject.examType,
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
          ...(orgMap.get(subject.organizationCode || null)
            ? {
                managementOrganizationId: orgMap.get(subject.organizationCode || null),
              }
            : {}),
          subjectId: groupMap.get(subject.name) as string,
        })),
        select: { id: true, code: true },
      })
    })

    return new Map([...existing, ...newSubjects].map(({ code, id }) => [code, id]))
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
  return new Map(existing.map(({ code, id }) => [code, id]))
}

export const buildOrgCodeMapOrThrow = async (prisma: PrismaClient, codes: (string | null)[]) => {
  const uniqCodes = Array.from(new Set(codes.filter((code): code is string => Boolean(code))))

  const existing = await prisma.dM_DonVi.findMany({
    where: { sMa: { in: uniqCodes } },
    select: { sMa: true, Id: true },
  })

  const missing = uniqCodes.filter((code) => !existing.some(({ sMa }) => sMa === code))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Đơn vị không tồn tại: ${missing.join(", ")}`,
    })
  }

  return new Map(existing.map(({ sMa, Id }) => [sMa, Id]))
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

export const buildPositionMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))
  console.log(uniqNames)

  const existing = await prisma.dM_ChucVu.findMany({
    where: { sTen: { in: uniqNames } },
    select: { sTen: true, Id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Chức vụ không tồn tại: ${missing.join(", ")}`,
    })
  }
  return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
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
