import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { enums, models } from '@workspace/db/zod'
import { prisma } from '../..'
import * as XLSX from 'xlsx'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'createRole',
        path: '/',
        method: 'post',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: models.RoleCreateSchema.extend({
                            groupIds: z.array(z.string()).optional(),
                            permissions: z.array(
                                z.object({
                                    name: z.string(),
                                    permissionType: enums.PermissionTypeSchema,
                                })
                            ),
                        }).openapi('RoleCreate'),
                    },
                },
            },
        },
        responses: {
            201: {
                content: {
                    'application/json': { schema: models.RoleScalarSchema },
                },
                description: 'Create a new role',
            },
        },
    }),
    async (c) => {
        const { groupIds = [], permissions, ...rest } = c.req.valid('json')
        const role = await prisma.role.create({
            data: {
                ...rest,
                groups: { connect: groupIds.map((id) => ({ id })) },
                permissions: {
                    connectOrCreate: permissions.map((p) => ({
                        where: { name_permissionType: p },
                        create: p,
                    })),
                },
            },
        })

        return c.json(role, 201)
    }
)

app.openapi(
    createRoute({
        operationId: 'exportRoles',
        path: '/export',
        method: 'get',
        responses: {
            200: {
                description: 'Export list of roles as .xlsx',
                content: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                        {
                            schema: z
                                .string()
                                .openapi('ExportedRolesXLSX (base64)'), // optional OpenAPI doc
                        },
                },
            },
        },
    }),
    async (c) => {
        const roles = await prisma.role.findMany()

        // Bước 1: Chuyển đổi dữ liệu sang sheet
        const data = roles.map((role) => ({
            ID: role.id,
            Name: role.name,
            Description: role.description || '',
            CreatedAt: role.createdAt.toISOString(),
            UpdatedAt: role.updatedAt.toISOString(),
        }))
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Roles')

        // Bước 2: Ghi ra buffer
        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        })

        // Bước 3: Trả về file với header tải xuống
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="roles.xlsx"',
            },
        })
    }
)
//   app.openapi(
// createRoute({
//   operationId: 'exportRolesDocx',
//   path: '/export-docx',
//   method: 'get',
//   request: {
//     query: z.object({
//       includePermissions: z
//         .string()
//         .optional()
//         .openapi({ param: { style: 'form' } }),
//       includeGroups: z
//         .string()
//         .optional()
//         .openapi({ param: { style: 'form' } }),
//     }),
//   },
//   responses: {
//     200: {
//       description: 'Export list of roles as .docx',
//       content: {
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
//           schema: z.string().openapi('ExportedRolesDOCX (base64)'),
//         },
//       },
//     },
//   },
// }),
//     async (c) => {
//       const roles = await prisma.role.findMany()

//       const table = new Table({
//         width: {
//           size: 100,
//           type: WidthType.PERCENTAGE,
//         },
//         rows: [
//           // Header row
//           new TableRow({
//             children: ['ID', 'Name', 'Description', 'CreatedAt', 'UpdatedAt'].map(
//               (text) =>
//                 new TableCell({
//                   children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
//                 })
//             ),
//           }),
//           // Data rows
//           ...roles.map(
//             (role) =>
//               new TableRow({
//                 children: [
//                   role.id,
//                   role.name,
//                   role.description ?? '',
//                   role.createdAt.toISOString(),
//                   role.updatedAt.toISOString(),
//                 ].map((val) =>
//                   new TableCell({
//                     children: [new Paragraph(String(val))],
//                   })
//                 ),
//               })
//           ),
//         ],
//       })

//       const doc = new Document({
//         sections: [
//           {
//             properties: {},
//             children: [new Paragraph('Danh sách Roles'), table],
//           },
//         ],
//       })

//       const buffer = await Packer.toBuffer(doc)

//       return new Response(buffer, {
//         status: 200,
//         headers: {
//           'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//           'Content-Disposition': 'attachment; filename="roles.docx"',
//         },
//       })
//     }
//   )

export default app
