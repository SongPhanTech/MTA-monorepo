import type { PrismaClient } from '@workspace/db'
import { HTTPException } from 'hono/http-exception'

export const getTemplateBuffer = async (prisma: PrismaClient, templateCode: string) => {
    const templateFile = await prisma.templateFile.findUnique({
        where: { code: templateCode },
    })

    if (!templateFile) {
        throw new HTTPException(404, { message: `template not found (${templateCode})` })
    }

    const res = await fetch(templateFile.path)
    const buffer = await res.arrayBuffer()
    const nodeBuffer: Buffer<ArrayBuffer> = Buffer.from(buffer)

    return nodeBuffer
}
