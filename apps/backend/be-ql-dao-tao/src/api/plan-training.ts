import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { read, utils } from 'xlsx'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { exportPCGDdata } from '../services/lecturer'
import { fillExcelTemplate, getBufferFromUrl } from '../services/template.service'
import { getCurrentDateForReport } from '../utils'

const app = new OpenAPIHono({ strict: false })

const exportPhanCongGiangDay = createRoute({
    operationId: 'exportPhanCongGiangDay',
    path: '/export-phan-cong-giang-day',
    description: 'Xuất file excel danh sách phân công giảng dạy',
    tags: ['PlanTraining'],
    summary: 'Export danh sách phân công giảng dạy',
    method: 'get',
    request: {
        query: z.object({
            organizationId: z.string().openapi('organizationId', {
                description: 'ID của đơn vị',
            }),
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export danh sách phân công giảng dạy.',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
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
app.openapi(exportPhanCongGiangDay, async (c) => {
    const { organizationId, semesterId } = c.req.valid('query')

    const { date, month, year } = getCurrentDateForReport()

    const templateFile = await getBufferFromUrl('LECTURE_PCGD')

    const phanCongData = await exportPCGDdata(organizationId, semesterId)
    console.log(`data length ${phanCongData.cellData.length}`)
    console.log(`merge ${phanCongData.mergeData}`)
    const filledTemplate = await fillExcelTemplate(templateFile, phanCongData)

    const fileName = `PhanCongGiangDay_${date}_${month}_${year}.xlsx`

    c.header('Content-Disposition', `attachment; filename="${fileName}"`)
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return c.body(filledTemplate)
})

const importPhanCongGiangDay = createRoute({
    operationId: 'importPhanCongGiangDay',
    path: '/import-phan-cong-giang-day',
    method: 'post',
    description: 'Nhập file excel danh sách phân công giảng dạy',
    tags: ['PlanTraining'],
    summary: 'Import danh sách phân công giảng dạy',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        semesterId: z.string(), // loại thông tin
                    }).openapi('importPhanCongGiangDay'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string(), time: z.number() }),
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

app.openapi(importPhanCongGiangDay, async (c) => {
    const { file, semesterId } = c.req.valid('form')

    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
        return c.json({ message: 'File vượt quá 50MB' }, 400)
    }

    // Đọc file Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'array' })

    const ListSheetNames = workbook.SheetNames
    console.log('Danh sách sheet:', ListSheetNames)
    const startTime = Date.now()

    const ListOrganization = await prisma.dM_DonVi.findMany()
    const ListLecture = await prisma.lecturer.findMany({
        include: {
            userProfile: true,
        },
    })
    const ListSubjectClass = await prisma.subjectClass.findMany({
        where: {
            semesterId: semesterId,
        },
    })

    for (const sheetName of ListSheetNames) {
        console.log(`- ${sheetName}`)
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

        // Lấy đơn vị
        const parentOrganizationCellAddress = 'D3'
        const parentOrganizationCell = sheet[parentOrganizationCellAddress]
        const parentOrganizationCellValue = parentOrganizationCell
            ? parentOrganizationCell.v.replace('Khoa: ', '')
            : null
        console.log(
            `Giá trị ô ${parentOrganizationCellAddress}:${sheetName}`,
            parentOrganizationCellValue
        )

        const organizationCellAddress = 'J3'
        const organizationCell = sheet[organizationCellAddress]
        const organizationCellValue = organizationCell
            ? organizationCell.v.replace('Bộ môn: ', '')
            : null
        console.log(`Giá trị ô ${organizationCellAddress}:${sheetName}`, organizationCellValue)

        const parentOrgID = ListOrganization.find(
            (org) => org.sTen === parentOrganizationCellValue
        )?.Id
        const orgID = ListOrganization.find(
            (org) => org.sTen === organizationCellValue && org.sParentId === parentOrgID
        )?.Id

        console.log(`Mã đơn vị cha: ${parentOrgID}, Mã đơn vị: ${orgID}`)
        if (!orgID) {
            continue
        }

        rowData.slice(9).forEach((row, index) => {
            // Dòng thứ 10
            const subjectClassCode = row[9] || '' // Mã lớp (cột J)
            if (!subjectClassCode) {
                console.log(`Bỏ qua dòng ${index + 11} vì không có mã lớp`)
                return
            }
            const subjectClass = ListSubjectClass.find((cls) => cls.code === subjectClassCode)
            console.log(`Mã lớp: ${subjectClassCode} ${subjectClass ? `- ${subjectClass.id}` : ''}`)

            const mainLecturerName = row[12] || '' // Tên giảng viên chính (cột M)
            const mainLecturer = ListLecture.find(
                (lec) =>
                    lec.userProfile?.fullname === mainLecturerName && lec.organizationId === orgID
            )
            console.log(
                `Giảng viên chính: ${mainLecturerName} ${mainLecturer ? `- ${mainLecturer.id}` : ''}`
            )

            const extraLecturerName = row[13] || '' // Tên giảng viên phụ (cột N)
            const extraLecturer = ListLecture.find(
                (lec) =>
                    lec.userProfile?.fullname === extraLecturerName && lec.organizationId === orgID
            )
            console.log(
                `Giảng viên phụ: ${extraLecturerName} ${extraLecturer ? `- ${extraLecturer.id}` : ''}`
            )

            if (subjectClass && mainLecturer) {
                // Cập nhật hoặc tạo mới phân công giảng dạy
                prisma.subjectClass
                    .update({
                        where: { id: subjectClass.id },
                        data: {
                            lecturerId: mainLecturer.id,
                            extraLecturerId: extraLecturer ? extraLecturer.id : null,
                        },
                    })
                    .then(() => {
                        console.log(`Cập nhật phân công giảng dạy cho lớp ${subjectClassCode}`)
                    })
                    .catch((error) => {
                        console.error(
                            `Lỗi cập nhật phân công giảng dạy cho lớp ${subjectClassCode}:`,
                            error
                        )
                    })
            } else {
                console.warn(`Không tìm thấy lớp hoặc giảng viên cho dòng ${index + 11}`)
            }
        })
    }
    const endTime = Date.now()

    return c.json({ message: 'Tải danh sách thành công', time: endTime - startTime }, 200)
})

export default app
