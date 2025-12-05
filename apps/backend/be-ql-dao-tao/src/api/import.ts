import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import { postDMNhanViens, putDMNhanViens } from '@workspace/libs/api/system'
import { parseSheetLecturer, zParseSheetError } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import type { ErrorExtra } from '../types/error-extra'
import {
    buildDegreeRankTypeMapOrThrow,
    buildDegreeTypeMapOrThrow,
    buildGenderMapOrThrow,
    buildLecturerTypeMapOrThrow,
    buildOrgNameMapOrThrow,
} from '../utils'

const app = new OpenAPIHono({ strict: false })

const importLecturer = createRoute({
    operationId: 'import-lecturer',
    tags: ['Import'],
    path: '/import-lecturer',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import successfully',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string(), time: z.number() }),
                },
            },
        },
        400: {
            description: 'Invalid file type',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        errors: z.array(zParseSheetError).optional(),
                    }),
                },
            },
        },
    },
})

app.openapi(importLecturer, async (c) => {
    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetLecturer(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.lecturers.map(({ gender }) => gender)
    )

    const lecturerTypeMap = await buildLecturerTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ lecturerType }) => lecturerType)
    )

    const degreeTypeMap = await buildDegreeTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ degreeType }) => degreeType)
    )

    const degreeRankTypeMap = await buildDegreeRankTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ degreeRankType }) => degreeRankType)
    )

    const organizationMap = await buildOrgNameMapOrThrow(
        prisma,
        data.lecturers.map(({ departmentOrganization }) => departmentOrganization)
    )

    const existingProfiles = await prisma.userProfile.findMany({
        where: {
            idCardNumber: {
                in: data.lecturers.map((lecturer) => lecturer.idCardNumber),
            },
        },
        select: { id: true, idCardNumber: true },
    })

    const existingProfileMap = new Map(
        existingProfiles.map(({ idCardNumber, id }) => [idCardNumber, id])
    )

    const existingLecturer = await prisma.lecturer.findMany({
        where: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } },
        select: { id: true, code: true, userProfileId: true },
    })

    const existingLecturerMap = new Map(
        existingLecturer.map(({ code, id, userProfileId }) => [code, { id, userProfileId }])
    )

    const start = Date.now()
    // await prisma.$transaction(
    //     async (tx) => {
    for (const lecturer of data.lecturers) {
        const lecturerData: Prisma.LecturerCreateInput = {
            from: new Date(),
            code: lecturer.code,
            lecturerType: {
                connect: { id: lecturerTypeMap.get(lecturer.lecturerType) },
            },
            organization: {
                connect: {
                    Id: organizationMap.get(lecturer.departmentOrganization),
                },
            },
            userProfile: {},
            description: lecturer.description,
        }

        const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(lecturer.fullname),
            dateOfBirth: lecturer.dateOfBirth,
            genderId: genderMap.get(lecturer.gender),
            academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ''),
            academicRankTypeId: degreeRankTypeMap.get(lecturer.degreeRankType ?? ''),
            currentAddress: lecturer.currentAddress,
            phoneNumber: lecturer.phoneNumber,
            email: lecturer.email,
            idCardNumber: lecturer.idCardNumber,
        }

        const existingProfileId = existingProfileMap.get(lecturer.idCardNumber)
        if (existingProfileId) {
            const res = await putDMNhanViens(
                {
                    Id: existingProfileId,
                    sMa: lecturer.code,
                    bLaGiangVien: true,
                    bLaCanBoNhanVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: lecturer.dateOfBirth
                        ? new Date(lecturer.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: lecturer.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: lecturer.fullname,
                    sSDTDiDong: lecturer.phoneNumber ?? '',
                    sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                    sEmail: lecturer.email,
                    sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )

            const existing = existingLecturerMap.get(lecturer.code)
            if (existing) {
                console.log('[LSB update User]:', res.status, res.data, res.data?.extra?.data)
                if (res.status === 200) {
                    await prisma.lecturer.update({
                        where: { id: existing.id },
                        data: {
                            ...lecturerData,
                            userProfile: { update: profileData },
                        },
                    })
                } else {
                    const extra = res.data?.extra as ErrorExtra | undefined
                    return c.json(
                        { message: extra?.message || [extra?.code, extra?.data].join(' ') },
                        400
                    )
                }
            } else {
                await prisma.lecturer.create({
                    data: {
                        ...lecturerData,
                        userProfile: {
                            connectOrCreate: {
                                where: { idCardNumber: lecturer.idCardNumber },
                                create: { id: res.data as string, ...profileData },
                            },
                        },
                    },
                })
            }
        } else {
            // const profileId = crypto.randomUUID()
            const res = await postDMNhanViens(
                {
                    // Id: profileId,
                    sMa: lecturer.idCardNumber,
                    bLaGiangVien: true,
                    bLaCanBoNhanVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: lecturer.dateOfBirth
                        ? new Date(lecturer.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: lecturer.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: lecturer.fullname,
                    sSDTDiDong: lecturer.phoneNumber ?? '',
                    sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                    sEmail: lecturer.email,
                    sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )

            console.log('[LSB create User]:', res.status, res.data, res.data?.extra?.data.Master)
            if (res.status === 200) {
                await prisma.lecturer.create({
                    data: {
                        ...lecturerData,
                        userProfile: {
                            connectOrCreate: {
                                where: { idCardNumber: lecturer.idCardNumber },
                                create: { id: res.data as string, ...profileData },
                            },
                        },
                    },
                })
            } else {
                const extra = res.data?.extra as ErrorExtra | undefined
                return c.json(
                    { message: extra?.message || [extra?.code, extra?.data].join(' ') },
                    400
                )
            }
        }
    }
    //     },
    //     { timeout: timeout * 1000 }
    // )

    return c.json(
        {
            message: `Import lecturers successfully: ${data.lecturers.length}`,
            time: Date.now() - start,
        },
        200
    )
})

export default app
