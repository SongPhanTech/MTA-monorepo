import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'
import { SCIMClient } from '../utils/helper'
import { ListOf, PaginationQuerySchema } from '../zod/base'

const client = new SCIMClient({
    baseURL: `${process.env.OIDC_BASE_URL}/scim2`,
    username: process.env.OIDC_USERNAME || 'admin',
    password: process.env.OIDC_ADMIN_PASSWORD || 'admin',
})

const app = new OpenAPIHono({ strict: false })

const UserSchema = models.UserScalarSchema.openapi('User')
export const UserFilter = z
    .object({
        email: z.string().optional(),
        userName: z.string().optional(),
        name: z.string().optional(),
    })
    .openapi('UserFilter')

const createUser = createRoute({
    operationId: 'createUser',
    path: '/',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: models.UserCreateSchema.merge(
                        z.object({
                            password: z.string(),
                            groupIds: z.array(z.string()),
                        })
                    ).openapi('UserCreate'),
                },
            },
        },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'Create a new user',
        },
    },
})

const updateUser = createRoute({
    operationId: 'updateUser',
    method: 'put',
    path: '/{id}',
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                'application/json': {
                    schema: models.UserCreateSchema.omit({
                        userName: true,
                        ssoId: true,
                        id: true,
                    })
                        .merge(
                            z.object({
                                password: z.string().optional(),
                                groupIds: z.array(z.string()),
                            })
                        )
                        .openapi('UserUpdate'),
                },
            },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'Update user',
        },
    },
})

const getListUsers = createRoute({
    operationId: 'listUsers',
    method: 'get',
    request: { query: PaginationQuerySchema.merge(UserFilter) },
    path: '/',
    responses: {
        200: {
            content: {
                'application/json': { schema: ListOf(models.UserSchema) },
            },
            description: 'Retrieve the users',
        },
    },
})

const getOneUser = createRoute({
    operationId: 'getOneUser',
    method: 'get',
    request: { params: z.object({ id: z.string() }) },
    path: '/{id}',
    responses: {
        200: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'Retrieve one user',
        },
    },
})

app.openapi(createUser, async (c) => {
    const { password, groupIds, ...rest } = c.req.valid('json')
    const user = await client.createUser({
        ...rest,
        password,
        schemas: [],
        name: { givenName: rest.name, familyName: '' },
        emails: [{ value: rest.email }],
    })

    const data = await prisma.user.create({
        data: {
            ...rest,
            ssoId: user.id,
            groups: { connect: groupIds.map((id) => ({ id })) },
        },
    })

    return c.json(data, 201)
})

    .openapi(updateUser, async (c) => {
        const { id } = c.req.valid('param')
        const { password, groupIds, ...rest } = c.req.valid('json')
        const oldUser = await prisma.user.findUniqueOrThrow({
            where: { id },
        })

        if (!oldUser.ssoId) {
            throw new HTTPException(400, { message: 'User not found' })
        }
        await client.updateUser(oldUser.ssoId, {
            userName: oldUser.userName,
            password,
            name: { givenName: rest.name, familyName: '' },
            emails: [{ value: rest.email }],
        })
        const data = await prisma.user.update({
            where: { id },
            data: {
                ...rest,
                groups: { set: groupIds.map((id) => ({ id })) },
            },
        })
        return c.json(data, 200)
    })

    .openapi(getListUsers, async (c) => {
        const { page = 1, limit = 10, ...filter } = c.req.valid('query')

        const where = Object.fromEntries(
            Object.entries(filter).map(([k, v]) => [k, { contains: v }])
        )

        const data = await prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where,
        })
        const count = await prisma.user.count()
        return c.json({ page, limit, data, count }, 200)
    })

    .openapi(getOneUser, async (c) => {
        const { id } = c.req.valid('param')
        const data = await prisma.user.findUniqueOrThrow({
            where: { id },
            include: { groups: { include: { roles: true } } },
        })
        return c.json(data, 200)
    })

export default app
