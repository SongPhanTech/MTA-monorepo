import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '../..'

const app = new OpenAPIHono({ strict: false })

const createRole = async (context: any): Promise<any> => {
    const { groupIds = [], permissions, ...rest } = context.req.valid('json')
    const role = await prisma.role.create({
        data: {
            ...rest,
            groups: { connect: groupIds.map((id: any) => ({ id })) },
            permissions: {
                connectOrCreate: permissions.map((p: any) => ({
                    where: { name_permissionType: p },
                    create: p,
                })),
            },
        },
    })

    return context.json(role, 201)
}

const updateRole = async (context: any): Promise<any> => {
    const { id } = context.req.param()
    const { groupIds = [], permissions, ...rest } = context.req.valid('json')

    await prisma.permission.createMany({
        data: permissions,
        skipDuplicates: true,
    })

    const role = await prisma.role.update({
        where: { id },
        data: {
            ...rest,
            permissions: {
                set: permissions.map((p: any) => ({
                    name_permissionType: p,
                })),
            },
        },
    })

    return context.json(role, 200)
}

export default {
    createRole,
    updateRole,
}
