import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import * as models from '@workspace/db/zod/models'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'
import { SCIMClient } from '../utils/is-user-api'
import { ListOf, PaginationQuerySchema } from '../zod/base'
import SessionApp from './users/sessions'

const scimClient = new SCIMClient({
    baseURL: `${process.env.OIDC_BASE_URL}/scim2`,
    username: process.env.OIDC_ADMIN_USERNAME || 'admin',
    password: process.env.OIDC_ADMIN_PASSWORD || 'admin',
})

const app = new OpenAPIHono({ strict: false })
app.route('/', SessionApp)

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
                    schema: models.UserCreateSchema.extend({
                        password: z.string(),
                        groupIds: z.array(z.string()),
                    }).openapi('UserCreate'),
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
                        .extend({
                            password: z.string(),
                            groupIds: z.array(z.string()),
                            accountLocked: z.boolean(),
                        })
                        .partial()
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
                'application/json': {
                    schema: ListOf(
                        models.UserSchema.extend({
                            accountLocked: z.boolean().optional(),
                        })
                    ),
                },
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
    const user = await scimClient.createUser({
        ...rest,
        password,
        schemas: [],
        name: { givenName: rest.name, familyName: '' },
        emails: [rest.email],
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
        const { password, groupIds, accountLocked, ...rest } =
            c.req.valid('json')
        const oldUser = await prisma.user.findUniqueOrThrow({
            where: { id },
        })
        if (!oldUser.ssoId) {
            throw new HTTPException(400, { message: 'User not found' })
        }

        const lockData =
            accountLocked !== undefined
                ? {
                      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User':
                          { accountLocked },
                  }
                : {}

        await scimClient.updateUser(oldUser.ssoId, {
            userName: oldUser.userName,
            password,
            name: { givenName: rest.name || oldUser.name, familyName: '' },
            emails: [rest.email || oldUser.email],
            ...lockData,
        })
        const data = await prisma.user.update({
            where: { id },
            data: {
                ...rest,
                groups: { set: groupIds?.map((id) => ({ id })) },
            },
        })
        return c.json(data, 200)
    })

    .openapi(getListUsers, async (c) => {
        const { page = 1, limit = 10, ...filter } = c.req.valid('query')

        const where: Prisma.UserWhereInput = Object.fromEntries(
            Object.entries(filter).map(([k, v]) => [
                k,
                { contains: v, mode: 'insensitive' },
            ])
        )

        const users = await scimClient.listUsers({
            startIndex: (page - 1) * limit + 1,
            count: limit,
            ...filter,
        })

        console.log(1111, users)

        const usersMetadata =
            users.Resources?.map((u) => ({
                ssoId: u.id,
                accountLocked:
                    u[
                        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'
                    ]?.accountLocked,
            })) || []

        const data = await prisma.user.findMany({
            where: { ssoId: { in: usersMetadata.map((u) => u.ssoId) } },
        })

        // const count = await prisma.user.count({ where })
        const count = users.totalResults
        return c.json(
            {
                page,
                limit,
                count,
                data: data.map((item) => ({
                    ...item,
                    accountLocked: usersMetadata.find(
                        (u) => u.ssoId === item.ssoId
                    )?.accountLocked,
                })),
            },
            200
        )
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
