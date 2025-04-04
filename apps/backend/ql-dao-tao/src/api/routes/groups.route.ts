import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'

const GroupSchema = models.GroupScalarSchema.openapi('Group')

const createGroup = createRoute({
    operationId: 'createGroup',
    path: '/group/',
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
    path: '/group/{id}',
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

export default
{
    createGroup,
    updateGroup
}
    