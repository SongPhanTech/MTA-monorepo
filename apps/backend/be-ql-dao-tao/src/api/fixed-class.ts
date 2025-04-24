import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { $Enums } from '@workspace/db'
import { FixedClassScalarSchema } from '@workspace/db/zod/models'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { read, utils } from 'xlsx'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import {
    type StudentInfo,
    listStudentInfo,
} from '../services/fixed-class.service'
import { getBufferFromUrl } from '../services/template.service'
import { getCurrentDateForReport } from '../utils'
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
                    schema: UploadExcelModel.extend({
                        trainingCourseId: z.string(), // loại thông tin
                    }).openapi('uploadExcelCreateFixedClass'),
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
    path: '/upload-excel-update-user-profile',
    method: 'post',
    description: 'Phân chia học viên vào các lớp',
    tags: ['FixedClass'],
    summary: 'Class Division',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.openapi('classDivision'),
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
    path: '/export-docx-list-student-fixed-class',
    description: 'Xuất file docx danh sách sinh viên trong lớp biên chế',
    tags: ['FixedClass'],
    summary: 'Export list of student FixedClass as .docx',
    method: 'get',
    request: {
        query: z.object({
            fixedClassId: z.string().openapi('fixedClassId', {
                description: 'ID của lớp biên chế',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of  student FixedClass as .docx',
            content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
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

const app = new OpenAPIHono({ strict: false })

app.openapi(uploadExcelCreateFixedClass, async (c) => {
    const { file, trainingCourseId } = c.req.valid('form')

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
    const fileSize = file.size // Kích thước file trong byte
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxFileSize) {
        return c.json({ message: 'File size exceeds 50MB' }, 400)
    }

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

    // Duyệt dòng 11 theo mẫu
    const data = await prisma.$transaction(async (prisma) => {
        return await Promise.all(
            rowData.slice(11).map(async (row, index) => {
                const fixedClass = await prisma.fixedClass.findFirst({
                    where: { code: row[7] }, // Tìm kiếm lớp biên chế
                })
                if (!fixedClass) {
                    return `Không tìm thấy lớp biên chế ${row[7]}`
                }
                const userProfile = await prisma.userProfile.findFirst({
                    where: { code: row[1] }, // Tìm kiếm UserType của Sinh viên
                })
                if (!userProfile) {
                    return `Không tìm thấy học viên ${row[1]}`
                }
                let fixedClassStudent =
                    await prisma.fixedClassStudent.findFirst({
                        where: {
                            userProfileId: userProfile.id,
                            fixedClassId: fixedClass.id,
                        },
                    })
                if (!fixedClassStudent) {
                    fixedClassStudent = await prisma.fixedClassStudent.create({
                        data: {
                            fixedClassId: fixedClass.id,
                            userProfileId: userProfile.id,
                        },
                    })
                }
                return fixedClassStudent
            })
        )
    })
    return c.json(data, 200)
})

app.openapi(exportDocxListStudentFixedClass, async (c) => {
    const { fixedClassId } = c.req.valid('query')
    const content = await listStudentInfo(fixedClassId)
    const fixedClass = await prisma.fixedClass.findFirst({
        where: { id: fixedClassId }, // Tìm kiếm lớp biên chế
    })
    if (!fixedClass) {
        return c.json(
            { message: `Không tìm thấy lớp biên chế ${fixedClassId}` },
            404
        )
    }

    const { date, month, year } = getCurrentDateForReport()

    // dạng bảng
    const templateData = {
        fields: [date, month, year, fixedClass.name],
        cellValues: {
            sheet: content.map((item: StudentInfo) => ({
                A: item.stt,
                B: item.code,
                C: item.name,
                D: item.DoB,
                E: item.HomeTown,
            })),
        },
    }
    // console.log("templateData", templateData);

    const docxBuffer = await getBufferFromUrl('LIST_STUDENT_FIXCLASS')
    const templateZip = new PizZip(docxBuffer)
    const document = new Docxtemplater(templateZip, {
        paragraphLoop: true,
        linebreaks: true,
    })
    const fillData = templateData.fields.reduce(
        (obj, value, index) => {
            obj[index + 1] = value
            return obj
        },
        {} as Record<number, string | number>
    )

    const tableData = templateData.cellValues
    const data = {
        ...fillData,
        ...tableData,
    }

    const reportDocx = document.render(data)
    return c.body(reportDocx.getZip().generate({ type: 'nodebuffer' }), 200, {
        'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="DSLop_${fixedClass.name}.docx"`,
    })
})

export default app
