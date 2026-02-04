import type { PrismaClient } from '@workspace/db'
import { getMinioUrl } from './utils'

export const getTemplateBuffer = async (prisma: PrismaClient, templateCode: string) => {
    const templateFile = await prisma.templateFile.findUnique({
        where: { code: templateCode },
    })

    // if (!templateFile) {
    //     throw new HTTPException(404, { message: `template not found (${templateCode})` })
    // }
    const url = getMinioUrl(templateFile?.path || `/mta/template/${templateCode}`)

    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const nodeBuffer: Buffer<ArrayBuffer> = Buffer.from(buffer)

    return nodeBuffer
}
