import type { PrismaClient } from '@workspace/db'

export const getTemplateBuffer = async (
    prisma: PrismaClient,
    templateCode: string
): Promise<Buffer<ArrayBuffer>> => {
    const templateFile = await prisma.templateFile.findUniqueOrThrow({
        where: { code: templateCode },
    })

    const res = await fetch(templateFile.path)
    const buffer = await res.arrayBuffer()
    const nodeBuffer = Buffer.from(buffer)

    return nodeBuffer
}
