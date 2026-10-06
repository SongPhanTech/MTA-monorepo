import type { PrismaClient } from "@workspace/db"
import { formatThangIn } from "@workspace/libs/timezone"
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
  const month = formatThangIn(currentDate.getMonth() + 1)
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

export const buildProvinceMapOrThrow = async (
  prisma: PrismaClient,
  names: (string | undefined)[]
) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  const existing = await prisma.dM_Tinh.findMany({
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

export const buildCurriculumMapOrThrow = async (
  prisma: PrismaClient,
  students: {
    curriculum: string
    trainingMajor?: string
    trainingField?: string
  }[]
) => {
  const categorySet = new Set<string>(
    students.map((s) =>
      JSON.stringify([s.curriculum, s.trainingMajor ?? null, s.trainingField ?? null])
    )
  )

  const uniqueTuples = Array.from(categorySet).map(
    (s) => JSON.parse(s) as [string, string | null, string | null]
  )

  const existing = await prisma.curriculumVersion.findMany({
    where: {
      OR: uniqueTuples.map(([curriculum, trainingMajor, trainingField]) => ({
        name: curriculum,
        ...(trainingMajor && trainingField
          ? {
              curriculum: {
                trainingMajor: {
                  name: trainingMajor,
                  trainingField: { name: trainingField },
                },
              },
            }
          : {}),
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

  const missing = uniqueTuples.filter(
    ([curriculum, trainingMajor, trainingField]) =>
      !existing.some(
        (version) =>
          version.name === curriculum &&
          (!trainingMajor || trainingMajor === version.curriculum.trainingMajor.name) &&
          (!trainingField || trainingField === version.curriculum.trainingMajor.trainingField.name)
      )
  )

  if (missing.length) {
    throw new HTTPException(400, {
      message: `Chương trình đào tạo không tồn tại: ${missing
        .map(
          ([curriculum, trainingMajor, trainingField]) =>
            `${curriculum}${
              trainingMajor && trainingField ? ` - ${trainingMajor} - ${trainingField}` : ""
            }`
        )
        .join("; ")}`,
    })
  }

  return new Map(existing.map(({ name, id }) => [name, id]))
}

export const buildTrainingBlockMapOrThrow = async (prisma: PrismaClient, names: string[]) => {
  const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

  // await prisma.trainingBlock.createMany({
  //     data: uniqNames.map((name) => ({ name })),
  //     skipDuplicates: true,
  // })

  const existing = await prisma.trainingBlock.findMany({
    where: { name: { in: uniqNames, mode: "insensitive" } },
    select: { name: true, id: true },
  })

  const missing = uniqNames.filter((name) => !existing.some((item) => item.name === name))

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

export const buildSubjectMapOrThrow = async (
  prisma: PrismaClient,
  subjects: { name: string; organizationCode?: string; credit?: number }[]
) => {
  const subjectSet = new Set<string>(
    subjects.map((s) => JSON.stringify([s.name, s.organizationCode ?? null, s.credit ?? null]))
  )

  const uniqueTuples = Array.from(subjectSet).map(
    (s) => JSON.parse(s) as [string, string | null, number | null]
  )

  const existing = await prisma.subjectVersion.findMany({
    where: {
      OR: uniqueTuples.map(([name, organizationCode, credit]) => ({
        name,
        ...(organizationCode ? { managementOrganization: { sMa: organizationCode } } : {}),
        ...(credit ? { credit } : {}),
      })),
    },
    select: { id: true, name: true },
  })

  const missing = uniqueTuples.filter(
    ([name]) => !existing.some((version) => version.name === name)
  )

  // const orgMap = await buildOrganizationMapOrThrow(
  //     prisma,
  //     subjects.map((s) => s.organizationCode || null)
  // )

  if (missing.length) {
    // for (const subject of missing) {
    //     console.log(subject[0], subject[1], subject[2], orgMap.get(subject[1]))

    //     const managementOrganizationId = orgMap.get(subject[1]) || null

    //     const a = await prisma.subjectVersion.create({
    //         data: {
    //             name: subject[0],
    //             examType: ExamType.OfflineWritten,
    //             credit: subject[2] as number,
    //             ...(managementOrganizationId
    //                 ? {
    //                       managementOrganization: {
    //                           connect: { Id: managementOrganizationId },
    //                       },
    //                   }
    //                 : {}),
    //             subject: {
    //                 connectOrCreate: {
    //                     where: { name: subject[0] },
    //                     create: { name: subject[0], managementOrganizationId },
    //                 },
    //             },
    //         },
    //         select: { id: true, name: true },
    //     })
    // }

    throw new HTTPException(400, {
      message: `Phiên bản môn học không tồn tại: ${missing
        .map(
          ([name, organizationCode, credit]) =>
            `${name}${` (${credit})` || ""}${organizationCode ? ` - ${organizationCode}` : ""}`
        )
        .join("; ")}`,
    })
  }

  return new Map(existing.map(({ name, id }) => [name, id]))
}

export const buildOrganizationMapOrThrow = async (
  prisma: PrismaClient,
  codes: (string | null)[]
) => {
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

export const buildFixedClassMap = async (
  prisma: PrismaClient,
  classes: { name: string; trainingCourseId: string; curriculumVersionId: string }[]
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
