import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { enums, models } from '@workspace/db/zod'

const createRole = createRoute({
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
})

const updateRole = createRoute({
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
})

export default {
    createRole,
    updateRole,
}
