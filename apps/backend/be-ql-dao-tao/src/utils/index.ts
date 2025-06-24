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
            if (
                year !== undefined &&
                month !== undefined &&
                day !== undefined
            ) {
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

export const buildEthnicityMap = async (
    prisma: PrismaClient,
    names: (string | undefined)[]
) => {
    const namesSet = Array.from(
        new Set(names.filter((name): name is string => Boolean(name)))
    )

    const existing = await prisma.dM_DanToc.findMany({
        where: { sTen: { in: Array.from(namesSet) } },
        select: { sTen: true, Id: true },
    })

    const missing = namesSet.filter(
        (name) => !existing.some(({ sTen }) => sTen === name)
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Dân tộc không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildNationalityMap = async (
    prisma: PrismaClient,
    names: (string | undefined)[]
) => {
    const namesSet = Array.from(
        new Set(names.filter((name): name is string => Boolean(name)))
    )

    const existing = await prisma.dM_QuocGia.findMany({
        where: { sTen: { in: Array.from(namesSet) } },
        select: { sTen: true, Id: true },
    })

    const missing = namesSet.filter(
        (name) => !existing.some(({ sTen }) => sTen === name)
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Quốc gia không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildProvinceMap = async (
    prisma: PrismaClient,
    names: (string | undefined)[]
) => {
    const namesSet = Array.from(
        new Set(names.filter((name): name is string => Boolean(name)))
    )

    const existing = await prisma.dM_Tinh.findMany({
        where: { sTen: { in: Array.from(namesSet) } },
        select: { sTen: true, Id: true },
    })

    const missing = namesSet.filter(
        (name) => !existing.some(({ sTen }) => sTen === name)
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Tỉnh không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildDistrictMap = async (
    prisma: PrismaClient,
    names: (string | undefined)[]
) => {
    const namesSet = Array.from(
        new Set(names.filter((name): name is string => Boolean(name)))
    )

    const existing = await prisma.dM_QuanHuyen.findMany({
        where: { sTen: { in: Array.from(namesSet) } },
        select: { sTen: true, Id: true },
    })

    const missing = namesSet.filter(
        (name) => !existing.some(({ sTen }) => sTen === name)
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Huyện không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}

export const buildWardMap = async (
    prisma: PrismaClient,
    names: (string | undefined)[]
) => {
    const namesSet = Array.from(
        new Set(names.filter((name): name is string => Boolean(name)))
    )

    const existing = await prisma.dM_XaPhuong.findMany({
        where: { sTen: { in: Array.from(namesSet) } },
        select: { sTen: true, Id: true },
    })

    const missing = namesSet.filter(
        (name) => !existing.some(({ sTen }) => sTen === name)
    )

    if (missing.length) {
        throw new HTTPException(400, {
            message: `Phường/Xã không tồn tại: ${missing.join(', ')}`,
        })
    }

    return new Map(existing.map(({ sTen, Id }) => [sTen, Id]))
}
