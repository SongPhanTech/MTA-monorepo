import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { $Enums } from '@workspace/db'
import {
    getFixedClassBySubjectClassSemester,
    getSubjectClassBySemester,
} from '@workspace/db/sql'
import { SubjectClassUpdateScalarSchema } from '@workspace/db/zod/models'
import { prisma } from '..'
import {
    EnrollFixedClassOnSubjectClass,
    FixedClassBySubjectClassSemester,
    OpenSubjectClass,
    StudentClassBySubjectClassSemester,
} from '../dto/subject-class.dto'
import { ListOf } from '../zod/base'
import {
    listStudentInfo,
    populateExcelTemplate,
    sanitizeFilename,
} from '../services/subject-class.service'
import { getCurrentDateForReport } from '../utils'
import type { StudentTemplateData } from '../dto/student-info.dto'
import { getBufferFromUrl } from '../services/template.service'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { read, utils } from 'xlsx'

const app = new OpenAPIHono({ strict: false })

const openSubjectClass = createRoute({
    operationId: 'openSubjectClass',
    path: '/open-subject-class',
    method: 'get',
    description: 'Lấy danh sách lớp môn học đã mở',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách lớp môn học đã mở',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            trainingCourseId: z
                .string()
                .openapi('trainingCourseId', {
                    description: 'ID ngành đào tạo',
                })
                .optional(),
            trainingMajorId: z
                .string()
                .openapi('trainingMajorId', {
                    description: 'ID của chuyên ngành đào tạo',
                })
                .optional(),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ListOf(OpenSubjectClass),
                },
            },
            description: 'Danh sách phân công giảng dạy thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const fixedClassBySubjectClassSemester = createRoute({
    operationId: 'fixedClassBySubjectClassSemester',
    path: '/fixed-class-by-subject-class-semester',
    method: 'get',
    description: 'Lấy danh sách lớp quản lý theo học kỳ và lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách lớp quản lý theo học kỳ và lớp môn học',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            subjectClassId: z.string().openapi('subjectClassId', {
                description: 'ID của lớp môn học',
            }),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ListOf(FixedClassBySubjectClassSemester),
                },
            },
            description: 'Danh sách lớp quản lý theo học kỳ và lớp môn học',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const studentBySubjectClassSemester = createRoute({
    operationId: 'studentBySubjectClassSemester',
    path: '/student-by-subject-class-semester',
    method: 'get',
    description: 'Lấy danh sách học sinh theo học kỳ và lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách học sinh theo học kỳ và lớp môn học',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            subjectClassId: z.string().openapi('subjectClassId', {
                description: 'ID của lớp môn học',
            }),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ListOf(StudentClassBySubjectClassSemester),
                },
            },
            description: 'Danh sách học sinh theo học kỳ và lớp môn học',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const enrollFixedClassOnSubjectClass = createRoute({
    operationId: 'enrollFixedClassOnSubjectClass',
    path: '/enroll-fixed-class-on-subject-class',
    method: 'post',
    description: 'Đăng ký lớp môn học cho lớp quản lý',
    tags: ['SubjectClass'],
    summary: 'Đăng ký lớp môn học cho lớp quản lý',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        fixedClassIds: z
                            .array(z.string())
                            .openapi('fixedClassIds', {
                                description: 'Danh sách ID lớp quản lý',
                            }),
                        subjectClassId: z.string().openapi('subjectClassId', {
                            description: 'ID của lớp môn học',
                        }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ListOf(EnrollFixedClassOnSubjectClass),
                },
            },
            description: 'Đăng ký lớp môn học cho lớp quản lý thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const enrollStudentOnSubjectClass = createRoute({
    operationId: 'enrollStudentOnSubjectClass',
    path: '/enroll-student-on-subject-class',
    method: 'post',
    description: 'Đăng ký lớp môn học cho học viên',
    tags: ['SubjectClass'],
    summary: 'Đăng ký lớp môn học cho học viên',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        addStudentIds: z
                            .array(z.string())
                            .openapi('studentIds', {
                                description: 'Danh sách ID học viên',
                            }),
                        removeStudentIds: z
                            .array(z.string())
                            .openapi('removeStudentIds', {
                                description: 'Danh sách ID học viên cần xóa',
                            }),
                        subjectClassId: z.string().openapi('subjectClassId', {
                            description: 'ID của lớp môn học',
                        }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ListOf(EnrollFixedClassOnSubjectClass),
                },
            },
            description: 'Đăng ký lớp môn học cho lớp quản lý thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const putManySubjectClass = createRoute({
    operationId: 'putManySubjectClass',
    path: '/',
    method: 'put',
    description: 'Cập nhật nhiều lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Cập nhật nhiều lớp môn học',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.array(
                        SubjectClassUpdateScalarSchema.extend({
                            id: z.string(),
                            roomId: z.string().nullish(),
                            lecturerId: z.string().nullish(),
                            extraLecturerId: z.string().nullish(),
                            enterGradeLecturerId: z.string().nullish(),
                        }).openapi('subjectClasses')
                    ),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        failedIds: z.array(z.string()),
                        message: z.string().optional(),
                    }),
                },
            },
            description: 'Đăng ký lớp môn học cho lớp quản lý thành công',
        },
    },
})

const exportExcelListStudentSubjectClass = createRoute({
    operationId: 'exportStudentSubjectClassExcel',
    path: '/export-xlsx-list-student-subject-class',
    description: 'Xuất file xlsx danh sách sinh viên trong lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Xuất file xlsx danh sách sinh viên trong lớp môn học',
    method: 'get',
    request: {
        query: z.object({
            subjectClassId: z.string().openapi('subjectClassId', {
                description: 'ID của lớp môn học',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student SubjectClass as .xlsx',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                    {
                        schema: z
                            .any()
                            .openapi({ type: 'string', format: 'binary' }),
                    },
            },
        },
        400: {
            description: 'Invalid file upload',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})
const uploadExcelImportScore = createRoute({
    operationId: 'uploadExcelImportScore',
    path: '/upload-excel-import-score',
    method: 'post',
    description:
        'Import điểm lớp môn học \n\n [subjectClassId] là id của lớp học',
    tags: ['SubjectClass'],
    summary: 'Import file nhập điểm',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        subjectClassId: z.string(), // loại thông tin
                    }).openapi('uploadExcelImportScore'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.number()),
                        count: z.number(),
                    }),
                },
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: 'Invalid file upload',
        },
    },
})
app.openapi(openSubjectClass, async (c) => {
    const {
        semesterId,
        search,
        page,
        pageSize,
        trainingCourseId,
        trainingMajorId,
    } = c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })
    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res = await prisma.$queryRawTyped<{
        data: OpenSubjectClass
    }>(
        getSubjectClassBySemester(
            semesterYear,
            semesterType,
            trainingCourseId ?? null,
            search ?? null,
            trainingMajorId ?? null,
            Number(page),
            Number(pageSize)
        ) as any
    )

    return c.json(
        {
            data: res
                .map((e) => e.data)
                .map((item) => ({
                    ...item,
                    fixedClass: item.fixedClass.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) => t.fixedClassId === value.fixedClassId
                                ) && !!value.fixedClassId
                    ),
                    curriculumVersion: item.curriculumVersion.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) =>
                                        t.curriculumVersionId ===
                                        value.curriculumVersionId
                                ) && !!value.curriculumVersionId
                    ),
                    subjectClass: item.subjectClass.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) =>
                                        t.subjectClassId ===
                                        value.subjectClassId
                                ) && !!value.subjectClassId
                    ),
                    countStudent: item.fixedClass.reduce(
                        (acc, curr) => acc + curr.fixedClassCount,
                        0
                    ),
                })),
            success: true,
        },
        200
    )
})

app.openapi(fixedClassBySubjectClassSemester, async (c) => {
    const { semesterId, search, page, pageSize, subjectClassId } =
        c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res = await prisma.$queryRawTyped<{
        full_count: number
        fixedClassId: string
    }>(
        getFixedClassBySubjectClassSemester(
            semesterYear,
            semesterType,
            subjectClassId,
            search ?? null,
            Number(page),
            Number(pageSize)
        ) as any
    )

    const fixedClasses = await prisma.fixedClass.findMany({
        where: {
            id: {
                in: res.map((e) => e.fixedClassId),
            },
        },
        include: {
            trainingCourse: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            curriculumVersion: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    curriculum: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            trainingMajor: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    },
                },
            },
            subjectClasses: {
                select: { id: true },
            },
            _count: {
                select: {
                    students: true,
                },
            },
        },
    })

    return c.json(
        {
            data: fixedClasses.map((e) => ({
                ...e,
                checked: !!e.subjectClasses.find(
                    (sc) => sc.id === subjectClassId
                ),
            })),
            count: res.length > 0 && res[0] ? Number(res[0].full_count) : 0,
            success: true,
        },
        200
    )
})

app.openapi(studentBySubjectClassSemester, async (c) => {
    const { semesterId, search, page, pageSize, subjectClassId } =
        c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res = await prisma.$queryRawTyped<{
        fixedClassId: string
        full_count: number
    }>(
        getFixedClassBySubjectClassSemester(
            semesterYear,
            semesterType,
            subjectClassId,
            search ?? null,
            Number(page),
            Number(pageSize)
        ) as any
    )

    const students = await prisma.student.findMany({
        where: {
            fixedClassId: {
                in: res.map((e) => e.fixedClassId),
            },
            active: true,
        },
        include: {
            userProfile: {
                select: {
                    id: true,
                    code: true,
                    lastName: true,
                    firstName: true,
                    familyName: true,
                    gender: true,
                    dateOfBirth: true,
                },
            },
            subjectClassStudent: {
                select: {
                    subjectClassId: true,
                },
            },
            fixedClass: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    trainingCourse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    curriculumVersion: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            curriculum: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    trainingMajor: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return c.json(
        {
            data: students.map((e) => ({
                ...e,
                checked: !!e.subjectClassStudent.find(
                    (sCs) => sCs.subjectClassId === subjectClassId
                ),
            })),
            count: res.length > 0 && res[0] ? Number(res[0].full_count) : 0,
            success: true,
        },
        200
    )
})

app.openapi(enrollFixedClassOnSubjectClass, async (c) => {
    const { subjectClassId, fixedClassIds } = c.req.valid('json')
    const fixedClasses = await prisma.fixedClass.findMany({
        where: {
            id: {
                in: fixedClassIds,
            },
            active: true,
            graduated: false,
        },
        include: {
            students: {
                select: {
                    id: true,
                },
            },
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    const res = await prisma.$transaction(async (tx) => {
        await tx.subjectClass.update({
            where: {
                id: subjectClassId,
            },
            data: {
                fixedClasses: {
                    set: fixedClassIds.map((id) => ({ id })),
                },
            },
        })
        await tx.studentSubjectScore.deleteMany({
            where: {
                subjectClassId,
                subjectVersionId: subjectClass.subjectId,
                status: $Enums.SubjectClassStudentStatus.Registered,
            },
        })
        return await tx.studentSubjectScore.createManyAndReturn({
            data: fixedClasses
                .flatMap((fixedClass) => fixedClass.students)
                .map((student) => ({
                    studentId: student.id,
                    subjectClassId,
                    subjectVersionId: subjectClass.subjectId,
                    status: $Enums.SubjectClassStudentStatus.Registered,
                })),
            skipDuplicates: true,
        })
    })

    return c.json(
        {
            data: res,
            success: true,
        },
        200
    )
})

app.openapi(enrollStudentOnSubjectClass, async (c) => {
    const { subjectClassId, addStudentIds, removeStudentIds } =
        c.req.valid('json')

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    const res = await prisma.$transaction(async (tx) => {
        for (const studentId of removeStudentIds) {
            await tx.studentSubjectScore.deleteMany({
                where: {
                    studentId,
                },
            })
        }
        return await tx.studentSubjectScore.createManyAndReturn({
            data: addStudentIds.map((studentId) => ({
                studentId: studentId,
                subjectClassId,
                subjectVersionId: subjectClass.subjectId,
                status: $Enums.SubjectClassStudentStatus.Registered,
            })),
            skipDuplicates: true,
        })
    })

    return c.json(
        {
            data: res,
            success: true,
        },
        200
    )
})

app.openapi(putManySubjectClass, async (c) => {
    const classes = c.req.valid('json')

    const updates = classes.map(async (cls) => {
        try {
            await prisma.subjectClass.update({
                where: { id: cls.id },
                data: cls,
                select: { id: true },
            })
            return { success: true, id: cls.id }
        } catch (error) {
            // TODO: send to sentry
            return { success: false, id: cls.id }
        }
    })

    const results = await Promise.all(updates)
    const failedIds = results
        .filter(({ success }) => !success)
        .map(({ id }) => id)

    return c.json({ success: failedIds.length === 0, failedIds }, 200)
})

app.openapi(exportExcelListStudentSubjectClass, async (c) => {
    const { subjectClassId } = c.req.valid('query')
    const students = await listStudentInfo(subjectClassId)
    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId }, // Tìm kiếm lớp biên chế
    })
    if (!subjectClass) {
        return c.json(
            { message: `Không tìm thấy lớp biên chế ${subjectClassId}` },
            404
        )
    }

    const { date, month, year } = getCurrentDateForReport()

    const templateData: StudentTemplateData = {
        date,
        month,
        year,
        className: subjectClass.name,
        student: students,
    }

    const templateBuffer = await getBufferFromUrl(
        'LIST_STUDENT_SUBJECTCLASS_EXCEL'
    )
    const excelBuffer = populateExcelTemplate(templateBuffer, templateData)

    // Set response headers
    const sanitizedClassName = sanitizeFilename(subjectClass.name ?? 'Class')
    return c.body(excelBuffer, 200, {
        'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`DSLop_${sanitizedClassName}.xlsx`)}`,
    })
})
app.openapi(uploadExcelImportScore, async (c) => {
    const { file, subjectClassId } = c.req.valid('form')

    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
        return c.json({ message: 'File vượt quá 50MB' }, 400)
    }

    // Đọc file Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'array' })

    // Lấy sheet đầu tiên
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
        return c.json({ message: 'Không tìm thấy sheet' }, 400)
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
        return c.json({ message: 'Không tìm thấy sheet' }, 400)
    }

    // Chuyển đổi dữ liệu từ sheet thành JSON
    const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

    // Kiểm tra mã lớp có trùng với đầu vào không để tránh nhập nhầm
    const cellAddress = 'C4'
    const cell = sheet[cellAddress]
    const cellValue = cell ? cell.v : null
    console.log(`Giá trị ô ${cellAddress}:`, cellValue)

    const subjectClass = await prisma.subjectClass.findFirst({
        where: { id: subjectClassId },
    })

    if (!subjectClass?.code) {
        return c.json({ message: 'Không tìm thấy khoá học' }, 400)
    }
    if (subjectClass?.code !== cellValue) {
        return c.json({ message: 'Mã lớp không trùng khớp' }, 400)
    }

    const scoreUpdates = rowData
        .slice(11)
        .map((row) => ({
            studentCode: row[1],
            scoreCC: Number(row[5]),
            scoreTX: Number(row[6]),
            scoreThi: Number(row[7]),
        }))
        .filter((update) => update.studentCode)

    const studentCodes = scoreUpdates
        .map((update) => update.studentCode)
        .filter((code): code is string => Boolean(code))
    const students = await prisma.student.findMany({
        where: {
            active: true,
            code: { in: studentCodes },
        },
        select: {
            id: true,
            code: true,
        },
    })

    // Update the student scores (assuming the score field exists in studentSubjectScore)
    const updateResults = []
    for (const { studentCode, scoreCC, scoreTX, scoreThi } of scoreUpdates) {
        const student = students.find((s) => s.code === studentCode)
        if (student) {
            const res = await prisma.studentSubjectScore.updateMany({
                where: {
                    studentId: student.id,
                    subjectClassId,
                    active: true,
                },
                data: {
                    attendanceScore: scoreCC,
                    midtermScore: scoreTX,
                    examScore: scoreThi,
                },
            })
            updateResults.push(res.count)
        }
    }
    const totalUpdated = updateResults.reduce((sum, count) => sum + count, 0)
    console.log(`Total records updated: ${totalUpdated}`)

    return c.json({ data: updateResults, count: totalUpdated }, 200)
})
export default app
