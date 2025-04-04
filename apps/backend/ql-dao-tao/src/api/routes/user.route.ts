import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'
import { ListOf, PaginationQuerySchema } from '../../zod/base'
import SessionApp from '../sessions'



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
    path: '/user/',
    method: 'post',
    description: 'Thêm mới người dùng',
    tags: ['Users'],
    summary: 'Create a new user',
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
    path: '/user/{id}',
    description: 'Chỉnh sửa người dùng',
    tags: ['Users'],
    summary: 'Update user',
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
    path: '/user/',
    description: 'Danh sách người dùng',
    tags: ['Users'],
    summary: 'Get list of users',
    request: { query: PaginationQuerySchema.merge(UserFilter) },
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
    path: '/user/{id}',
    description: 'Lấy thông tin người dùng',
    tags: ['Users'],
    summary: 'Get one user',
    responses: {
        200: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'Retrieve one user',
        },
        404: {
            content: { 'application/json': { schema: z.object({ message: z.string() }).openapi('ErrorSchema') } },
            description: 'User not found',
        },
    },
})

export default
{
    createUser,
    updateUser,
    getListUsers,
    getOneUser,
    SessionApp,
}