import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { enums, models } from '@workspace/db/zod'
import { prisma } from '../..'

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
        operationId: 'updateRole',
        path: '/{id}',
        method: 'patch',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: models.RoleUpdateSchema.extend({
                            groupIds: z.array(z.string()).optional(),
                            permissions: z.array(
                                z.object({
                                    name: z.string(),
                                    permissionType: enums.PermissionTypeSchema,
                                })
                            ),
                        }).openapi('RoleUpdate'),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': { schema: models.RoleScalarSchema },
                },
                description: 'Update a role',
            },
        },
    }),
    async (c) => {
        const { id } = c.req.param()
        const { groupIds = [], permissions, ...rest } = c.req.valid('json')

        await prisma.permission.createMany({
            data: permissions,
            skipDuplicates: true,
        })

        const role = await prisma.role.update({
            where: { id },
            data: {
                ...rest,
                permissions: {
                    set: permissions.map((p) => ({
                        name_permissionType: p,
                    })),
                },
            },
        })

        return c.json(role)
    }
)

export default app
