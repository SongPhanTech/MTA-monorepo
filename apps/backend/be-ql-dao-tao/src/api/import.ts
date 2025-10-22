import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import { postDMNhanViens, putDMNhanViens } from '@workspace/libs/api/system'
import { parseSheetLecturer, zParseSheetError } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
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

    const existingLecturer = await prisma.lecturer.findMany({
        where: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } },
        select: { id: true, code: true, userProfileId: true },
    })

    const existingLecturerMap = new Map(
        existingLecturer.map(({ code, id, userProfileId }) => [code, { id, userProfileId }])
    )

    const start = Date.now()
    await prisma.$transaction(
        async (tx) => {
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

                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
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

                const existing = existingLecturerMap.get(lecturer.code)
                if (existing) {
                    await tx.lecturer.update({
                        where: { id: existing.id },
                        data: {
                            ...lecturerData,
                            userProfile: { update: profileData },
                        },
                    })

                    putDMNhanViens(
                        {
                            Id: existing.userProfileId,
                            sMa: lecturer.idCardNumber,
                            bLaHocVien: true,
                            bLaTaiKhoan: true,
                            dNgaySinh: lecturer.dateOfBirth
                                ? new Date(lecturer.dateOfBirth)?.toISOString()
                                : null,
                            sCCCD: lecturer.idCardNumber,
                            sHoVaDem: profileData.lastName,
                            sTen: profileData.firstName,
                            sTenDayDu: lecturer.fullname,
                            sSDTDiDong: lecturer.phoneNumber ?? '',
                            // TODO: fix this
                            sDM_DonViId: 'e701b807-c390-45ff-a5c8-123f708ee0e1',
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
                        .then((res) => {
                            console.log('[LSB create User]:', res.status, res.data)
                        })
                        .catch(console.error)
                } else {
                    const profileId = crypto.randomUUID()
                    await tx.lecturer.create({
                        data: {
                            ...lecturerData,
                            userProfile: {
                                connectOrCreate: {
                                    where: { idCardNumber: lecturer.idCardNumber },
                                    create: { id: profileId, ...profileData },
                                },
                            },
                        },
                    })

                    postDMNhanViens(
                        {
                            Id: profileId,
                            sMa: lecturer.idCardNumber,
                            bLaHocVien: true,
                            bLaTaiKhoan: true,
                            dNgaySinh: lecturer.dateOfBirth
                                ? new Date(lecturer.dateOfBirth)?.toISOString()
                                : null,
                            sCCCD: lecturer.idCardNumber,
                            sHoVaDem: profileData.lastName,
                            sTen: profileData.firstName,
                            sTenDayDu: lecturer.fullname,
                            sSDTDiDong: lecturer.phoneNumber ?? '',
                            // TODO: fix this
                            sDM_DonViId: 'e701b807-c390-45ff-a5c8-123f708ee0e1',
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
                        .then((res) => {
                            console.log('[LSB create User]:', res.status, res.data)
                        })
                        .catch(console.error)
                }
            }
        },
        { timeout: timeout * 1000 }
    )

    return c.json(
        {
            message: `Import lecturers successfully: ${data.lecturers.length}`,
            time: Date.now() - start,
        },
        200
    )
})

export default app
