import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '..'
import { StudentTemplateData } from '../dto/student-info.dto'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { listStudentInfo, sanitizeFilename, populateExcelTemplate } from '../services/training-score'
import { getBufferFromUrl } from '../services/template.service'
import { getCurrentDateForReport } from '../utils'
import { read, utils } from 'xlsx'
const app = new OpenAPIHono({ strict: false })


const exportExcelListStudentFixedClassTrainingPoint = createRoute({
    operationId: 'exportStudentFixedClassExcelTrainingPoint',
    path: '/export-xlsx-list-student-fixed-class-training-point',
    description: 'Xuất file xlsx danh sách sinh viên trong lớp biên chế',
    tags: ['TrainingPoint'],
    summary: 'Xuất file xlsx danh sách sinh viên trong lớp biên chế',
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
            description: 'Export list of student FixedClass as .xlsx',
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

const uploadExcelImportTrainingScore = createRoute({
    operationId: 'uploadExcelImportScore',
    path: '/upload-excel-import-score',
    method: 'post',
    description:
        'Import điểm rèn luyện lớp biên chế \n\n [fixedClassId] là id của lớp biên chế, \n\n [trainingSessionId] là id của đợt đánh giá',
    tags: ['TrainingPoint'],
    summary: 'Import file nhập điểm rèn luyện',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        fixedClassId: z.string(), // loại thông tin
                        trainingSessionId: z.string(), // loại thông tin
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



app.openapi(exportExcelListStudentFixedClassTrainingPoint, async (c) => {
    const { fixedClassId } = c.req.valid('query')
    const student = await listStudentInfo(fixedClassId)
    const fixedClass = await prisma.fixedClass.findUnique({
        where: { id: fixedClassId }, // Tìm kiếm lớp biên chế
    })
    if (!fixedClass) {
        return c.json(
            { message: `Không tìm thấy lớp biên chế ${fixedClassId}` },
            404
        )
    }

    const { date, month, year } = getCurrentDateForReport()

    const templateData: StudentTemplateData = {
        date,
        month,
        year,
        className: fixedClass.name,
        student,
    }

    const templateBuffer = await getBufferFromUrl('TRAINING_POINT_IMPORT')
    const excelBuffer = populateExcelTemplate(templateBuffer, templateData)
    
    // Set response headers
    const sanitizedClassName = sanitizeFilename(fixedClass.name ?? 'Class')
    return c.body(excelBuffer, 200, {
        'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`DSLop_${sanitizedClassName}.xlsx`)}`,
    })
})

app.openapi(uploadExcelImportTrainingScore, async (c) => {
    const { file, fixedClassId, trainingSessionId } = c.req.valid('form')

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

    const fixedClass = await prisma.fixedClass.findFirst({
        where: { id: fixedClassId },
    })

    if (!fixedClass?.code) {
        return c.json({ message: 'Không tìm thấy lớp học' }, 400)
    }
    if (fixedClass?.name !== cellValue) {
        return c.json({ message: 'Tên lớp không trùng khớp' }, 400)
    }

    const scoreUpdates = rowData
        .slice(11)
        .map((row) => ({
            studentCode: row[1],
            scoreRL: Number(row[5]),
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
    // Prepare data for bulk insert
    const recordsToInsert = scoreUpdates.reduce(
        (acc, { studentCode, scoreRL }) => {
            const student = students.find((s) => s.code === studentCode)
            if (student) {
                acc.push({
                    studentId: student.id,
                    score: scoreRL,
                    trainingScoreSessionId: trainingSessionId,
                    active: true,
                })
            }
            return acc
        },
        [] as {
            studentId: string
            score: number
            trainingScoreSessionId: string
            active: boolean
        }[]
    )

    // Bulk insert the records
    const insertResult = await prisma.studentTrainingScore.createMany({
        data: recordsToInsert,
        skipDuplicates: true,
    })
    const totalInserted = insertResult.count
    console.log(`Total records inserted: ${totalInserted}`)

    return c.json({ data: [totalInserted], count: totalInserted }, 200)
})



export default app
