import type { PrismaClient } from '@workspace/db'
import { HTTPException } from 'hono/http-exception'

export function parseDate(input?: number | string | Date): Date | null {
    if (!input) return null
    if (input) {
        // Check if input is a number (Excel date serial number)
        if (typeof input === 'number') {
            const excelEpoch = new Date(1899, 11, 31) // 31/12/1899 (Excel starts at 1/1/1900 = 1)
            return new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000)
        }
        // Check if input is a DD/MM/YYYY string
        if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
            const [day, month, year] = input.split('/').map(Number)
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
    const date = String(currentDate.getDate()).padStart(2, '0')
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
    const year = currentDate.getFullYear()
    return { date, month, year }
}

export const buildEthnicityMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
    const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

    const existing = await prisma.dM_DanToc.findMany({
        where: { sTen: { in: uniqNames } },
        select: { sTen: true, Id: true },
    })

    const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Dân tộc không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildNationalityMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
    const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

    const existing = await prisma.dM_QuocGia.findMany({
        where: { sTen: { in: uniqNames } },
        select: { sTen: true, Id: true },
    })

    const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Quốc gia không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildProvinceMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
    const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

    const existing = await prisma.dM_Tinh.findMany({
        where: { sTen: { in: uniqNames } },
        select: { sTen: true, Id: true },
    })

    const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Tỉnh không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildDistrictMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
    const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

    const existing = await prisma.dM_QuanHuyen.findMany({
        where: { sTen: { in: uniqNames } },
        select: { sTen: true, Id: true },
    })

    const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Huyện không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildWardMap = async (prisma: PrismaClient, names: (string | undefined)[]) => {
    const uniqNames = Array.from(new Set(names.filter((name): name is string => Boolean(name))))

    const existing = await prisma.dM_XaPhuong.findMany({
        where: { sTen: { in: uniqNames } },
        select: { sTen: true, Id: true },
    })

    const missing = uniqNames.filter((name) => !existing.some(({ sTen }) => sTen === name))

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Phường/Xã không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildCurriculumMap = async (
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

    uniqueTuples.map(([curriculum, trainingMajor, trainingField]) => ({
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
    }))

    const existing = await prisma.curriculumVersion.findMany({
        where: {
            OR: uniqueTuples.map(([curriculum, trainingMajor, trainingField]) => ({
                name: curriculum,
                ...(trainingMajor && trainingField
                    ? {
                          curriculum: {
                              trainingMajor: {
                                  name: trainingMajor,
                                  trainingField: {
                                      name: trainingField,
                                  },
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

    // TODO: upgrade biome v2
    const missing = uniqueTuples.filter(
        ([curriculum, trainingMajor, trainingField]) =>
            !existing.some(
                (version) =>
                    version.name === curriculum &&
                    (!trainingMajor || trainingMajor === version.curriculum.trainingMajor.name) &&
                    (!trainingField ||
                        trainingField === version.curriculum.trainingMajor.trainingField.name)
            )
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Chương trình đào tạo không tồn tại: ${missing
                .map(
                    ([curriculum, trainingMajor, trainingField]) =>
                        `${curriculum}${
                            trainingMajor && trainingField
                                ? ` - ${trainingMajor} - ${trainingField}`
                                : ''
                        }`
                )
                .join('; ')}`,
        })
    }

    return new Map(existing.map(({ name, id }) => [name, id]))
}
