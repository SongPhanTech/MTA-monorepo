import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { $Enums } from '@workspace/db'
import { FixedClassScalarSchema } from '@workspace/db/zod/models'
import { read, utils } from 'xlsx'
import { prisma } from '..'
import fixedClassService from '../services/fixed-class.service'
import { ListOf } from '../zod/base'

const uploadExcelCreateFixedClass = createRoute({
    operationId: 'uploadExcelCreateFixedClass',
    path: '/FixedClass/upload-excel-create-fixed-class',
    method: 'post',
    description:
        'Thêm mới danh sách lớp biên chế \n\n [trainingCourseId] là id của khoá học, lấy trong bảng TrainingCourse',
    tags: ['FixedClass'],
    summary: 'Upload Excel Create FixedClass',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z
                        .object({
                            file: z.instanceof(File).openapi({
                                type: 'string',
                                format: 'binary',
                            }),
                            trainingCourseId: z.string(), // loại thông tin
                        })
                        .openapi('uploadExcelCreateFixedClass'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': { schema: ListOf(FixedClassScalarSchema) },
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

const classDivision = createRoute({
    operationId: 'classDivision',
    path: '/FixedClass/upload-excel-update-user-profile',
    method: 'post',
    description: 'Phân chia học viên vào các lớp',
    tags: ['FixedClass'],
    summary: 'Class Division',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z
                        .object({
                            file: z
                                .instanceof(File)
                                .refine(
                                    (file) =>
                                        file.type ===
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                )
                                .openapi({
                                    type: 'string',
                                    format: 'binary',
                                }),
                        })
                        .openapi('classDivision'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.any()),
                },
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            description: 'Invalid file upload',
        },
    },
})

const exportDocxListStudentFixedClass = createRoute({
    operationId: 'exportStudentFixedClassDocx',
    path: '/FixedClass/export-docx-list-student-fixed-class',
    description: 'Xuất file docx danh sách sinh viên trong lớp biên chế',
    tags: ['FixedClass'],
    summary: 'Export list of student FixedClass as .docx',
    method: 'get',
    request: {
        query: z.object({
            fixedClassId: z
                .string()
                .optional()
                .openapi({ param: { style: 'form' } }),
            // includeGroups: z
            //     .string()
            //     .optional()
            //     .openapi({ param: { style: 'form' } }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of  student FixedClass as .docx',
            content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    {
                        schema: z
                            .string()
                            .openapi('ExportedRolesDOCX (base64)'),
                    },
            },
        },
    },
})

const app = new OpenAPIHono({ strict: false })

app.openapi(uploadExcelCreateFixedClass, async (c) => {
    const { file, trainingCourseId } = c.req.valid('form')

    const allowedExtensions = ['.xls', '.xlsx']
    if (
        !allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
        return c.json({ message: 'File không hỗ trợ' }, 400)
    }
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
        return c.json({ message: 'File vượt quá 50MB' }, 400)
    }
    // Đọc file Excel

    // Đọc file Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'array' })

    // Lấy sheet đầu tiên
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
        return c.json(
            { message: 'No sheets found in the uploaded Excel file' },
            400
        )
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
        return c.json(
            { message: 'Sheet is undefined in the uploaded Excel file' },
            400
        )
    }

    // Chuyển đổi dữ liệu từ sheet thành JSON
    const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

    // Kiểm tra mã khóa có trùng với đầu vào không để tránh nhập nhầm
    const cellAddress = 'C8'
    const cell = sheet[cellAddress]
    const cellValue = cell ? cell.v : null
    console.log(`Giá trị ô ${cellAddress}:`, cellValue)

    const trainingCourse = await prisma.trainingCourse.findFirst({
        where: { id: trainingCourseId }, // Tìm kiếm UserType của Sinh viên
    })

    if (!trainingCourse?.code) {
        return c.json({ message: 'Không tìm thấy khoá học' }, 400)
    }
    if (trainingCourse?.code !== cellValue) {
        return c.json({ message: 'Mã khoá học không trùng khớp' }, 400)
    }
    if (trainingCourse?.status !== $Enums.TrainingCourseStatus.ACTIVE) {
        return c.json({ message: 'khoá học đã đóng' }, 400)
    }

    const data = await prisma.fixedClass.createManyAndReturn({
        data: rowData.slice(11).map((row) => ({
            trainingCourseId: trainingCourse?.id,
            name: row[1] || '', // Tên lớp
            code: row[2], // Mã lớp
            classSize: Number.parseInt(row[3] || '') || 0, // Sĩ số converted to int
        })),
    })

    return c.json({ data, count: data.length }, 200)
})

app.openapi(classDivision, async (c) => {
    const { file } = c.req.valid('form')
    const data = await fixedClassService.classDivision(c)
    return data
})

app.openapi(exportDocxListStudentFixedClass, async (c) => {
    const data = await fixedClassService.exportFixedClassByCourse(c)
    return data
})
