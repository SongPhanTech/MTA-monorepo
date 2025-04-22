import { HTTPException } from 'hono/http-exception'
import { prisma } from '../..'
import { SCIMClient } from '../../wso2is-apis/users'

const scimClient = new SCIMClient()
// user.service.ts

const createUser = async (context: any): Promise<any> => {
    const { password, groupIds, ...rest } = context.req.valid('json')

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
            groups: { connect: groupIds.map((id: string) => ({ id })) },
        },
    })

    return context.json(data, 201)
}

const updateUser = async (context: any): Promise<any> => {
    const { id } = context.req.valid('param')
    const { password, groupIds, accountLocked, ...rest } =
        context.req.valid('json')

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
                      {
                          accountLocked,
                      },
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
            groups: {
                set: groupIds?.map((groupId: string) => ({ id: groupId })),
            },
        },
    })
    return context.json(data, 200)
}

const getListUsers = async (context: any): Promise<any> => {
    const { page = 1, limit = 10, ...filter } = context.req.valid('query')

    const users = await scimClient.listUsers({
        startIndex: (page - 1) * limit + 1,
        count: limit,
        ...filter,
    })

    const usersMetadata =
        users.Resources?.map((u) => ({
            ssoId: u.id,
            accountLocked:
                u['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']
                    ?.accountLocked,
        })) || []

    const data = await prisma.user.findMany({
        where: { ssoId: { in: usersMetadata.map((u) => u.ssoId) } },
    })

    const count = users.totalResults
    return context.json(
        {
            page,
            limit,
            count,
            data: data.map((item) => ({
                ...item,
                accountLocked: usersMetadata.find((u) => u.ssoId === item.ssoId)
                    ?.accountLocked,
            })),
        },
        200
    )
}

const getOneUser = async (context: any): Promise<any> => {
    const { id } = context.req.valid('param')
    const data = await prisma.user.findUniqueOrThrow({
        where: { id },
        include: { groups: { include: { roles: true } } },
    })
    return context.json(data, 200)
}

export default {
    createUser,
    updateUser,
    getListUsers,
    getOneUser,
}
