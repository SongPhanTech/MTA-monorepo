import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { read, utils } from 'xlsx'

import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'

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

const app = new OpenAPIHono({ strict: false })

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
        return c.json({ message: 'No sheets found in the uploaded Excel file' }, 400)
    }
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
        return c.json({ message: 'Sheet is undefined in the uploaded Excel file' }, 400)
    }

    // Chuyển đổi dữ liệu từ sheet thành JSON
    const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

    // Duyệt dòng 11 theo mẫu
    const data = await prisma.$transaction(async (prisma) => {
        return await Promise.all(
            rowData.slice(11).map(async (row, index) => {
                const fixedClass = await prisma.fixedClass.findFirst({
                    where: { code: row[7] }, // Tìm kiếm lớp quản lý
                })
                if (!fixedClass) {
                    return `Không tìm thấy lớp quản lý ${row[7]}`
                }
                const userProfile = await prisma.userProfile.findFirst({
                    where: { code: row[1] }, // Tìm kiếm UserType của Sinh viên
                })
                if (!userProfile) {
                    return `Không tìm thấy học viên ${row[1]}`
                }
                let fixedClassStudent = await prisma.student.findFirst({
                    where: {
                        userProfileId: userProfile.id,
                        fixedClassId: fixedClass.id,
                    },
                })
                if (!fixedClassStudent) {
                    fixedClassStudent = await prisma.student.create({
                        data: {
                            fixedClassId: fixedClass.id,
                            userProfileId: userProfile.id,
                            from: new Date(),
                        },
                    })
                }
                return fixedClassStudent
            })
        )
    })
    return c.json(data, 200)
})

export default app
