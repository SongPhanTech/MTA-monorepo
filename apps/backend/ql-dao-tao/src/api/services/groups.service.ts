import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'
import { prisma } from '../..'


const createGroup = async (context: any): Promise<any> => {
    const { userIds, roleIds, ...rest } = context.req.valid('json')

    const data = await prisma.group.create({
        data: {
            ...rest,
            users: { connect: userIds.map((id: any) => ({ id })) },
            roles: { connect: roleIds.map((id: any) => ({ id })) },
        },
    })

    return context.json(data, 201)
}

const updateGroup= async (context: any): Promise<any> => {
    const { id } = context.req.valid('param')
    const { userIds, roleIds, ...rest } = context.req.valid('json')

    const data = await prisma.group.update({
        where: { id },
        data: {
            ...rest,
            users: { set: userIds.map((id: any) => ({ id })) },
            roles: { set: roleIds.map((id: any) => ({ id })) },
        },
    })
    return context.json(data, 200)
}

export default {
    createGroup,
    updateGroup
}