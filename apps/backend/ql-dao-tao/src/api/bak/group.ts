import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'
import { prisma } from '../..'
import * as XLSX from 'xlsx'

const app = new OpenAPIHono({ strict: false })

const GroupSchema = models.GroupScalarSchema.openapi('Group')

const createGroup = createRoute({
    operationId: 'createGroup',
    path: '/',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: models.GroupCreateSchema.extend({
                        userIds: z.array(z.string()),
                        roleIds: z.array(z.string()),
                    }).openapi('GroupCreate'),
                },
            },
        },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: GroupSchema } },
            description: 'Create a new group',
        },
    },
})

const updateGroup = createRoute({
    operationId: 'updateGroup',
    method: 'put',
    path: '/{id}',
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                'application/json': {
                    schema: models.GroupCreateSchema.extend({
                        userIds: z.array(z.string()),
                        roleIds: z.array(z.string()),
                    }).openapi('GroupUpdate'),
                },
            },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: GroupSchema } },
            description: 'Update group',
        },
    },
})

const uploadExcel = createRoute({
    operationId: 'uploadExcel',
    path: '/upload-excel',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z
                        .object({
                            file: z.any(), // Định nghĩa file upload
                        })
                        .openapi('ExcelUpload'),
                },
            },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(z.any()) } },
            description: 'Upload and parse Excel file',
        },
        400: {
            description: 'Invalid file upload',
        },
    },
})

app.openapi(createGroup, async (c) => {
    const { userIds, roleIds, ...rest } = c.req.valid('json')

    const data = await prisma.group.create({
        data: {
            ...rest,
            users: { connect: userIds.map((id) => ({ id })) },
            roles: { connect: roleIds.map((id) => ({ id })) },
        },
    })

    return c.json(data, 201)
})
    .openapi(updateGroup, async (c) => {
        const { id } = c.req.valid('param')
        const { userIds, roleIds, ...rest } = c.req.valid('json')

        const data = await prisma.group.update({
            where: { id },
            data: {
                ...rest,
                users: { set: userIds.map((id) => ({ id })) },
                roles: { set: roleIds.map((id) => ({ id })) },
            },
        })
        return c.json(data, 200)
    })
    .openapi(uploadExcel, async (c) => {
        const body = await c.req.parseBody() // Parse multipart form data
        const file = body.file

        // Kiểm tra xem file có tồn tại và là File object không
        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No valid file uploaded' }, 400)
        }

        try {
            // Đọc file Excel
            const arrayBuffer = await file.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer, { type: 'array' })

            // Lấy sheet đầu tiên
            const sheetName = workbook.SheetNames[0]
            if (!sheetName) {
                return c.json(
                    { error: 'No sheets found in the uploaded Excel file' },
                    400
                )
            }
            const sheet = workbook.Sheets[sheetName]

            // Chuyển sheet thành JSON
            if (!sheet) {
                return c.json(
                    { error: 'Sheet is undefined in the uploaded Excel file' },
                    400
                )
            }
            const jsonData = XLSX.utils.sheet_to_json(sheet)

            return c.json(jsonData, 200)
        } catch (error) {
            console.error('Error processing Excel file:', error)
            return c.json({ error: 'Failed to process Excel file' }, 400)
        }
    })

export default app
