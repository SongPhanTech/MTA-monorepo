import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import { postDMNhanViens, putDMNhanViens } from '@workspace/libs/api/system'
import {
    parseSheetHeQuanSu,
    parseSheetInternship,
    parseSheetLecturer,
    parseSheetStudent,
    zParseSheetError,
} from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import type { ErrorExtra } from '../types/error-extra'
import {
    buildCurriculumMapOrThrow,
    buildDegreeRankTypeMapOrThrow,
    buildDegreeTypeMapOrThrow,
    buildDMChuyenNganhMap,
    buildDMNganhMap,
    buildDMTruongMap,
    buildEthnicityMapOrThrow,
    buildGenderMapOrThrow,
    buildLecturerTypeMapOrThrow,
    buildNationalityMapOrThrow,
    buildNewProvinceMapOrThrow,
    buildOrgNameMapOrThrow,
    buildPositionMapOrThrow,
    buildRankMapOrThrow,
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
    const start = Date.now()

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
        select: {
            id: true,
            code: true,
            userProfileId: true,
            userProfile: {
                select: { idCardNumber: true },
            },
        },
    })

    const existingLecturerMap = new Map(
        existingLecturer.map(({ code, id, userProfileId, userProfile }) => [
            code,
            { id, userProfileId, idCardNumber: userProfile.idCardNumber },
        ])
    )

    const existingLecturerByCCCD = await prisma.lecturer.findMany({
        where: {
            userProfile: {
                idCardNumber: {
                    in: data.lecturers.map((lecturer) => lecturer.idCardNumber),
                },
            },
        },
        select: {
            id: true,
            code: true,
            userProfileId: true,
            userProfile: {
                select: { idCardNumber: true },
            },
        },
    })

    const existingLecturerByCCCDMap = new Map(
        existingLecturerByCCCD
            .filter(({ userProfile }) => userProfile.idCardNumber)
            .map(({ code, id, userProfileId, userProfile }) => [
                userProfile.idCardNumber,
                { id, code, userProfileId },
            ])
    )

    // validate duplicate lecturer.code identify by lecturer.userProfile.idCardNumber
    const duplicateCode: string[] = []
    for (const l of data.lecturers) {
        const existingLecturer = existingLecturerMap.get(l.code)
        if (
            existingLecturer &&
            existingLecturer.idCardNumber &&
            existingLecturer.idCardNumber !== l.idCardNumber
        ) {
            duplicateCode.push(l.code)
        }
    }

    if (duplicateCode.length) {
        return c.json({ message: 'Mã giảng viên đã tồn tại', errors: duplicateCode }, 400)
    }
    const cccdCount = new Map<string, string[]>()
    for (const l of data.lecturers) {
        if (!l.idCardNumber) continue
        const codes = cccdCount.get(l.idCardNumber) ?? []
        codes.push(l.code)
        cccdCount.set(l.idCardNumber, codes)
    }
    const duplicateCCCD = [...cccdCount.entries()]
        .filter(([, codes]) => codes.length > 1)
        .map(([cccd, codes]) => `CCCD ${cccd} bị trùng ở mã GV: ${codes.join(', ')}`)
    if (duplicateCCCD.length) {
        return c.json({ message: 'Số CCCD bị trùng trong file Excel', errors: duplicateCCCD }, 400)
    }

    const importErrors: { code: string; name: string; error: string }[] = []

    try {
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
                            bLaGiangVien: true,
                            bLaCanBoNhanVien: true,
                            dateOfBirth: lecturer.dateOfBirth,
                            genderId: genderMap.get(lecturer.gender),
                            academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ''),
                            academicRankTypeId: degreeRankTypeMap.get(
                                lecturer.degreeRankType ?? ''
                            ),
                            currentAddress: lecturer.currentAddress,
                            phoneNumber: lecturer.phoneNumber,
                            email: lecturer.email,
                            idCardNumber: lecturer.idCardNumber,
                        }

                    const existingProfileId = existingProfileMap.get(lecturer.idCardNumber)
                    try {
                        if (existingProfileId) {
                            const existing = existingLecturerMap.get(lecturer.code)
                            if (existing) {
                                const existingLecturerData = await tx.lecturer.findUnique({
                                    where: { id: existing.id },
                                    include: { userProfile: true },
                                })

                                if (existingLecturerData) {
                                    const validationErrors: string[] = []

                                    const existingProfile = existingLecturerData.userProfile
                                    if (
                                        existingProfile.firstName &&
                                        profileData.firstName !== existingProfile.firstName
                                    ) {
                                        validationErrors.push(
                                            `Không được đổi Tên (hiện tại: "${existingProfile.firstName}")`
                                        )
                                    }
                                    if (
                                        existingProfile.lastName &&
                                        profileData.lastName !== existingProfile.lastName
                                    ) {
                                        validationErrors.push(
                                            `Không được đổi Họ và đệm (hiện tại: "${existingProfile.lastName}")`
                                        )
                                    }
                                    if (
                                        existingProfile.phoneNumber &&
                                        profileData.phoneNumber !== existingProfile.phoneNumber
                                    ) {
                                        validationErrors.push(
                                            `Không được đổi Số điện thoại (hiện tại: "${existingProfile.phoneNumber}")`
                                        )
                                    }
                                    if (validationErrors.length > 0) {
                                        importErrors.push({
                                            code: lecturer.code,
                                            name: lecturer.fullname,
                                            error: validationErrors.join('; '),
                                        })
                                        continue
                                    }
                                }
                            }

                            const payload = {
                                Id: existingProfileId,
                                sMa: lecturer.code,
                                bLaGiangVien: true,
                                bLaCanBoNhanVien: true,
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
                                sDM_GioiTinhId: lecturer.gender
                                    ? genderMap.get(lecturer.gender)
                                    : null,
                            }

                            const res = await putDMNhanViens(payload, {
                                headers: {
                                    'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                                    'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                                },
                            })

                            if (existing) {
                                if (res.status === 200) {
                                    await tx.lecturer.update({
                                        where: { id: existing.id },
                                        data: {
                                            ...lecturerData,
                                            userProfile: { update: profileData },
                                        },
                                    })
                                } else {
                                    const extra = res.data?.extra as ErrorExtra | undefined
                                    const errMsg =
                                        extra?.message ||
                                        [extra?.code, extra?.data].join(' ') ||
                                        `LSB API error: ${res.status}`
                                    importErrors.push({
                                        code: lecturer.code,
                                        name: lecturer.fullname,
                                        error: errMsg,
                                    })
                                }
                            } else {
                                const lecturerByCCCD = existingLecturerByCCCDMap.get(
                                    lecturer.idCardNumber
                                )

                                if (lecturerByCCCD) {
                                    importErrors.push({
                                        code: lecturer.code,
                                        name: lecturer.fullname,
                                        error: `CCCD "${lecturer.idCardNumber}" đã liên kết với giảng viên mã "${lecturerByCCCD.code}". Không thể tạo giảng viên mới hoặc đổi mã GV với CCCD này.`,
                                    })
                                    continue
                                }

                                if (res.status === 200) {
                                    if (typeof res.data !== 'string' || !res.data) {
                                        const errMsg = `LSB trả về dữ liệu không hợp lệ (mã GV: ${lecturer.code})`
                                        importErrors.push({
                                            code: lecturer.code,
                                            name: lecturer.fullname,
                                            error: errMsg,
                                        })
                                    } else {
                                        await tx.lecturer.create({
                                            data: {
                                                ...lecturerData,
                                                userProfile: {
                                                    connectOrCreate: {
                                                        where: {
                                                            idCardNumber: lecturer.idCardNumber,
                                                        },
                                                        create: { id: res.data, ...profileData },
                                                    },
                                                },
                                            },
                                        })
                                    }
                                } else {
                                    const extra = res.data?.extra as ErrorExtra | undefined
                                    const errMsg =
                                        extra?.message ||
                                        [extra?.code, extra?.data].join(' ') ||
                                        `LSB API error: ${res.status}`
                                    importErrors.push({
                                        code: lecturer.code,
                                        name: lecturer.fullname,
                                        error: errMsg,
                                    })
                                }
                            }
                        } else {
                            // const profileId = crypto.randomUUID()
                            const payload = {
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
                                sDM_GioiTinhId: lecturer.gender
                                    ? genderMap.get(lecturer.gender)
                                    : null,
                            }

                            const res = await postDMNhanViens(payload, {
                                headers: {
                                    'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                                    'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                                },
                            })

                            if (res.status === 200) {
                                // Validate res.data is a string ID before using it
                                if (typeof res.data !== 'string' || !res.data) {
                                    const errMsg = `LSB trả về dữ liệu không hợp lệ (mã GV: ${lecturer.code})`
                                    importErrors.push({
                                        code: lecturer.code,
                                        name: lecturer.fullname,
                                        error: errMsg,
                                    })
                                } else {
                                    await tx.lecturer.create({
                                        data: {
                                            ...lecturerData,
                                            userProfile: {
                                                connectOrCreate: {
                                                    where: {
                                                        id: res.data,
                                                        // idCardNumber: lecturer.idCardNumber,
                                                    },
                                                    create: { id: res.data, ...profileData },
                                                },
                                            },
                                        },
                                    })
                                }
                            } else {
                                const extra = res.data?.extra as ErrorExtra | undefined
                                const errMsg =
                                    extra?.message ||
                                    [extra?.code, extra?.data].join(' ') ||
                                    `LSB API error: ${res.status}`
                                importErrors.push({
                                    code: lecturer.code,
                                    name: lecturer.fullname,
                                    error: errMsg,
                                })
                            }
                        }
                    } catch (error) {
                        const errMsg = error instanceof Error ? error.message : String(error)
                        importErrors.push({
                            code: lecturer.code,
                            name: lecturer.fullname,
                            error: errMsg,
                        })
                    }
                }

                // Nếu có lỗi, throw để rollback transaction
                if (importErrors.length > 0) {
                    throw new Error(JSON.stringify(importErrors))
                }
            },
            { timeout: timeout * 1000 }
        )
    } catch (error) {
        // Parse errors from transaction
        if (error instanceof Error && error.message.startsWith('[')) {
            try {
                const errors = JSON.parse(error.message) as {
                    code: string
                    name: string
                    error: string
                }[]
                return c.json(
                    {
                        message: 'Có lỗi xảy ra khi import - Không lưu dữ liệu nào',
                        failed: errors,
                    },
                    400
                )
            } catch {
                // If parsing fails, fall through to generic error
            }
        }
        console.error('[IMPORT TRANSACTION ERROR]', error)
        return c.json(
            {
                message: `Có lỗi xảy ra khi import: ${error instanceof Error ? error.message : String(error)}`,
            },
            400
        )
    }

    const successCount = data.lecturers.length
    return c.json(
        {
            message: `Nhập giảng viên thành công: ${successCount}/${data.lecturers.length}`,
            time: Date.now() - start,
        },
        200
    )
})

const importStudent = createRoute({
    operationId: 'import-student',
    tags: ['Student'],
    path: '/import-student',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        createCurriculumVersion: z.preprocess(
                            (val) => val === 'true' || val === true, 
                            z.boolean()
                        ).optional().default(false),
                        timeout: z.coerce.number().default(30),
                    }).openapi('ImportStudentRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import Student successfully',
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

app.openapi(importStudent, async (c) => {
    const { file, createCurriculumVersion, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetStudent(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const trainingObjectType = await prisma.trainingObjectType.findFirst({
        where: { name: data.trainingObjectType as string, active: true },
    })

    if (!trainingObjectType) {
        return c.json(
            { message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}` },
            400
        )
    }

    const trainingCourse = await prisma.trainingCourse.findFirst({
        where: {
            deletedAt: null,
            active: true,
            OR: [
                {
                    trainingObjectTypeId: trainingObjectType.id,
                    name: data.trainingCourse as string,
                },
                {
                    trainingObjectTypeId: trainingObjectType.id,
                    code: data.trainingCourse as string,
                },
            ],
        },
    })

    if (!trainingCourse) {
        return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.students.map((student) => student.gender)
    )

    const ethnicityMap = await buildEthnicityMapOrThrow(
        prisma,
        data.students.map((student) => student.ethnicity)
    )

    const nationalityMap = await buildNationalityMapOrThrow(
        prisma,
        data.students.map((student) => student.nationality)
    )

    const provinceMap = await buildNewProvinceMapOrThrow(
        prisma,
        data.students.map((student) => student.provinceHometown)
    )

    const rankMap = await buildRankMapOrThrow(
        prisma,
        data.students.map((student) => student.rank)
    )

    const positionMap = await buildPositionMapOrThrow(
        prisma,
        data.students.map((student) => student.position)
    )

    const managementOrganizationMap = createCurriculumVersion
        ? await buildOrgNameMapOrThrow(
              prisma,
              data.students.map((student) => student.managementOrganization)
          )
        : null

    const classConsistencyMap = new Map<
        string,
        { className: string; curriculum: string; managementOrganization: string }
    >()
    const inconsistentClassCodes = new Set<string>()

    for (const student of data.students) {
        if (!student.fixedClassCode) continue

        const existing = classConsistencyMap.get(student.fixedClassCode)
        if (existing) {
            if (
                existing.className !== student.fixedClass ||
                existing.curriculum !== student.curriculum ||
                existing.managementOrganization !== student.managementOrganization
            ) {
                inconsistentClassCodes.add(student.fixedClassCode)
            }
        } else {
            classConsistencyMap.set(student.fixedClassCode, {
                className: student.fixedClass,
                curriculum: student.curriculum,
                managementOrganization: student.managementOrganization,
            })
        }
    }

    if (inconsistentClassCodes.size > 0) {
        return c.json(
            {
                message: `Thông tin lớp không nhất quán (Tên lớp, CTĐT hoặc đơn vị quản lý khác nhau cho cùng mã lớp): ${Array.from(
                    inconsistentClassCodes
                ).join(', ')}`,
            },
            400
        )
    }

    const curriculumClassMap = new Map<string, Set<string>>()
    for (const student of data.students) {
        if (!curriculumClassMap.has(student.curriculum)) {
            curriculumClassMap.set(student.curriculum, new Set())
        }
        curriculumClassMap.get(student.curriculum)?.add(student.fixedClass)
    }

    const invalidCurriculums: string[] = []
    for (const [curriculum, classes] of curriculumClassMap) {
        if (classes.size > 1) {
            invalidCurriculums.push(`${curriculum} (Các lớp ${Array.from(classes).join(', ')})`)
        }
    }

    if (invalidCurriculums.length > 0) {
        return c.json(
            {
                message: `Một phiên bản chương trình đào tạo không thể thuộc nhiều lớp: ${invalidCurriculums.join('; ')}`,
            },
            400
        )
    }

    const conflicts = await prisma.fixedClass.findMany({
        where: {
            OR: data.students.map((s) => ({
                curriculumVersion: {
                    name: s.curriculum,
                    trainingObjectTypeId: trainingObjectType.id,
                    curriculum: {
                        trainingMajor: {
                            name: s.trainingMajor,
                        },
                    },
                },
            })),
        },
        select: {
            id: true,
            code: true,
            name: true,
            trainingCourseId: true,
            curriculumVersion: {
                select: {
                    name: true,
                    curriculum: { select: { trainingMajor: { select: { name: true } } } },
                },
            },
        },
    })

    const dbConflictErrors: string[] = []
    for (const conflict of conflicts) {
        const conflictCurriculumName = conflict.curriculumVersion?.name
        const conflictMajorName = conflict.curriculumVersion?.curriculum?.trainingMajor?.name

        const matchingInput = data.students.find(
            (s) =>
                s.curriculum === conflictCurriculumName &&
                (!s.trainingMajor || s.trainingMajor === conflictMajorName)
        )

        if (matchingInput) {
            const isSameClass =
                (matchingInput.fixedClassCode && conflict.code
                    ? matchingInput.fixedClassCode === conflict.code
                    : matchingInput.fixedClass === conflict.name) &&
                conflict.trainingCourseId === trainingCourse.id

            if (!isSameClass) {
                dbConflictErrors.push(
                    `CTĐT ${matchingInput.curriculum} đã được sử dụng cho lớp ${conflict.name} (Khoá ${conflict.trainingCourseId === trainingCourse.id ? 'hiện tại' : 'khác'})`
                )
            }
        }
    }

    if (dbConflictErrors.length > 0) {
        return c.json({ message: `Xung đột dữ liệu: ${dbConflictErrors.join('; ')}` }, 400)
    }

    const uniqueNames = [...new Set(data.students.map(s => s.curriculum?.trim()))].filter(Boolean) as string[];

    const existingCVs = await prisma.curriculumVersion.findMany({
        where: { 
            name: { in: uniqueNames },
            trainingObjectTypeId: trainingObjectType.id,
            deletedAt: null 
        },
        select: { id: true, name: true }
    });

    const cvIdMap = new Map(existingCVs.map(cv => [cv.name.trim(), cv.id]));

    const missing = uniqueNames.filter(name => !cvIdMap.has(name));

    if (!createCurriculumVersion && missing.length > 0) {
        return c.json({ message: `Lỗi: CTĐT [${missing.join(', ')}] không tồn tại.` }, 400);
    }

    const curriculumVersionMap = await buildCurriculumMapOrThrow(
        prisma,
        data.students,
        trainingObjectType.id,
        trainingCourse.id,
        createCurriculumVersion
    )

    const dmTruong = await buildDMTruongMap(
        prisma,
        data.students.map((student) => student.universitySchool)
    )

    const dmNganh = await buildDMNganhMap(
        prisma,
        data.students.map((student) => student.universityMajor)
    )

    const dmChuyenNganh = await buildDMChuyenNganhMap(
        prisma,
        data.students.map((student) => student.universityMajor)
    )

    const existingStudent = await prisma.student.findMany({
        where: { code: { in: data.students.map((student) => student.code) } },
        select: {
            id: true,
            code: true,
            userProfileId: true,
            userProfile: {
                select: { idCardNumber: true },
            },
        },
    })

    const existingStudentMap = new Map(
        existingStudent.map(({ code, id, userProfileId, userProfile }) => [
            code,
            { id, userProfileId, idCardNumber: userProfile.idCardNumber },
        ])
    )

    const existingProfile = await prisma.userProfile.findMany({
        where: { idCardNumber: { in: data.students.map((student) => student.idCardNumber) } },
        select: { id: true, code: true, idCardNumber: true },
    })

    const existingProfileMap = new Map(
        existingProfile.map(({ idCardNumber, id, code }) => [idCardNumber, { id, code }])
    )

    // validate duplicate student.code identify by student.userProfile.idCardNumber
    const duplicateCode: string[] = []
    for (const l of data.students) {
        const existingStudent = existingStudentMap.get(l.code)
        if (existingStudent && existingStudent.idCardNumber !== l.idCardNumber) {
            duplicateCode.push(l.code)
        }
    }

    if (duplicateCode.length) {
        return c.json({ message: 'Mã sinh viên đã tồn tại', errors: duplicateCode }, 400)
    }

    const start = Date.now()

    const uniqueClasses = Array.from(
        new Map(data.students.map((s) => [s.fixedClassCode, s])).values()
    );

    await prisma.$transaction(
        uniqueClasses.map((s) => {
            const curriculumName = s.curriculum?.trim();
            const cvId = curriculumVersionMap.get(curriculumName);
            const orgId = managementOrganizationMap.get(s.managementOrganization?.trim());

            return prisma.fixedClass.upsert({
                where: { code: s.fixedClassCode },
                update: {
                    name: s.fixedClass,
                    trainingCourseId: trainingCourse.id,
                    curriculumVersionId: cvId,
                    managementOrganizationId: orgId,
                },
                create: {
                    name: s.fixedClass,
                    code: s.fixedClassCode,
                    trainingCourseId: trainingCourse.id,
                    curriculumVersionId: cvId,
                    managementOrganizationId: orgId,
                    startYear: new Date().getFullYear(),
                },
            });
        })
    );

    const fixedClass = await prisma.fixedClass.findMany({
        where: {
            OR: data.students.map(({ fixedClassCode }) => ({
                code: fixedClassCode,
            })),
        },
        select: { id: true, code: true },
    })

    const fixedClassMap = new Map(fixedClass.map(({ code, id }) => [code, id]))

    for (const student of data.students) {
        const cvName = student.curriculum?.trim();
        const cvId = curriculumVersionMap.get(cvName);
        
        const studentData: Prisma.StudentCreateInput = {
            code: student.code,
            entryScore: Number.parseFloat(student.entryScore ?? '') || null,
            fixedClass: { connect: { id: fixedClassMap.get(student.fixedClassCode) } },
            curriculumVersion: cvId ? { connect: { id: cvId } } : undefined,
            userProfile: {},
            department: student.department,
            departmentAddress: student.departmentAddress,
            careerYear: Number.parseInt(student.careerYear ?? '0', 10),
            universitySchool: student.universitySchool,
            universityTrainingType: student.universityTrainingType,
            universityGraduationYear: Number.parseInt(student.universityGraduationYear ?? '0', 10),
            universityMajor: student.universityMajor,
            universityRank: student.universityRank,
            basic: student.basic ? Number.parseFloat(student.basic) : null,
            facility: student.facility ? Number.parseFloat(student.facility) : null,
            foreignLanguage: student.foreignLanguage,
            priorityReason: student.priorityReason,
            description: student.description,
        }

        const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(student.fullname),
            code: student.idCardNumber,
            fullname: student.fullname,
            email: `${student.idCardNumber}@gmail.com`,
            bLaGiangVien: false,
            bLaHocVien: true,
            dateOfBirth: student.dateOfBirth,
            idCardNumber: student.idCardNumber,
            genderId: student.gender ? genderMap.get(student.gender) : null,
            ethnicityId: ethnicityMap.get(student.ethnicity ?? '') || null,
            nationalityId: nationalityMap.get(student.nationality ?? '') || null,
            newProvinceHometownId: provinceMap.get(student.provinceHometown ?? '') || null,
            phoneNumber: student.phoneNumber,
            officerNumber: student.officerNumber,
            rankId: rankMap.get(student.rank ?? '') || null,
            positionCPVId: positionMap.get(student.position ?? '') || null,
        }

        const existingProfile = existingProfileMap.get(student.idCardNumber)
        const existing = existingStudentMap.get(student.code)

        const createStudentFn = async (id?: string) => {
            const st = await prisma.student.create({
                data: {
                    ...studentData,
                    userProfile: {
                        connectOrCreate: {
                            where: id ? { id } : { idCardNumber: student.idCardNumber },
                            create: { id, ...profileData },
                        },
                    },
                },
            })

            if (student.department) {
                await prisma.quaTrinhCongTac.create({
                    data: {
                        userProfileId: st.userProfileId,
                        donVi: student.department,
                        diaChi: student.departmentAddress,
                        chucVuId: positionMap.get(student.position ?? ''),
                    },
                })
            }

            if (student.universitySchool && student.universityMajor) {
                await prisma.quaTrinhHocTap.create({
                    data: {
                        userProfileId: st.userProfileId,
                        tenTruongId: dmTruong.get(student.universitySchool) as string,
                        nganhHocId: dmNganh.get(student.universityMajor) as string,
                        chuyenNganhId: dmChuyenNganh.get(student.universityMajor) as string,
                    },
                })
            }
        }

        if (existingProfile) {
            const res = await putDMNhanViens(
                {
                    Id: existingProfile.id,
                    sMa: existingProfile.code || crypto.randomUUID(),
                    bLaHocVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: student.dateOfBirth
                        ? new Date(student.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: student.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: student.fullname,
                    sSDTDiDong: student.phoneNumber ?? '',
                    //! TODO: fix this
                    sEmail: `${student.idCardNumber}@gmail.com`,
                    sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )

            if (existing) {
                if (res.status === 200) {
                    await prisma.student.update({
                        where: { id: existing.id },
                        data: {
                            ...studentData,
                            userProfile: { update: profileData },
                        },
                    })
                } else {
                    const extra = res.data?.extra as unknown as ErrorExtra | undefined
                    return c.json(
                        { message: extra?.message || [extra?.code, extra?.data].join(' ') },
                        400
                    )
                }
            } else {
                await createStudentFn()
            }
        } else {
            const res = await postDMNhanViens(
                {
                    sMa: student.idCardNumber,
                    bLaHocVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: student.dateOfBirth
                        ? new Date(student.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: student.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: student.fullname,
                    sSDTDiDong: student.phoneNumber ?? '',
                    sEmail: `${student.idCardNumber}@gmail.com`,
                    sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )

            if (res.status === 200) {
                await createStudentFn(res.data as string)
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
            message: `Nhập học viên thành công: ${data.students.length}`,
            time: Date.now() - start,
        },
        200
    )
})

const importHeQuanSu = createRoute({
    operationId: 'import-he-quan-su',
    tags: ['Student'],
    path: '/import-he-quan-su',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }).openapi('importHeQuanSuRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import He quan su successfully',
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

app.openapi(importHeQuanSu, async (c) => {
    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetHeQuanSu(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const trainingObjectType = await prisma.trainingObjectType.findFirst({
        where: { name: data.trainingObjectType as string, active: true },
    })

    if (!trainingObjectType) {
        return c.json(
            {
                message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}`,
            },
            400
        )
    }

    const trainingCourse = await prisma.trainingCourse.findFirst({
        where: { name: data.trainingCourse as string, active: true },
    })

    if (!trainingCourse) {
        return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.students.map((student) => student.gender)
    )

    const ethnicityMap = await buildEthnicityMapOrThrow(
        prisma,
        data.students.map((student) => student.ethnicity)
    )

    const nationalityMap = await buildNationalityMapOrThrow(
        prisma,
        data.students.map((student) => student.nationality)
    )

    const provinceMap = await buildNewProvinceMapOrThrow(
        prisma,
        data.students.map((student) => student.provinceHometown)
    )

    const curriculumVersionMap = await buildCurriculumMapOrThrow(
        prisma,
        data.students,
        trainingObjectType.id,
        trainingCourse.id
    )

    const existingStudent = await prisma.student.findMany({
        where: { code: { in: data.students.map((student) => student.code) } },
        select: { id: true, code: true },
    })

    const existingStudentMap = new Map(existingStudent.map(({ code, id }) => [code, id]))

    const start = Date.now()
    await prisma.$transaction(
        async (tx) => {
            await tx.fixedClass.createMany({
                skipDuplicates: true,
                data: data.students.map(({ fixedClass, curriculum }) => ({
                    name: fixedClass,
                    trainingCourseId: trainingCourse.id,
                    curriculumVersionId: curriculumVersionMap.get(curriculum),
                    startYear: new Date().getFullYear(),
                })),
            })

            const fixedClass = await tx.fixedClass.findMany({
                where: {
                    OR: data.students.map(({ fixedClass, curriculum }) => ({
                        name: fixedClass,
                        trainingCourseId: trainingCourse.id,
                        curriculumVersionId: curriculumVersionMap.get(curriculum),
                    })),
                },
                select: { id: true, name: true },
            })

            const fixedClassMap = new Map(fixedClass.map(({ name, id }) => [name, id]))

            for (const student of data.students) {
                const studentData: Prisma.StudentCreateInput = {
                    code: student.code,
                    entryScore: Number.parseFloat(student.admissionScore ?? '') || null,
                    fixedClass: { connect: { id: fixedClassMap.get(student.fixedClass) } },
                    curriculumVersion: {
                        connect: { id: curriculumVersionMap.get(student.curriculum) },
                    },
                    userProfile: {},
                }
                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
                        ...splitFullName(student.fullname),
                        bLaGiangVien: false,
                        bLaHocVien: true,
                        dateOfBirth: student.dateOfBirth,
                        // TODO: need to use idCardNumber
                        idCardNumber: student.code,
                        genderId: student.gender ? genderMap.get('Nữ') : null,
                        ethnicityId: ethnicityMap.get(student.ethnicity ?? '') || null,
                        nationalityId: nationalityMap.get(student.nationality ?? '') || null,
                        newProvinceHometownId:
                            provinceMap.get(student.provinceHometown ?? '') || null,
                    }

                const existingId = existingStudentMap.get(student.code)
                if (existingId) {
                    await tx.student.update({
                        where: { id: existingId },
                        data: {
                            ...studentData,
                            userProfile: { update: profileData },
                        },
                    })
                } else {
                    await tx.student.create({
                        data: {
                            ...studentData,
                            userProfile: {
                                connectOrCreate: {
                                    where: { idCardNumber: student.code }, // TODO: need to use idCardNumber
                                    create: profileData,
                                },
                            },
                        },
                    })
                }
            }
        },
        { timeout: timeout * 1000 }
    )

    return c.json(
        {
            message: `Nhập học viên thành công: ${data.students.length}`,
            time: Date.now() - start,
        },
        200
    )
})

const importInternship = createRoute({
    operationId: 'import-internship',
    tags: ['Import'],
    path: '/import-internship',
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
            description: 'Import internships successfully',
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

app.openapi(importInternship, async (c) => {
    const { file, timeout } = c.req.valid('form')
    const start = Date.now()

    const buf = await file.arrayBuffer()
    const data = parseSheetInternship(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const studentCodes = [...new Set(data.internships.map((i) => i.code))]
    const subjectClassCodes = [...new Set(data.internships.map((i) => i.subjectClassCode))]

    const students = await prisma.student.findMany({
        where: { code: { in: studentCodes } },
        select: { id: true, code: true },
    })
    const studentMap = new Map(students.map((s) => [s.code, s.id]))

    const subjectClasses = await prisma.subjectClass.findMany({
        where: { code: { in: subjectClassCodes } },
        select: { id: true, code: true, subjectId: true },
    })
    const subjectClassMap = new Map(
        subjectClasses.map((sc) => [sc.code, { id: sc.id, subjectVersionId: sc.subjectId }])
    )

    const missingStudents = studentCodes.filter((code) => !studentMap.has(code))
    const missingSubjectClasses = subjectClassCodes.filter((code) => !subjectClassMap.has(code))

    if (missingStudents.length > 0) {
        return c.json({ message: `Không tìm thấy sinh viên: ${missingStudents.join(', ')}` }, 400)
    }

    if (missingSubjectClasses.length > 0) {
        return c.json(
            {
                message: `Không tìm thấy lớp học phần: ${missingSubjectClasses.join(', ')}`,
            },
            400
        )
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const internship of data.internships) {
        try {
            const studentId = studentMap.get(internship.code)
            const subjectClassInfo = subjectClassMap.get(internship.subjectClassCode)

            if (!studentId || !subjectClassInfo) {
                errors.push(`Dòng ${internship.stt}: Không tìm thấy sinh viên hoặc lớp học phần`)
                errorCount++
                continue
            }

            let studentSubjectScore = await prisma.studentSubjectScore.findFirst({
                where: {
                    studentId,
                    subjectClassId: subjectClassInfo.id,
                },
            })

            if (!studentSubjectScore) {
                studentSubjectScore = await prisma.studentSubjectScore.create({
                    data: {
                        studentId,
                        subjectClassId: subjectClassInfo.id,
                        subjectVersionId: subjectClassInfo.subjectVersionId,
                    },
                })
            }

            await prisma.studentInternship.upsert({
                where: {
                    studentSubjectScoreId: studentSubjectScore.id,
                },
                create: {
                    studentSubjectScoreId: studentSubjectScore.id,
                    institution: internship.institution || undefined,
                    unit: internship.unit || undefined,
                    address: internship.address ?? undefined,
                    internshipContent: internship.internshipContent ?? undefined,
                    startDate: internship.startDate ?? undefined,
                    endDate: internship.endDate ?? undefined,
                    reportDate: internship.reportDate ?? undefined,
                },
                update: {
                    institution: internship.institution || undefined,
                    unit: internship.unit || undefined,
                    address: internship.address ?? undefined,
                    internshipContent: internship.internshipContent ?? undefined,
                    startDate: internship.startDate ?? undefined,
                    endDate: internship.endDate ?? undefined,
                    reportDate: internship.reportDate ?? undefined,
                },
            })

            successCount++
        } catch (error) {
            console.error(error)
            errors.push(`Dòng ${internship.stt}: ${error}`)
            errorCount++
        }
    }

    if (errorCount > 0) {
        return c.json(
            {
                message: `Import hoàn tất với ${successCount} thành công và ${errorCount} lỗi`,
                errors,
            },
            400
        )
    }

    return c.json(
        {
            message: `Nhập dữ liệu thực tập sinh thành công: ${successCount}`,
            time: Date.now() - start,
        },
        200
    )
})

export default app
