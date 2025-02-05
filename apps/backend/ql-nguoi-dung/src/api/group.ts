import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'
import { prisma } from '..'

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
    path: '/',
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
}).openapi(updateGroup, async (c) => {
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

export default app
